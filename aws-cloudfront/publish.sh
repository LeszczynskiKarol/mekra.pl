#!/usr/bin/env bash
# Publikuje funkcję CloudFront mekra-trailing-slash-301 (viewer-request, www.mekra.pl).
# Deploy strony (GitHub Actions) jej NIE wgrywa — trzeba odpalić ręcznie:
#   bash aws-cloudfront/publish.sh
# Login:hasło do /zamowienie/ leży w SSM /mekra/ZAMOWIENIE_BASIC_AUTH (SecureString,
# format "login:haslo") i jest wstawiane w miejsce placeholdera tylko w pliku tymczasowym.
set -euo pipefail
cd "$(dirname "$0")"

NAME=mekra-trailing-slash-301
SRC=trailing-slash-redirect.js
TMP=fn.tmp.js
trap 'rm -f "$TMP" etag.tmp' EXIT

CREDS=$(MSYS_NO_PATHCONV=1 aws ssm get-parameter --region eu-central-1 --name /mekra/ZAMOWIENIE_BASIC_AUTH \
  --with-decryption --query Parameter.Value --output text)
B64=$(printf '%s' "$CREDS" | base64 | tr -d '\n')
tr -d '\r' < "$SRC" | sed "s#__ZAMOWIENIE_BASIC_AUTH__#${B64}#" > "$TMP"
grep -q '__ZAMOWIENIE_BASIC_AUTH__' "$TMP" && { echo "placeholder nie podmieniony" >&2; exit 1; }

ETAG=$(aws cloudfront describe-function --name "$NAME" --query ETag --output text)
ETAG=$(MSYS_NO_PATHCONV=1 aws cloudfront update-function --name "$NAME" --if-match "$ETAG" \
  --function-config Comment="trailing slash + 301 + basic auth /zamowienie",Runtime=cloudfront-js-1.0 \
  --function-code "fileb://$TMP" --query ETag --output text)

# Szybki test na etapie DEVELOPMENT: /zamowienie/ bez nagłówka musi dać 401.
cat > etag.tmp <<'JSON'
{"version":"1.0","context":{"eventType":"viewer-request"},"viewer":{"ip":"1.2.3.4"},
 "request":{"method":"GET","uri":"/zamowienie/","querystring":{},"headers":{},"cookies":{}}}
JSON
STATUS=$(aws cloudfront test-function --name "$NAME" --if-match "$ETAG" --stage DEVELOPMENT \
  --event-object fileb://etag.tmp --query 'TestResult.FunctionOutput' --output text \
  | grep -o '"statusCode":[0-9]*' || true)
echo "test /zamowienie/ bez hasła → $STATUS"
[ "$STATUS" = '"statusCode":401' ] || { echo "test nie przeszedł, NIE publikuję" >&2; exit 1; }

aws cloudfront publish-function --name "$NAME" --if-match "$ETAG" \
  --query 'FunctionSummary.Status' --output text
