#!/bin/bash

# Quick Supabase Credentials Setup

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       Supabase Credentials Setup                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Please provide your Supabase credentials:"
echo ""

read -p "Project URL (https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Anon/Public Key: " SUPABASE_ANON
read -p "Service Role Key: " SUPABASE_SERVICE

echo ""
echo "Updating .env.local..."

# Update .env.local
sed -i "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|g" .env.local
sed -i "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON|g" .env.local
sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE|g" .env.local

echo "✅ Credentials saved to .env.local"
echo ""
echo "Next steps:"
echo "1. Run database migration: See SUPABASE_SETUP.md"
echo "2. Test connection: npm run dev"
echo ""
