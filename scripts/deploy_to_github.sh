#!/bin/bash
# deploy_to_github.sh — index.html をGitHubにプッシュし、Cloudflare Pagesにデプロイする

set -euo pipefail

REPO_DIR="/Users/miraikonishi/movie-news-scan"
TARGET_FILE="scripts/output/index.html"
OUTPUT_DIR="scripts/output"

cd "$REPO_DIR"

# 変更があるか確認
# if git diff --quiet -- "$TARGET_FILE" 2>/dev/null; then
#     echo "$(date): No changes in $TARGET_FILE. Skipping."
#     exit 0
# fi

# GitHubにプッシュ
git add .
git commit -m "Update daily news digest for $(date +%Y-%m-%d)"
git push origin main

echo "$(date): Pushed to GitHub."

# Cloudflare Pagesにデプロイ
wrangler pages deploy "$OUTPUT_DIR" --project-name movie-news-scan 2>&1

echo "$(date): Deployed to Cloudflare Pages."
