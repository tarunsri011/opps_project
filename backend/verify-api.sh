#!/usr/bin/env bash
# API verification for the Food Expiry & Surplus Redistribution backend.
# Usage: ./verify-api.sh   (backend must be running on :8080)
set -u
BASE=${BASE:-http://localhost:8080}
pass=0; fail=0

call() { # method url [json_body] [token]
  local method=$1 url=$2 data=${3:-} token=${4:-}
  local args=(-s -X "$method" -H "Content-Type: application/json" -w $'\n%{http_code}')
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$data" ] && args+=(-d "$data")
  curl "${args[@]}" "$BASE$url" 2>/dev/null
}

expect() { # label expected_code method url [body] [token]
  local label=$1 expected=$2; shift 2
  local out code body
  out=$(call "$@")
  code=$(printf '%s' "$out" | tail -n1)
  body=$(printf '%s' "$out" | sed '$d')
  if [ "$code" = "$expected" ]; then
    echo "PASS  $label ($code)"; pass=$((pass+1))
  else
    echo "FAIL  $label expected=$expected got=$code body=${body:0:200}"; fail=$((fail+1))
  fi
  LAST_BODY=$body
}

field() { printf '%s' "$1" | grep -o "$2" | head -1; }

echo "== Auth =="
expect "no token -> 403" 403 GET /api/food-items
expect "wrong password -> 401" 401 POST /api/auth/login '{"email":"admin@food.org","password":"nope"}'
expect "admin login" 200 POST /api/auth/login '{"email":"admin@food.org","password":"admin123"}'
ADMIN=$(field "$LAST_BODY" '"token":"[^"]*"'); ADMIN=$(printf '%s' "$ADMIN" | cut -d'"' -f4)
expect "donor login" 200 POST /api/auth/login '{"email":"donor@food.org","password":"donor123"}'
DONOR=$(printf '%s' "$(field "$LAST_BODY" '"token":"[^"]*"')" | cut -d'"' -f4)
expect "recipient login" 200 POST /api/auth/login '{"email":"recipient@food.org","password":"recip123"}'
RCP=$(printf '%s' "$(field "$LAST_BODY" '"token":"[^"]*"')" | cut -d'"' -f4)
RCP_ID=$(printf '%s' "$LAST_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
expect "recipient2 login" 200 POST /api/auth/login '{"email":"community@food.org","password":"recip123"}'
RCP2=$(printf '%s' "$(field "$LAST_BODY" '"token":"[^"]*"')" | cut -d'"' -f4)
expect "register new donor" 201 POST /api/auth/register '{"name":"Bakery Two","email":"donor2@food.org","password":"donor123","role":"DONOR"}'
DONOR2=$(printf '%s' "$(field "$LAST_BODY" '"token":"[^"]*"')" | cut -d'"' -f4)
expect "duplicate register -> 409" 409 POST /api/auth/register '{"name":"Dup","email":"donor2@food.org","password":"donor123","role":"DONOR"}'
expect "admin self-register -> 400" 400 POST /api/auth/register '{"name":"A","email":"a@b.org","password":"secret1","role":"ADMIN"}'

echo "== Food items =="
expect "GET all (admin)" 200 GET /api/food-items "" "$ADMIN"
expect "GET all (recipient)" 200 GET /api/food-items "" "$RCP"
expect "GET expiring-soon (admin)" 200 GET /api/food-items/expiring-soon "" "$ADMIN"
expect "expiring-soon donor -> 403" 403 GET /api/food-items/expiring-soon "" "$DONOR"
expect "GET surplus (recipient)" 200 GET /api/food-items/surplus "" "$RCP"
expect "POST item (donor)" 201 POST /api/food-items \
  "{\"name\":\"Croissants\",\"category\":\"Bakery\",\"quantity\":12,\"unit\":\"pcs\",\"expiryDate\":\"2026-10-31\",\"locationStored\":\"Counter\",\"status\":\"SURPLUS\"}" "$DONOR"
ITEM=$(printf '%s' "$LAST_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
expect "POST item (recipient -> 403)" 403 POST /api/food-items \
  '{"name":"X","category":"Y","quantity":1,"unit":"u","expiryDate":"2026-11-01"}' "$RCP"
expect "PUT own item (donor)" 200 PUT "/api/food-items/$ITEM" \
  "{\"name\":\"Croissants XL\",\"category\":\"Bakery\",\"quantity\":12,\"unit\":\"pcs\",\"expiryDate\":\"2026-10-31\",\"locationStored\":\"Counter\",\"status\":\"SURPLUS\"}" "$DONOR"
expect "PUT foreign item (donor2 -> 403)" 403 PUT "/api/food-items/$ITEM" \
  '{"name":"Hacked","category":"Bakery","quantity":1,"unit":"pcs","expiryDate":"2026-10-31"}' "$DONOR2"
expect "DELETE (donor -> 403)" 403 DELETE "/api/food-items/$ITEM" "" "$DONOR"

echo "== Recipients =="
expect "GET recipients (admin)" 200 GET /api/recipients "" "$ADMIN"
expect "GET recipients (donor -> 403)" 403 GET /api/recipients "" "$DONOR"
expect "POST recipient (admin)" 201 POST /api/recipients \
  '{"name":"Night Shelter","email":"night@shelter.org","password":"shelter1","role":"RECIPIENT"}' "$ADMIN"

echo "== Donations =="
expect "GET donations (admin)" 200 GET /api/donations "" "$ADMIN"
expect "GET donations (donor)" 200 GET /api/donations "" "$DONOR"
expect "GET donations (recipient)" 200 GET /api/donations "" "$RCP"
expect "match non-surplus -> 400" 400 POST /api/donations/match \
  "{\"foodItemId\":1,\"recipientId\":$RCP_ID}" "$ADMIN"
expect "POST match (admin)" 201 POST /api/donations/match \
  "{\"foodItemId\":$ITEM,\"recipientId\":$RCP_ID}" "$ADMIN"
MATCH=$(printf '%s' "$LAST_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
expect "match same item again -> 409" 409 POST /api/donations/match \
  "{\"foodItemId\":$ITEM,\"recipientId\":$RCP_ID}" "$ADMIN"
expect "POST match (donor -> 403)" 403 POST /api/donations/match \
  "{\"foodItemId\":$ITEM,\"recipientId\":$RCP_ID}" "$DONOR"
expect "status by non-owner -> 403" 403 PUT "/api/donations/$MATCH/status" '{"status":"CONFIRMED"}' "$RCP2"
expect "confirm match (owner)" 200 PUT "/api/donations/$MATCH/status" '{"status":"CONFIRMED"}' "$RCP"
expect "status by donor -> 403" 403 PUT "/api/donations/$MATCH/status" '{"status":"COMPLETED"}' "$DONOR"

echo "== Pickups =="
expect "GET pickups (recipient)" 200 GET /api/pickups "" "$RCP"
expect "GET pickups (donor -> 403)" 403 GET /api/pickups "" "$DONOR"
expect "POST pickup (non-owner -> 403)" 403 POST /api/pickups \
  "{\"donationMatchId\":$MATCH,\"scheduledAt\":\"2026-10-31T10:00:00\"}" "$RCP2"
expect "POST pickup (owner)" 201 POST /api/pickups \
  "{\"donationMatchId\":$MATCH,\"scheduledAt\":\"2026-10-31T10:00:00\",\"notes\":\"Gate 2\"}" "$RCP"
PICKUP=$(printf '%s' "$LAST_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
expect "complete (recipient -> 403)" 403 PUT "/api/pickups/$PICKUP/complete" "" "$RCP"
expect "complete (admin)" 200 PUT "/api/pickups/$PICKUP/complete" "" "$ADMIN"

echo "== Statistics & waste =="
expect "GET statistics (admin)" 200 GET /api/statistics "" "$ADMIN"
expect "statistics (donor -> 403)" 403 GET /api/statistics "" "$DONOR"
expect "POST waste-log (admin)" 200 POST /api/waste-log \
  '{"foodItemId":1,"quantity":20,"reason":"Mould found"}' "$ADMIN"
expect "waste-log (donor -> 403)" 403 POST /api/waste-log \
  '{"foodItemId":1,"quantity":1,"reason":"x"}' "$DONOR"

echo "== CORS preflight =="
if curl -s -i -X OPTIONS "$BASE/api/auth/login" \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: authorization,content-type" \
  | grep -qi "access-control-allow-origin: http://localhost:5173"; then
  echo "PASS  CORS preflight allows :5173"; pass=$((pass+1))
else
  echo "FAIL  CORS preflight"; fail=$((fail+1))
fi

echo
echo "RESULT: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
