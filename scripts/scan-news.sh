#!/bin/bash
#
# ニュース収集メインスクリプト
# RSS取得 + Googleシート重複チェック を一括実行
# 使い方: bash scripts/scan-news.sh
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  映画ニュース収集エージェント"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. RSS取得
echo "【1/2】RSSフィード取得中..."
node "$SCRIPT_DIR/fetch-news.cjs"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 2. Googleシート確認
echo "【2/2】Googleシート確認中..."
bash "$SCRIPT_DIR/check-sheet.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "以上のデータをもとに、候補を選定してください。"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
