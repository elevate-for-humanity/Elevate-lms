#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Verifying EFH environment configuration..."
echo ""

MISSING=0

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found"
  echo "   Run: cp .env.example .env"
  MISSING=1
else
  echo "✅ .env file exists"
  
  # Check for required variables
  if ! grep -q "VITE_SUPABASE_URL=" .env || grep -q "your_supabase_url_here" .env; then
    echo "⚠️  VITE_SUPABASE_URL not configured"
    echo "   Student portal login will not work without Supabase credentials"
    MISSING=1
  else
    echo "✅ VITE_SUPABASE_URL configured"
  fi
  
  if ! grep -q "VITE_SUPABASE_ANON_KEY=" .env || grep -q "your_supabase_anon_key_here" .env; then
    echo "⚠️  VITE_SUPABASE_ANON_KEY not configured"
    MISSING=1
  else
    echo "✅ VITE_SUPABASE_ANON_KEY configured"
  fi
fi

echo ""

if [ $MISSING -eq 1 ]; then
  echo "⚠️  Some environment variables are missing or not configured"
  echo ""
  echo "📝 To fix:"
  echo "   1. Get Supabase credentials from: https://app.supabase.com/project/_/settings/api"
  echo "   2. Update .env with your actual values"
  echo "   3. Restart the dev server"
  echo ""
  echo "💡 The site will work for public pages, but student login requires Supabase"
  exit 1
else
  echo "✅ All required environment variables are configured"
  exit 0
fi
