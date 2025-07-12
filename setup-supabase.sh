#!/bin/bash

# Supabase Setup Script for Leverage Money Dashboard
# This script helps automate the setup process for your new Supabase project

echo "🚀 Leverage Money Dashboard - Supabase Setup Script"
echo "==========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found. Creating one from example..."
    cp env.example .env.local
    echo "📝 Please edit .env.local with your Supabase project details"
    echo "   You can find these in your Supabase dashboard under Settings > API"
    echo ""
    echo "Press enter when you've updated .env.local with your project details..."
    read
fi

# Get project ID from user
echo "📋 Please enter your Supabase project ID:"
read -r project_id

if [ -z "$project_id" ]; then
    echo "❌ Project ID cannot be empty"
    exit 1
fi

# Update config.toml with project ID
echo "📝 Updating supabase/config.toml with project ID..."
sed -i.bak "s/your-project-id/$project_id/g" supabase/config.toml

# Link to Supabase project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref "$project_id"

# Push database schema
echo "📊 Pushing database schema..."
supabase db push

# Deploy edge functions
echo "🚀 Deploying edge functions..."
echo "Deploying redirect function..."
supabase functions deploy redirect

echo "Deploying track-click function..."
supabase functions deploy track-click

echo ""
echo "✅ Setup complete! Here's what was done:"
echo "   - Linked to your Supabase project"
echo "   - Created all database tables and functions"
echo "   - Deployed edge functions"
echo ""
echo "📋 Next steps:"
echo "   1. Go to your Supabase dashboard"
echo "   2. Navigate to Edge Functions > Settings"
echo "   3. Add these environment variables:"
echo "      - SUPABASE_URL: Your project URL"
echo "      - SUPABASE_SERVICE_ROLE_KEY: Your service role key"
echo "   4. Test your application: npm run dev"
echo "   5. Create an admin user and set is_admin to true in the users table"
echo ""
echo "🎉 Happy coding!" 