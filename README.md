# movie-news-scan — Hermes Agent 用 収集スキル

NousResearch Hermes Agent（Mac mini 常駐）に載せる、映画ニュース**収集専用**スキルの一式。
このディレクトリは自己完結。スクリプトは相対パス解決なので、どこに置いても動く。

## 構成

```
movie-news-scan/
├── SKILL.md            # Hermes が読む手順書（判断層：スコアリング・選定基準）
├── learnings.md        # 実行ごとの発見ログ（自己改善用）
├── README.md           # このファイル
└── scripts/            # 収集ロジック（スクリプト層）
    ├── scan-news.sh    # 司令塔：fetch → check-sheet を順に実行
    ├── fetch-news.cjs  # RSS取得（Deadline/Variety/THR/Google News・過去48h・重複除去）
    ├── check-sheet.sh  # Googleシート確認（既出＋政氏さん担当の除外用・読み取り専用）
    ├── config.sh       # 設定（RSSフィード／シートID／共同執筆者／1日4本）
    └── output/         # rss-latest.json の保存先（実行時に自動生成）
```

## Mac mini への同期

ローカル（MacBook Pro / mirai-hq）で編集し、Mac mini の Hermes skills ディレクトリへ同期する。

```bash
# MacBook Pro 側から（Tailscale 経由）
rsync -av --delete \
  ~/mirai-hq/projects/writer/movie-news/hermes/movie-news-scan/ \
  mac-mini-remote:~/.hermes/skills/movie-news-scan/
```

同期後、Mac mini の Hermes で:
- 手動実行: `/movie-news-scan`
- 定期実行: Hermes の cron に「毎朝7時に movie-news-scan を実行して候補を出す」等を自然言語で登録

## 動作確認（どちらのマシンでも）

```bash
bash scripts/scan-news.sh
```

RSS が取得され、Googleシートの直近ヘッドラインと政氏さん担当分が表示されれば成功。

## 範囲（収集のみ）

このスキルは**候補10〜15本の提示まで**。記事執筆・シート書き込み・本文全文取得は含まない（別工程）。
オリジナルの執筆システムは `~/Documents/movie-news-system/`（編集者と共有・移動禁止）。
