#!/bin/bash

# ALFANUMRIK ENVIRONMENT SETUP SCRIPT
# ====================================
# This script sets up your .env.local file with the correct Supabase configuration

echo "🚀 ALFANUMRIK ENVIRONMENT SETUP"
echo "================================"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "📋 Found existing .env.local file"
    echo "Creating backup as .env.local.backup"
    cp .env.local .env.local.backup
else
    echo "📝 Creating new .env.local file"
fi

# Get existing Gemini API key if it exists
GEMINI_KEY=""
if [ -f ".env.local" ]; then
    GEMINI_KEY=$(grep -E "^VITE_GEMINI_API_KEY=" .env.local 2>/dev/null | cut -d'=' -f2)
fi

# If no Gemini key found, ask user
if [ -z "$GEMINI_KEY" ] || [ "$GEMINI_KEY" = "your_gemini_api_key_here" ]; then
    echo ""
    echo "⚠️  Gemini API Key Required"
    echo "Please enter your Gemini API key (from https://ai.studio/):"
    read -r GEMINI_KEY
    
    if [ -z "$GEMINI_KEY" ]; then
        echo "❌ No API key provided. You'll need to add it manually later."
        GEMINI_KEY="your_gemini_api_key_here"
    fi
fi

# Create the complete .env.local file
cat > .env.local << EOF
# ALFANUMRIK ENVIRONMENT CONFIGURATION
# Generated on $(date)
# ====================================

# GEMINI AI CONFIGURATION
VITE_GEMINI_API_KEY=$GEMINI_KEY

# SUPABASE CONFIGURATION
VITE_SUPABASE_URL=https://dkljgiwtzonycyoecnzd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbGpnaXd0em9ueWN5b2VjbnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NDA2MDYsImV4cCI6MjA3NTIxNjYwNn0.B_onUHkHtUC5_WxTABFLaeFkjcwQPeGvq2AnjT9Q0dY

# APPLICATION SETTINGS
NODE_ENV=development
VITE_APP_NAME=Alfanumrik
VITE_APP_VERSION=0.2.0

# CLOUD SYNC FEATURES
VITE_ENABLE_CLOUD_SYNC=true
VITE_ENABLE_TEACHER_FEATURES=true
VITE_ENABLE_PARENT_FEATURES=true
VITE_PILOT_MODE=true

# PERFORMANCE OPTIMIZATION
VITE_ENABLE_API_CACHE=true
VITE_ENABLE_PERFORMANCE_MONITOR=true
VITE_SYNC_INTERVAL=60000

# AUTHENTICATION
VITE_ENABLE_EMAIL_AUTH=true
VITE_ENABLE_GOOGLE_AUTH=true

# PILOT CONFIGURATION
VITE_PILOT_FEEDBACK_EMAIL=099pradeepsharma@gmail.com
VITE_MAX_PILOT_USERS=500
EOF

echo ""
echo "✅ Environment configuration complete!"
echo ""
echo "📋 Created .env.local with:"
echo "   • Gemini API key: $(echo $GEMINI_KEY | cut -c1-20)..."
echo "   • Supabase URL: https://dkljgiwtzonycyoecnzd.supabase.co"
echo "   • Cloud sync enabled"
echo "   • Pilot features enabled"
echo ""
echo "🎯 Next steps:"
echo "   1. Run: npm install"
echo "   2. Set up Supabase database (see database/SETUP-SUPABASE.sql)"
echo "   3. Run: npm run dev"
echo ""
echo "🚀 Your Alfanumrik app will be ready for pilot deployment!"
