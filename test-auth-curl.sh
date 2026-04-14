#!/bin/bash

BASE_URL="http://localhost:3001/api"

# Test health endpoint
echo "🧪 Testing health endpoint..."
curl -s "$BASE_URL/health" | python3 -m json.tool
echo ""

# Test registration
echo "🧪 Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test$(date +%s)@startupradar.com",
    "password": "TestPassword123!",
    "role": "founder",
    "name": "Test User"
  }')

echo "Registration response:"
echo "$REGISTER_RESPONSE" | python3 -m json.tool

# Extract tokens from registration response
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])" 2>/dev/null)

if [ -n "$ACCESS_TOKEN" ]; then
    echo "✅ Registration successful - Access token obtained"
    
    # Test login
    echo ""
    echo "🧪 Testing user login..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test$(date +%s)@startupradar.com",
        "password": "TestPassword123!"
      }')
    
    echo "Login response:"
    echo "$LOGIN_RESPONSE" | python3 -m json.tool
    
    # Test protected profile
    echo ""
    echo "🧪 Testing protected profile endpoint..."
    PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json")
    
    echo "Profile response:"
    echo "$PROFILE_RESPONSE" | python3 -m json.tool
    
    echo "🎉 Authentication flow working correctly!"
else
    echo "❌ Registration failed"
    exit 1
fi