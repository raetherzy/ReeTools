#!/bin/bash
# TikTok User Posts API — Server Deployment Script
# Jalankan dengan: sudo bash deploy.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo "============================================"
echo "  TikTok User Posts API — Deploy"
echo "============================================"
echo

# ── 1. Generate API key ─────────────────────────────────────────────────
API_KEY_FILE="/var/www/tiktok-api/.env"

if [ ! -f "$API_KEY_FILE" ]; then
    API_KEY=$(openssl rand -hex 32)
    mkdir -p /var/www/tiktok-api
    echo "API_KEY=$API_KEY" > "$API_KEY_FILE"
    chmod 600 "$API_KEY_FILE"
    log "API key generated: $API_KEY"
    echo "  >> COPY THIS KEY to .env.local (TIKTOK_API_KEY)"
    echo "  >> ADD to Vercel Env: TIKTOK_API_KEY=$API_KEY"
    echo
else
    warn "API key already exists at $API_KEY_FILE"
fi

# ── 2. Copy PHP file ────────────────────────────────────────────────────
if [ -f "index.php" ]; then
    cp index.php /var/www/tiktok-api/index.php
    chown www-data:www-data /var/www/tiktok-api/index.php
    chmod 644 /var/www/tiktok-api/index.php
    log "PHP file deployed to /var/www/tiktok-api/index.php"
else
    err "index.php not found in current directory. Copy it first!"
fi

# ── 3. Nginx config ────────────────────────────────────────────────────
if [ -f "tiktok-api.conf" ]; then
    cp tiktok-api.conf /etc/nginx/sites-available/tiktok-api
    ln -sf /etc/nginx/sites-available/tiktok-api /etc/nginx/sites-enabled/tiktok-api

    # Remove default if exists
    rm -f /etc/nginx/sites-enabled/default

    nginx -t && systemctl reload nginx
    log "Nginx configured and reloaded"
else
    warn "tiktok-api.conf not found. Skipping Nginx config."
fi

# ── 4. Firewall ─────────────────────────────────────────────────────────
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    log "Firewall: port 80 and 443 allowed"
fi

# ── 5. Redis check ──────────────────────────────────────────────────────
if systemctl is-active --quiet redis-server 2>/dev/null || systemctl is-active --quiet redis 2>/dev/null; then
    log "Redis is running"
else
    warn "Redis not running. Install with: apt install redis-server"
fi

# ── 6. Test ─────────────────────────────────────────────────────────────
echo
echo "Testing endpoint..."
sleep 1
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: $(grep API_KEY $API_KEY_FILE | cut -d= -f2)" "http://localhost/?username=khaby.lame&limit=3")
if [ "$RESPONSE" = "200" ]; then
    log "Endpoint test: HTTP 200 OK!"
else
    warn "Endpoint test: HTTP $RESPONSE (check /var/log/nginx/tiktok-api-error.log)"
fi

echo
echo "============================================"
echo "  DEPLOYMENT COMPLETE"
echo "============================================"
echo "Server URL: http://62.146.237.6/"
echo "API Key:    $(grep API_KEY $API_KEY_FILE | cut -d= -f2)"
echo
echo "Next Step — on your local machine:"
echo "  1. Edit .env.local: TIKTOK_SERVER_URL=http://62.146.237.6"
echo "  2. Edit .env.local: TIKTOK_API_KEY=<key above>"
echo "  3. Add to Vercel dashboard: Settings > Environment Variables"
echo "  4. run: npm run dev"
echo
