#!/bin/sh
S3_ENDPOINT="${S3_ENDPOINT:-http://localhost:4566}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
AWS_REGION="${AWS_REGION:-us-east-1}"

cat > /usr/share/nginx/html/config.js << 'TEMPLATE'
window.__CONFIG__ = {
  endpoint: "__S3_ENDPOINT__",
  accessKeyId: "__AWS_ACCESS_KEY_ID__",
  secretAccessKey: "__AWS_SECRET_ACCESS_KEY__",
  region: "__AWS_REGION__"
};
TEMPLATE

sed -i "s|__S3_ENDPOINT__|${S3_ENDPOINT}|g" /usr/share/nginx/html/config.js
sed -i "s|__AWS_ACCESS_KEY_ID__|${AWS_ACCESS_KEY_ID}|g" /usr/share/nginx/html/config.js
sed -i "s|__AWS_SECRET_ACCESS_KEY__|${AWS_SECRET_ACCESS_KEY}|g" /usr/share/nginx/html/config.js
sed -i "s|__AWS_REGION__|${AWS_REGION}|g" /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'
