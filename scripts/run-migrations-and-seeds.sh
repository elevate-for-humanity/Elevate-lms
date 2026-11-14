#!/bin/bash

# Run migrations and seed data for Elevate for Humanity
# This script applies all database migrations and loads real seed data

set -e

echo "🚀 Starting database setup..."
echo ""

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable not set"
  echo "Please set your Supabase database URL:"
  echo "export DATABASE_URL='postgresql://postgres:[password]@[host]:5432/postgres'"
  exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Run LMS Requirements System Migration
echo "📦 Running LMS Requirements System migration..."
psql "$DATABASE_URL" -f supabase/migrations/20251218_lms_requirements_system.sql
echo "✅ LMS Requirements System migration complete"
echo ""

# Run Email and Appointments System Migration
echo "📦 Running Email and Appointments System migration..."
psql "$DATABASE_URL" -f supabase/migrations/20251218_email_and_appointments_system.sql
echo "✅ Email and Appointments System migration complete"
echo ""

# Load Real Seed Data
echo "🌱 Loading real seed data..."
psql "$DATABASE_URL" -f supabase/seeds/001_real_seed_data.sql
echo "✅ Real seed data loaded"
echo ""

# Load Student Requirements Seed Data
echo "🌱 Loading student requirements seed data..."
psql "$DATABASE_URL" -f supabase/seeds/002_student_requirements_seed.sql
echo "✅ Student requirements seed data loaded"
echo ""

echo "🎉 Database setup complete!"
echo ""
echo "📊 What was created:"
echo "  • Organizations: 1 (Elevate for Humanity)"
echo "  • Programs: 5 (Barbering, HVAC, CDL, Medical Assistant, Welding)"
echo "  • Funding Sources: 5 (WIOA, TANF, SNAP, TAA, Pell)"
echo "  • Demo Students: 5 with real requirements"
echo "  • Email Queue System: Ready"
echo "  • Appointment System: Ready"
echo ""
echo "🔐 Contact Information:"
echo "  Phone: (317) 314-3757"
echo "  Email: elevate4humanityedu@gmail.com"
echo "  Address: 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240"
echo ""
echo "✅ System ready for testing!"

