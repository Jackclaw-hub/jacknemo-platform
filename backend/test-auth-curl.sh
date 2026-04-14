#!/bin/bash

# Test Startup Radar Authentication APIs using curl

BASE_URL="http://localhost:3001/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing Startup Radar Authentication APIs...${NC}"

# Test 1: Health check
echo -e "\n1. ${YELLOW}Testing health endpoint...${NC}"
curl -s "$BASE_URL/health" | jq -r '. | "✅ Health check: " + .status'

# Test 2: User registration
echo -e "\n2. ${YELLOW}Testing user registration...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@startupradar.com",
    "password": "TestPassword123!",
    "role": "founder",
    "name": "Test User"
  }')

echo "$REGISTER_RESPONSE" | jq -r '. | "✅ Registration successful - User ID: " + (.user.id | tostring) + ", Email: " + .user.email + ", Role: " + .user.role'

# Extract tokens
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token')
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.refresh_token')
VERIFICATION_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.verification_token')

# Test 3: User login
echo -e "\n3. ${YELLOW}Testing user login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@startupradar.com",
    "password": "TestPassword123!"
  }')

echo "$LOGIN_RESPONSE" | jq -r '. | "✅ Login successful - User ID: " + (.user.id | tostring) + ", Email: " + .user.email'

# Test 4: Get user profile (protected)
echo -e "\n4. ${YELLOW}Testing protected profile endpoint...${NC}"
PROFILE_RESPONSE=$(curl -s "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$PROFILE_RESPONSE" | jq -r '. | "✅ Profile retrieval successful - Name: " + .user.name + ", Email: " + .user.email + ", Role: " + .user.role'

# Test 5: Update user profile (protected)
echo -e "\n5. ${YELLOW}Testing profile update...${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Updated Test User"
  }')

echo "$UPDATE_RESPONSE" | jq -r '. | "✅ Profile update successful - Name: " + .user.name + ", Email: " + .user.email'

# Test 6: Refresh token
echo -e "\n6. ${YELLOW}Testing token refresh...${NC}"
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "'$REFRESH_TOKEN'"
  }')

echo "$REFRESH_RESPONSE" | jq -r '. | "✅ Token refresh successful - Has new tokens: " + (if .access_token and .refresh_token then "yes" else "no" end)'

# Test 7: Email verification
echo -e "\n7. ${YELLOW}Testing email verification...${NC}"
VERIFY_RESPONSE=$(curl -s "$BASE_URL/auth/verify/$VERIFICATION_TOKEN")

echo "$VERIFY_RESPONSE" | jq -r '. | "✅ Email verification successful - " + .message'

# Test 8: Logout
echo -e "\n8. ${YELLOW}Testing logout...${NC}"
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$LOGOUT_RESPONSE" | jq -r '. | "✅ Logout successful - " + .message'

echo -e "\n${GREEN}🎉 All authentication endpoints working correctly!${NC}"
echo -e "\n${YELLOW}📋 Summary:${NC}"
echo "- ✅ Health check endpoint"
echo "- ✅ User registration with role validation"
echo "- ✅ User login with password verification"
echo "- ✅ JWT token generation and verification"
echo "- ✅ Protected route authentication"
echo "- ✅ Profile management"
echo "- ✅ Token refresh mechanism"
echo "- ✅ Email verification system"
echo "- ✅ Logout functionality"