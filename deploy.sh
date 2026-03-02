#!/bin/bash
# Szybki deploy strony mekra.pl
# Użycie: ./deploy.sh

set -e

CF_WWW_DIST_ID="E26WECN75Q2HTH"

echo ">>> Build..."
npm run build

echo ">>> Upload assets (long cache)..."
aws s3 sync dist/ s3://www.mekra.pl/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "robots.txt" \
  --exclude "sitemap*.xml"

echo ">>> Upload HTML (no cache)..."
aws s3 sync dist/ s3://www.mekra.pl/ \
  --cache-control "public, max-age=0, must-revalidate" \
  --exclude "*" \
  --include "*.html" \
  --include "robots.txt" \
  --include "sitemap*.xml"

echo ">>> Invalidacja CloudFront..."
aws cloudfront create-invalidation \
  --distribution-id $CF_WWW_DIST_ID \
  --paths "/*" > /dev/null

echo "✅ Deploy gotowy! https://www.mekra.pl"
