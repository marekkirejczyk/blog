#!/bin/bash
set -e

SERVER="deploy@arbiter.zkmarek.com"
SSH="ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes"
RSYNC="rsync -avz --delete --exclude='data/' --exclude='.env' --exclude='node_modules/'"

$RSYNC -e "$SSH" comments/ "$SERVER:/var/www/comments/"
$SSH "$SERVER" "cd /var/www/comments && npm install --omit=dev && sudo systemctl restart comments"
