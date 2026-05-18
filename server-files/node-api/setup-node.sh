#!/bin/bash
# Setup script — dijalankan dari /root/server-files/node-api/
# sudo bash setup-node.sh

set -e
GREEN='\033[0;32m'; NC='\033[0m'
log() { echo -e "${GREEN}[OK]${NC} $1"; }

echo "=== TikTok API Node.js Setup ==="
echo

# 1. Node.js 20
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    log "Node.js $(node -v)"
else
    log "Node.js $(node -v) already installed"
fi

# 2. PM2
if ! command -v pm2 &>/dev/null; then
    npm install -g pm2
    log "PM2 installed"
fi

# 3. Project
mkdir -p /var/www/tiktok-api
cp package.json server.js /var/www/tiktok-api/
cd /var/www/tiktok-api
npm install --production
log "Dependencies installed"

# 4. Start via PM2
pm2 delete tiktok-api 2>/dev/null || true
pm2 start server.js --name tiktok-api --time
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
log "PM2 started"

# 5. Firewall — open port 3002
ufw allow 3002/tcp 2>/dev/null || true
log "Port 3002 open"

# 6. Restore video-api if needed
if [ -f /etc/nginx/sites-available/video-api ] && [ ! -L /etc/nginx/sites-enabled/video-api ]; then
    ln -s /etc/nginx/sites-available/video-api /etc/nginx/sites-enabled/video-api
    nginx -t && systemctl reload nginx
    log "video-api restored"
fi

# 7. Test
sleep 2
API_KEY=$(grep API_KEY /var/www/tiktok-api/.env 2>/dev/null | cut -d= -f2 || echo "")
CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002/?username=test&limit=1&key=${API_KEY}" 2>/dev/null || echo "000")
log "Test: HTTP $CODE (200/404 = OK)"

echo
echo "=== DONE ==="
echo "API:    http://62.146.237.6:3002/?username=xxx&limit=30&key=$API_KEY"
echo "PM2:    pm2 status | pm2 logs tiktok-api"
echo "NO Nginx proxy — direct Node.js port 3001, tidak bentrok video-api"
