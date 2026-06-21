#!/usr/bin/env node
/**
 * 映画ニュースRSS収集スクリプト
 * Deadline / Variety / THR / Google News Entertainment の映画RSSを取得し、過去24〜48時間の記事を抽出
 * 出力: scripts/output/rss-latest.json
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const FEEDS = [
  { name: 'Deadline', url: 'https://deadline.com/v/film/feed/' },
  { name: 'Variety', url: 'https://variety.com/v/film/feed/' },
  { name: 'THR', url: 'https://www.hollywoodreporter.com/c/movies/feed/' },
  { name: 'Google News', url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en' },
];

// 過去48時間以内の記事のみ（余裕を持たせる）
const HOURS_BACK = 48;
const cutoff = new Date(Date.now() - HOURS_BACK * 60 * 60 * 1000);

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (news-reader)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// HTML 実体参照（名前付き＋数値）をデコードする
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘',
  rsquor: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»',
  copy: '©', reg: '®', trade: '™', deg: '°', eacute: 'é', egrave: 'è',
};
function decodeEntities(s) {
  if (!s) return '';
  // 2パス: Google News は &amp;nbsp; のような二重エンコードがあるため
  const pass = (t) => t
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name in NAMED_ENTITIES ? NAMED_ENTITIES[name] : m));
  return pass(pass(s));
}

function parseItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? (m[1] || m[2] || '').trim() : '';
    };
    const pubDate = new Date(get('pubDate'));
    if (pubDate < cutoff) continue;

    // description: 先に実体参照をデコード → タグ除去（順序が逆だとエンコード済みHTMLが残る）
    let desc = get('description');
    desc = decodeEntities(desc).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    // 長すぎる場合は切り詰め
    if (desc.length > 300) desc = desc.substring(0, 300) + '...';

    items.push({
      title: decodeEntities(get('title')),
      link: get('link'),
      description: desc,
      pubDate: pubDate.toISOString(),
      categories: [],
    });

    // カテゴリ取得
    const catRegex = /<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/g;
    let catMatch;
    while ((catMatch = catRegex.exec(block)) !== null) {
      items[items.length - 1].categories.push(catMatch[1].trim());
    }
  }
  return items;
}

// 映画関連シグナル（Google News の総合エンタメ枠から映画ニュースだけを残すための whitelist）
const MOVIE_SIGNALS = /\b(films?|movies?|cinema|box office|trailer|teaser|sequel|prequel|reboot|remake|spin-?off|director|directed by|screenplay|screenwriter|filmmaker|casting|recast|premiere|biopic|franchise|theatrical|theaters?|theatres?|release date|adaptation|adapt(?:s|ed|ing)?|stars? in|to (?:play|star|direct)|oscars?|academy award|cannes|sundance|venice film|a24|pixar|marvel|dc studios|lucasfilm|blumhouse|focus features|searchlight|warner bros|universal pictures|paramount pictures|sony pictures|walt disney|studio ghibli|anime film)\b/i;
function isMovieRelated(item) {
  return MOVIE_SIGNALS.test(`${item.title} ${item.description}`);
}

async function main() {
  const allItems = [];

  for (const feed of FEEDS) {
    try {
      process.stderr.write(`取得中: ${feed.name}...\n`);
      const xml = await fetch(feed.url);
      let items = parseItems(xml);
      items.forEach(item => item.source = feed.name);
      // Google News は総合エンタメ枠でゴシップ等が混じる。映画関連だけに絞る。
      // （Deadline/Variety/THR は /film/ 専用フィードなのでそのまま全件残す）
      if (feed.name === 'Google News') {
        const before = items.length;
        items = items.filter(isMovieRelated);
        process.stderr.write(`  → ${before}件 → ${items.length}件（映画関連フィルタ適用）\n`);
      } else {
        process.stderr.write(`  → ${items.length}件（過去${HOURS_BACK}時間）\n`);
      }
      allItems.push(...items);
    } catch (e) {
      process.stderr.write(`  ✗ ${feed.name}: ${e.message}\n`);
    }
  }

  // 日付順（新しい順）
  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // 重複除去（同じURLまたは非常に似たタイトル）
  const seen = new Set();
  const unique = allItems.filter(item => {
    const key = item.link.replace(/\/$/, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 出力
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  const outputPath = path.join(outputDir, 'rss-latest.json');
  fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2));

  process.stderr.write(`\n合計: ${unique.length}件 → ${outputPath}\n`);

  // 要約もstdoutに出力（Claude Codeが読めるように）
  console.log(`# RSS取得結果（過去${HOURS_BACK}時間）\n`);
  console.log(`合計: ${unique.length}件\n`);
  unique.forEach((item, i) => {
    console.log(`## ${i + 1}. [${item.source}] ${item.title}`);
    console.log(`URL: ${item.link}`);
    console.log(`日時: ${item.pubDate}`);
    if (item.description) console.log(`概要: ${item.description}`);
    console.log('');
  });
}

main().catch(e => { process.stderr.write(`エラー: ${e.message}\n`); process.exit(1); });
