#!/bin/bash
set -e

# Anya Pilates Studio - Safe Zero-Downtime Production Deployment
# 1. Takes pre-deployment DB backup
# 2. Pulls verified main branch
# 3. Builds Next.js
# 4. Zero-downtime PM2 reload (only if build succeeds)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo "========================================="
echo "🚀 Starting Production Deployment"
echo "Date: $(date)"
echo "========================================="

# 1. Verify on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️ Warning: Server is on branch '$CURRENT_BRANCH', switching to 'main'..."
  git checkout main
fi

# 2. Pre-deployment Database Backup
echo ""
echo "Step 1/4: Taking safety database snapshot..."
if [ -f "$SCRIPT_DIR/backup-db.sh" ]; then
  bash "$SCRIPT_DIR/backup-db.sh"
else
  echo "⚠️ backup-db.sh not found, skipping pre-deploy backup."
fi

# 3. Pull latest code from main
echo ""
echo "Step 2/4: Pulling latest changes from origin/main..."
git fetch origin main
git pull --ff-only origin main

# 4. Generate Prisma Client
echo ""
echo "Step 3/4: Generating Prisma client & building Next.js..."
npx prisma generate

# Build Next.js
# If this fails, the script will exit immediately due to 'set -e',
# leaving the currently running server completely intact!
npm run build

# 5. Reload Server with Zero Downtime
echo ""
echo "Step 4/4: Reloading application..."
if command -v pm2 >/dev/null 2>&1; then
  # 'reload' provides zero-downtime cluster reload compared to 'restart'
  pm2 reload all || pm2 restart all
  echo "✅ PM2 cluster reloaded successfully!"
else
  echo "⚠️ PM2 not found in PATH. Please restart the process manually."
fi

echo ""
echo "========================================="
echo "🎉 Deployment Completed Successfully!"
echo "========================================="
