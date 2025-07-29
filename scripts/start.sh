#!/bin/bash

# Production startup script for HigherUp.ai Market Domination Platform

set -e

echo "🚀 Starting HigherUp.ai Market Domination Platform..."

# Set production environment
export NODE_ENV=production
export PORT=${PORT:-3000}

# Log startup information
echo "Environment: $NODE_ENV"
echo "Port: $PORT"
echo "Node Version: $(node --version)"
echo "NPM Version: $(npm --version)"

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_ANON_KEY environment variable is required"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p /app/logs

# Start the application with proper logging
echo "✅ Starting application server..."
exec node dist/server.js 2>&1 | tee -a /app/logs/app.log