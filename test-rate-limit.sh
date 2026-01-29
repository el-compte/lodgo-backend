#!/bin/bash

# Webhook Rate Limit Manual Test Script
# This script sends multiple requests to test rate limiting

# Configuration
URL="http://localhost:4000/webhooks/hostaway"
SECRET="${HOSTAWAY_WEBHOOK_SECRET:-test-webhook-secret}"
BODY='{"event":"listing.updated","data":{"id":"12345"}}'
NUM_REQUESTS="${1:-105}"  # Default to 105 requests (should hit limit at 101)

echo "🔒 Testing Webhook Rate Limiting"
echo "================================"
echo "URL: $URL"
echo "Requests to send: $NUM_REQUESTS"
echo "Expected limit: 100 requests/minute"
echo ""

# Calculate signature
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

# Counters
success_count=0
rate_limited_count=0
error_count=0

echo "Sending requests..."
for i in $(seq 1 $NUM_REQUESTS); do
  response=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
    -H "Content-Type: application/json" \
    -H "x-hostaway-signature: $SIGNATURE" \
    -d "$BODY")
  
  http_code=$(echo "$response" | tail -n 1)
  
  if [ "$http_code" = "200" ]; then
    success_count=$((success_count + 1))
    echo -n "✓"
  elif [ "$http_code" = "429" ]; then
    rate_limited_count=$((rate_limited_count + 1))
    echo -n "⚠"
    
    # Show first rate limit response
    if [ $rate_limited_count -eq 1 ]; then
      echo ""
      echo ""
      echo "📛 Rate Limit Hit! Response:"
      echo "$response" | head -n -1 | jq '.' 2>/dev/null || echo "$response" | head -n -1
      echo ""
    fi
  else
    error_count=$((error_count + 1))
    echo -n "✗"
  fi
  
  # Print progress every 10 requests
  if [ $((i % 10)) -eq 0 ]; then
    echo " ($i/$NUM_REQUESTS)"
  fi
done

echo ""
echo ""
echo "📊 Results:"
echo "================================"
echo "✅ Successful (200):    $success_count"
echo "⚠️  Rate Limited (429): $rate_limited_count"
echo "❌ Errors (other):      $error_count"
echo ""

if [ $success_count -eq 100 ] && [ $rate_limited_count -gt 0 ]; then
  echo "✅ Rate limiting is working correctly!"
else
  echo "⚠️  Unexpected results. Check your configuration."
fi
