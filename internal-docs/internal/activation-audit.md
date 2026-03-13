# Activation Audit Report

Last Updated: 2026-01-15

## Overview

This document summarizes the activation status of routes, features, and integrations in the Elevate LMS platform.

## Live Status Dashboard

- **Admin Page**: [/admin/system-status](/admin/system-status) (requires admin login)
- **JSON API**: [/api/system-status](/api/system-status)
- **Static JSON**: [/public/system-status.json](/system-status.json)

## Status Definitions

| Status | Definition |
|--------|------------|
| **ACTIVE** | Route reachable, uses real database, no errors, verified in production |
| **PARTIAL** | Page loads but has: mock data, incomplete flows, missing nav entry, or missing DB writes |
| **INACTIVE** | Code exists but not reachable, not wired to real data, or gated behind placeholders |
| **DEAD** | Route broken (404/500), build errors, redirect loop, or links to non-existent routes |

## Route Categories

### Authentication (4 routes)
- `/login` - User login with Supabase Auth
- `/signup` - User registration
- `/forgot-password` - Password reset flow
- `/admin/login` - Admin authentication

### Application Flow (4 routes)
- `/apply` - Main application form
- `/apply/student` - Student-specific application
- `/apply/success` - Post-submission confirmation
- `/enroll` - Enrollment landing page

### Student Portal (4 routes)
- `/student-portal` - Student portal landing
- `/lms` - LMS landing page
- `/lms/dashboard` - Student dashboard with enrollments
- `/certificates` - Certificate management

### Partner Portal (2 routes)
- `/partner` - Partner information page
- `/program-holder` - Program holder portal

### Admin (8 routes)
- `/admin` - Admin mega dashboard
- `/admin/students` - Student management
- `/admin/applications` - Application management
- `/admin/enrollments` - Enrollment management
- `/admin/programs` - Program management
- `/admin/courses` - Course management
- `/admin/program-holders` - Partner management
- `/admin/system-status` - This audit page

### Marketing/Public (6 routes)
- `/` - Homepage
- `/programs` - Programs listing
- `/courses` - Course catalog
- `/funding` - Funding options
- `/about` - About page
- `/contact` - Contact page

### Payments (2 routes)
- `/checkout` - Stripe checkout integration
- `/donate` - Donation page with Stripe

## Database Tables

Critical tables monitored:
- `profiles` - User profiles
- `programs` - Training programs
- `courses` - Course content
- `applications` - Student applications
- `enrollments` - Course enrollments
- `student_enrollments` - Student-specific enrollments
- `certificates` - Issued certificates
- `program_holders` - Partner organizations
- `program_holder_applications` - Partner applications
- `donations` - Donation records
- `partner_lms_enrollments` - Partner LMS enrollments
- `lesson_progress` - Learning progress tracking
- `marketing_contacts` - Marketing leads

## Environment Variables

Required for full functionality:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `OPENAI_API_KEY` - OpenAI API key (for AI features)
- `RESEND_API_KEY` - Resend email API key

## Webhook Endpoints

- `/api/donations/webhook` - Stripe donation webhooks
- `/api/enroll/checkout` - Enrollment checkout
- `/api/create-checkout-session` - Generic checkout sessions

## How to Use

1. Visit `/admin/system-status` as an admin user
2. Review the status of each route and table
3. Click "Visit" links to verify routes manually
4. Check the JSON API for programmatic access

## Maintenance

The System Status page automatically:
- Queries all critical database tables
- Checks environment variable configuration
- Determines route status based on data availability
- Generates timestamps and commit SHA for tracking
