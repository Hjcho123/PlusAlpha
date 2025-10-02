#!/bin/bash

# PlusAlpha Backend Startup Script

echo "🚀 Starting PlusAlpha Backend..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your API keys before starting the server"
    echo "   Required: OPENAI_API_KEY, MONGODB_URI"
    exit 1
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if ! nc -z localhost 27017 2>/dev/null; then
    echo "❌ MongoDB is not running. Please start MongoDB first:"
    echo "   brew services start mongodb-community"
    echo "   or"
    echo "   sudo systemctl start mongod"
    exit 1
fi

# Check if Redis is running (optional)
echo "🔍 Checking Redis connection..."
if ! nc -z localhost 6379 2>/dev/null; then
    echo "⚠️  Redis is not running. Caching will be disabled."
    echo "   To enable caching, start Redis:"
    echo "   brew services start redis"
    echo "   or"
    echo "   sudo systemctl start redis"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🎯 Starting server..."
npm run dev
