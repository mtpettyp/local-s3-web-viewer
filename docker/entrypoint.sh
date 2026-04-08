#!/bin/sh
cat > /usr/share/nginx/html/config.js << EOF
window.__CONFIG__ = {
  endpoint: "${S3_ENDPOINT:-http://localhost:4566}",
  accessKeyId: "${AWS_ACCESS_KEY_ID:-test}",
  secretAccessKey: "${AWS_SECRET_ACCESS_KEY:-test}",
  region: "${AWS_REGION:-us-east-1}"
};
EOF
exec nginx -g 'daemon off;'
