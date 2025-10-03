#!/bin/bash

# PlusAlpha Local Testing Script
echo "🧪 Testing PlusAlpha Local Functionality..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (Status: $response)${NC}"
        return 1
    fi
}

# Function to test API with data
test_api_endpoint() {
    local url=$1
    local description=$2
    local method=${3:-GET}
    local data=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" "$url")
    else
        response=$(curl -s "$url")
    fi
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Response: $response"
        return 1
    fi
}

echo "1. Testing Backend Health..."
echo "---------------------------"
test_endpoint "http://localhost:3001/health" "Backend Health Check"

echo ""
echo "2. Testing API Documentation..."
echo "-------------------------------"
test_endpoint "http://localhost:3001/api" "API Documentation"

echo ""
echo "3. Testing Stock Data..."
echo "------------------------"
test_endpoint "http://localhost:3001/api/stocks/AAPL" "Stock Data (AAPL)"
test_endpoint "http://localhost:3001/api/stocks/search?query=AAPL" "Stock Search"
test_endpoint "http://localhost:3001/api/stocks/overview" "Market Overview"

echo ""
echo "4. Testing User Authentication..."
echo "---------------------------------"
# Register a test user
register_data='{"email":"test'$(date +%s)'@example.com","password":"Test123!","firstName":"Test","lastName":"User","riskTolerance":"moderate"}'
test_api_endpoint "http://localhost:3001/api/auth/register" "User Registration" "POST" "$register_data"

echo ""
echo "5. Testing Frontend..."
echo "----------------------"
test_endpoint "http://localhost:5173" "Frontend Homepage"

echo ""
echo "6. Testing WebSocket Connection..."
echo "----------------------------------"
# Test WebSocket connection
echo -n "Testing WebSocket... "
if command -v node &> /dev/null; then
    node -e "
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:3001/ws');
    let connected = false;
    
    ws.on('open', () => {
        connected = true;
        ws.close();
    });
    
    ws.on('error', () => {
        process.exit(1);
    });
    
    setTimeout(() => {
        if (connected) {
            console.log('✅ PASS');
            process.exit(0);
        } else {
            console.log('❌ FAIL');
            process.exit(1);
        }
    }, 2000);
    " 2>/dev/null
else
    echo -e "${YELLOW}⚠️  SKIP (Node.js not available)${NC}"
fi

echo ""
echo "7. Testing Database Connection..."
echo "---------------------------------"
echo -n "Testing MongoDB connection... "
if curl -s "http://localhost:3001/health" | grep -q '"mongodb":true'; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

echo ""
echo "8. Testing AI Features..."
echo "-------------------------"
echo -n "Testing AI Trading Signal (Demo)... "
response=$(curl -s -X POST "http://localhost:3001/api/ai/demo/trading-signal/AAPL")

if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $response"
fi

echo -n "Testing AI Market Analysis... "
response=$(curl -s -X POST "http://localhost:3001/api/ai/market-analysis" \
  -H "Content-Type: application/json" \
  -d '{"symbols":["AAPL","GOOGL","MSFT"]}')

if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Response: $response"
fi

echo ""
echo "=============================================="
echo "🎉 Local Testing Complete!"
echo ""
echo "📋 Summary:"
echo "   Backend: http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo "   API Docs: http://localhost:3001/api"
echo "   Health: http://localhost:3001/health"
echo ""
echo "🚀 Ready for deployment!"
echo "   See COMPLETE_TESTING_AND_DEPLOYMENT_GUIDE.md for deployment instructions"
