#!/bin/bash
# deploy_to_github.sh — index.html をGitHubにプッシュしてCloudflare Pagesデプロイをトリガーする

set -euo pipefail

REPO_DIR="/Users/miraikonishi/movie-news-scan"
TARGET_FILE="scripts/output/index.html"

cd "$REPO_DIR"

# 最新の状態に更新
git pull --rebase origin main

# 変更があるか確認
if git diff --quiet -- "$TARGET_FILE"; then
    echo "$(date): No changes in $TARGET_FILE. Skipping."
    exit 0
fi

# ステージング・コミット・プッシュ
git add "$TARGET_FILE"
git commit -m "Update daily news digest for $(date +%Y-%m-%d)"
git push origin main

echo "$(date): Successfully pushed update to GitHub."
