#!/bin/bash
set -e

# Anya Pilates Studio - Automated Database Backup Script
# Creates a timestamped compressed PostgreSQL backup

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load DATABASE_URL or DIRECT_URL from .env
if [ -f "$PROJECT_DIR/.env" ]; then
  DATABASE_URL=$(grep -E '^(DIRECT_URL|DATABASE_URL)=' "$PROJECT_DIR/.env" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: Could not find DATABASE_URL in $PROJECT_DIR/.env"
  exit 1
fi

# Define backup storage directory
BACKUP_DIR="${HOME}/db_backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/anyapilates_backup_$TIMESTAMP.sql.gz"

echo "📦 Creating database backup..."
if command -v pg_dump >/dev/null 2>&1; then
  pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_FILE"
else
  # Fallback: if pg_dump is not in PATH, try common postgres path or alert
  if [ -f "/usr/lib/postgresql/16/bin/pg_dump" ]; then
    /usr/lib/postgresql/16/bin/pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_FILE"
  elif [ -f "/usr/lib/postgresql/15/bin/pg_dump" ]; then
    /usr/lib/postgresql/15/bin/pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_FILE"
  elif [ -f "/usr/lib/postgresql/14/bin/pg_dump" ]; then
    /usr/lib/postgresql/14/bin/pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_FILE"
  else
    echo "⚠️ Warning: pg_dump client tool is not installed. Installing postgresql-client..."
    sudo apt-get update -qq && sudo apt-get install -y -qq postgresql-client
    pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip > "$BACKUP_FILE"
  fi
fi

# Verify backup was created and is not empty
if [ -s "$BACKUP_FILE" ]; then
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Backup created successfully: $BACKUP_FILE ($FILE_SIZE)"
else
  echo "❌ Backup failed or produced empty file!"
  exit 1
fi

# Rotate backups: remove files older than 14 days
echo "🧹 Cleaning up backups older than 14 days..."
find "$BACKUP_DIR" -name "anyapilates_backup_*.sql.gz" -mtime +14 -delete || true
echo "✨ Done."
