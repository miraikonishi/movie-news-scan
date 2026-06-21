#!/bin/bash
#
# Googleシートから既存ヘッドラインを取得し、重複チェック用に出力
# 使い方: bash scripts/check-sheet.sh
#

source "$(dirname "$0")/config.sh"

echo "# Googleシート既存ヘッドライン"
echo ""

# CSV取得（リダイレクト追従）
csv=$(curl -sL "$SHEET_CSV_URL" 2>/dev/null)

if [ -z "$csv" ]; then
  echo "⚠ シートの取得に失敗しました"
  exit 1
fi

# 直近の項目のみ表示（最後の30行）
echo "## 直近のヘッドライン（政氏さんの選択を含む）"
echo ""
echo "$csv" | tail -30
echo ""

# 政氏さんが担当している記事を抽出
echo "## 政氏さんが担当中（被り注意）"
echo ""
echo "$csv" | grep "${CO_WRITER}" | tail -20
