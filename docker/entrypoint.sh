#!/bin/sh
S3_ENDPOINT="${S3_ENDPOINT:-http://localhost:4566}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Generate runtime config (credentials + region only; S3 calls go through nginx proxy)
cat > /usr/share/nginx/html/config.js << 'TEMPLATE'
window.__CONFIG__ = {
  accessKeyId: "__AWS_ACCESS_KEY_ID__",
  secretAccessKey: "__AWS_SECRET_ACCESS_KEY__",
  region: "__AWS_REGION__"
};
TEMPLATE

sed -i "s|__AWS_ACCESS_KEY_ID__|${AWS_ACCESS_KEY_ID}|g" /usr/share/nginx/html/config.js
sed -i "s|__AWS_SECRET_ACCESS_KEY__|${AWS_SECRET_ACCESS_KEY}|g" /usr/share/nginx/html/config.js
sed -i "s|__AWS_REGION__|${AWS_REGION}|g" /usr/share/nginx/html/config.js

# Inject S3 endpoint into nginx proxy config
sed -i "s|__S3_ENDPOINT__|${S3_ENDPOINT}|g" /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
