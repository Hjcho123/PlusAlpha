#!/bin/bash

# PlusAlpha Deployment Script
echo "🚀 PlusAlpha Deployment Script"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for input
prompt_input() {
    local prompt=$1
    local var_name=$2
    local default=$3
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        eval "$var_name=\${input:-$default}"
    else
        read -p "$prompt: " input
        eval "$var_name=\"$input\""
    fi
}

echo "This script will help you deploy PlusAlpha to production."
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
echo "----------------------------"

# Check Node.js
if command_exists node; then
    echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Check npm
if command_exists npm; then
    echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
else
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

# Check Git
if command_exists git; then
    echo -e "${GREEN}✅ Git: $(git --version)${NC}"
else
    echo -e "${RED}❌ Git not found. Please install Git first.${NC}"
    exit 1
fi

echo ""

# Choose deployment platform
echo "🌐 Choose deployment platform:"
echo "1. Vercel (Frontend) + Heroku (Backend) - Recommended"
echo "2. Railway (Full-stack)"
echo "3. Manual deployment guide"
echo ""

read -p "Enter your choice (1-3): " platform_choice

case $platform_choice in
    1)
        echo ""
        echo "🚀 Deploying to Vercel + Heroku..."
        echo "=================================="
        
        # Frontend deployment to Vercel
        echo ""
        echo "📱 Step 1: Deploy Frontend to Vercel"
        echo "------------------------------------"
        
        if ! command_exists vercel; then
            echo "Installing Vercel CLI..."
            npm install -g vercel
        fi
        
        echo "Building frontend..."
        npm run build
        
        echo "Deploying to Vercel..."
        vercel --prod
        
        echo ""
        echo "🔧 Step 2: Deploy Backend to Heroku"
        echo "-----------------------------------"
        
        if ! command_exists heroku; then
            echo -e "${YELLOW}⚠️  Heroku CLI not found.${NC}"
            echo "Please install Heroku CLI from: https://devcenter.heroku.com/articles/heroku-cli"
            echo "Then run this script again."
            exit 1
        fi
        
        # Get Heroku app name
        prompt_input "Enter Heroku app name" "HEROKU_APP_NAME" "plusalpha-backend"
        
        # Create Heroku app
        echo "Creating Heroku app: $HEROKU_APP_NAME"
        heroku create $HEROKU_APP_NAME
        
        # Set environment variables
        echo "Setting environment variables..."
        heroku config:set NODE_ENV=production -a $HEROKU_APP_NAME
        heroku config:set MONGODB_URI="mongodb+srv://wouldyouhavethetime_db_user:nkWVPVDyNmTpy5Rd@cluster0.rpdcdve.mongodb.net/plusalpha?retryWrites=true&w=majority&appName=Cluster0" -a $HEROKU_APP_NAME
        heroku config:set ALPHA_VANTAGE_API_KEY="1OWI92Z85PBV4AXZ" -a $HEROKU_APP_NAME
        heroku config:set FINNHUB_API_KEY="d3eouf9r01qh40ffcdvgd3eouf9r01qh40ffce00" -a $HEROKU_APP_NAME
        heroku config:set JWT_SECRET="your-super-secret-jwt-key-for-production-$(date +%s)" -a $HEROKU_APP_NAME
        
        # Get frontend URL
        prompt_input "Enter your Vercel frontend URL" "FRONTEND_URL" "https://your-app.vercel.app"
        heroku config:set FRONTEND_URL="$FRONTEND_URL" -a $HEROKU_APP_NAME
        
        # Deploy backend
        echo "Deploying backend to Heroku..."
        cd backend
        git add .
        git commit -m "Deploy to Heroku"
        git push heroku main
        
        echo ""
        echo "🎉 Deployment Complete!"
        echo "======================"
        echo "Frontend: $FRONTEND_URL"
        echo "Backend: https://$HEROKU_APP_NAME.herokuapp.com"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Update Vercel environment variables with backend URL"
        echo "2. Test your deployed application"
        echo "3. Set up custom domain (optional)"
        ;;
        
    2)
        echo ""
        echo "🚀 Deploying to Railway..."
        echo "========================="
        
        if ! command_exists railway; then
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        
        echo "Login to Railway..."
        railway login
        
        echo "Deploying full-stack application..."
        railway up
        
        echo ""
        echo "🎉 Deployment Complete!"
        echo "======================"
        echo "Check your Railway dashboard for deployment URLs"
        ;;
        
    3)
        echo ""
        echo "📖 Manual Deployment Guide"
        echo "=========================="
        echo "Please refer to COMPLETE_TESTING_AND_DEPLOYMENT_GUIDE.md"
        echo "for detailed manual deployment instructions."
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac

echo ""
echo "🔧 Post-Deployment Checklist:"
echo "============================="
echo "□ Test health endpoint"
echo "□ Test user registration"
echo "□ Test stock data fetching"
echo "□ Test AI trading signals"
echo "□ Test portfolio management"
echo "□ Verify WebSocket connections"
echo "□ Check error logs"
echo "□ Set up monitoring"
echo ""
echo "📚 Documentation:"
echo "================="
echo "• Complete Guide: COMPLETE_TESTING_AND_DEPLOYMENT_GUIDE.md"
echo "• Local Testing: ./test-local-functionality.sh"
echo "• API Documentation: http://localhost:3001/api"
echo ""
echo "🎯 Your PlusAlpha platform is ready for production! 🚀"
