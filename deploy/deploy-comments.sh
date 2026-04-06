#!/bin/bash
set -e

SERVER="deploy@arbiter.zkmarek.com"
SSH="ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes"

rsync -avz --delete \
  --exclude='data/' \
  --exclude='.env' \
  --exclude='.env.backup' \
  --exclude='node_modules/' \
  -e "$SSH" \
  comments/ "$SERVER:/var/www/comments/"

$SSH "$SERVER" "cd /var/www/comments && npm install --omit=dev && sudo systemctl restart comments"
