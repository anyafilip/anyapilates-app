#!/bin/bash
set -e

# Anya Pilates Studio - Database Restore Script
# Restores a .sql.gz backup into PostgreSQL

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: bash scripts/restore-db.sh <path_to_backup.sql.gz>"
  echo ""
  echo "Available backups in ~/db_backups:"
  ls -lh "${HOME}/db_backups" 2>/dev/null || echo "No backups found."
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Load DATABASE_URL
if [ -f "$PROJECT_DIR/.env" ]; then
  DATABASE_URL=$(grep -E '^(DIRECT_URL|DATABASE_URL)=' "$PROJECT_DIR/.env" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: Could not find DATABASE_URL in $PROJECT_DIR/.env"
  exit 1
fi

echo "⚠️ WARNING: You are about to restore the database from: $BACKUP_FILE"
echo "This will overwrite existing database records!"
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "⏳ Restoring database..."
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"

echo "✅ Database restored successfully from: $BACKUP_FILE"
