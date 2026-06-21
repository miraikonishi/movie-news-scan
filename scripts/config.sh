# ニュース収集エージェント設定

# RSSフィード（映画専用）
RSS_FEEDS=(
  "https://deadline.com/v/film/feed/"
  "https://variety.com/v/film/feed/"
  "https://www.hollywoodreporter.com/c/movies/feed/"
  "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en"
)

# Googleシート（CSV読み取り用）
SHEET_ID="11Soyo4iyCzehkgSwUA8GeBAS8YS8AO3Nc5oKcW1wpMk"
SHEET_GID="1029428574"
SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}"

# 共同執筆者（この人のヘッドラインを除外）
CO_WRITER="政氏"

# 1日の記事数
DAILY_TARGET=4
