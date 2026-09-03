#!/bin/bash

# ============================================
# Elevate for Humanity - One-Click Setup
# ============================================
# This script automates the entire setup process

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 Elevate for Humanity - One-Click Production Setup    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running in project root
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Run this script from project root."
    exit 1
fi

print_success "Found project root"

# ============================================
# Step 1: Install Dependencies
# ============================================

print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# ============================================
# Step 2: Environment Setup
# ============================================

print_status "Setting up environment variables..."

if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_success "Created .env.local from .env.example"
    else
        print_warning ".env.example not found, creating minimal .env.local"
        cat > .env.local << EOF
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
        print_success "Created minimal .env.local"
    fi
else
    print_warning ".env.local already exists, skipping creation"
fi

# Generate NEXTAUTH_SECRET if not set
if ! grep -q "NEXTAUTH_SECRET=.\+" .env.local; then
    print_status "Generating NEXTAUTH_SECRET..."
    SECRET=$(openssl rand -base64 32)
    sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$SECRET|g" .env.local
    print_success "Generated NEXTAUTH_SECRET"
fi

# ============================================
# Step 3: Check Supabase Configuration
# ============================================

print_status "Checking Supabase configuration..."

if grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" .env.local; then
    print_success "Supabase URL configured"
    SUPABASE_CONFIGURED=true
else
    print_warning "Supabase URL not configured"
    print_status "Please follow these steps:"
    echo "  1. Create project at https://supabase.com"
    echo "  2. Copy credentials to .env.local"
    echo "  3. Run migration SQL (see SUPABASE_SETUP.md)"
    SUPABASE_CONFIGURED=false
fi

# ============================================
# Step 4: Build Project
# ============================================

print_status "Building project..."
npm run build
print_success "Build completed successfully"

# ============================================
# Step 5: Setup Summary
# ============================================

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ Setup Complete!                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "📋 Setup Summary:"
echo ""
echo "  ✅ Dependencies installed"
echo "  ✅ Environment file created"
echo "  ✅ Build completed"

if [ "$SUPABASE_CONFIGURED" = true ]; then
    echo "  ✅ Supabase configured"
else
    echo "  ⚠️  Supabase needs configuration"
fi

echo ""
echo "📚 Next Steps:"
echo ""

if [ "$SUPABASE_CONFIGURED" = false ]; then
    echo "1. Configure Supabase:"
    echo "   - Follow SUPABASE_SETUP.md"
    echo "   - Add credentials to .env.local"
    echo ""
fi

echo "2. Start development server:"
echo "   npm run dev"
echo ""

echo "3. Test the application:"
echo "   - Visit http://localhost:3000"
echo "   - Test application form"
echo "   - Test contact form"
echo ""

echo "4. Deploy to production:"
echo "   ./scripts/deploy-to-vercel.sh"
echo ""

echo "📖 Documentation:"
echo "   - INTEGRATED_SITE_ARCHITECTURE.md"
echo "   - MARKETING_LMS_INTEGRATION.md"
echo "   - TESTING_GUIDE.md"
echo "   - DEPLOYMENT_READY.md"
echo "   - SUPABASE_SETUP.md"
echo ""

echo "🎉 You're ready to go!"
echo ""
