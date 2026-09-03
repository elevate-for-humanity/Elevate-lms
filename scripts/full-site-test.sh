#!/bin/bash

# Full Site Audit Script
# Tests every page for: HTTP status, content length, required elements

BASE_URL="${BASE_URL:-${NEXT_PUBLIC_SITE_URL}}"
if [ -z "$BASE_URL" ]; then
  echo "ERROR: BASE_URL or NEXT_PUBLIC_SITE_URL must be set"
  exit 1
fi

echo "=========================================="
echo "FULL SITE AUDIT - $(date)"
echo "Base URL: $BASE_URL"
echo "=========================================="

PASS=0
FAIL=0
WARN=0

# Function to test a page
test_page() {
    local path="$1"
    local name="$2"
    local required="$3"
    
    # Get HTTP status and content
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$path" 2>/dev/null)
    status=$(echo "$response" | tail -1)
    content=$(echo "$response" | head -n -1)
    content_length=${#content}
    
    # Check status
    if [ "$status" -ge 400 ]; then
        echo "❌ FAIL: $name ($path) - HTTP $status"
        ((FAIL++))
        return 1
    fi
    
    # Check content length
    if [ "$content_length" -lt 500 ]; then
        echo "⚠️  WARN: $name ($path) - Very short content ($content_length chars)"
        ((WARN++))
    fi
    
    # Check for error messages in content
    if echo "$content" | grep -qi "error\|exception\|500\|something went wrong"; then
        echo "⚠️  WARN: $name ($path) - Possible error in content"
        ((WARN++))
    fi
    
    # Check for required text if specified
    if [ -n "$required" ]; then
        if ! echo "$content" | grep -qi "$required"; then
            echo "⚠️  WARN: $name ($path) - Missing expected content: $required"
            ((WARN++))
        fi
    fi
    
    echo "✅ PASS: $name ($path) - HTTP $status, $content_length chars"
    ((PASS++))
    return 0
}

echo ""
echo "=== CRITICAL PAGES ==="
test_page "/" "Homepage" "Elevate"
test_page "/programs" "Programs" "Programs"
test_page "/programs/healthcare" "Healthcare Programs" "Healthcare"
test_page "/programs/skilled-trades" "Skilled Trades" "Skilled"
test_page "/programs/technology" "Technology" "Technology"
test_page "/programs/business" "Business" "Business"
test_page "/apply" "Apply" "Apply"
test_page "/about" "About" "About"
test_page "/contact" "Contact" "Contact"
test_page "/login" "Login" "Login"
test_page "/signup" "Signup" "Sign"

echo ""
echo "=== COMPLIANCE PAGES ==="
test_page "/privacy-policy" "Privacy Policy" "Privacy"
test_page "/terms-of-service" "Terms of Service" "Terms"
test_page "/accessibility" "Accessibility" "Accessibility"
test_page "/federal-compliance" "Federal Compliance" "Compliance"
test_page "/equal-opportunity" "Equal Opportunity" "Equal"
test_page "/grievance" "Grievance" "Grievance"
test_page "/ferpa" "FERPA" "FERPA"
test_page "/wioa-eligibility" "WIOA Eligibility" "WIOA"

echo ""
echo "=== SUPPORT PAGES ==="
test_page "/support" "Support Center" "Support"
test_page "/support/ticket" "Submit Ticket" "Ticket"
test_page "/support/help" "Help Center" "Help"
test_page "/faq" "FAQ" "FAQ"
test_page "/help" "Help" "Help"

echo ""
echo "=== SERVICE PAGES ==="
test_page "/career-services" "Career Services" "Career"
test_page "/advising" "Advising" "Advising"
test_page "/mentorship" "Mentorship" "Mentor"
test_page "/vita" "VITA" "VITA"

echo ""
echo "=== BLOG & CONTENT ==="
test_page "/blog" "Blog" "Blog"
test_page "/success-stories" "Success Stories" "Success"

echo ""
echo "=== PARTNER PAGES ==="
test_page "/employer" "Employer" "Employer"
test_page "/workforce-partners" "Workforce Partners" "Partner"
test_page "/training-providers" "Training Providers" "Training"

echo ""
echo "=== PORTAL PAGES ==="
test_page "/student-portal" "Student Portal" "Student"
test_page "/admin" "Admin" "Admin"
test_page "/staff-portal" "Staff Portal" "Staff"
test_page "/lms" "LMS" "LMS"

echo ""
echo "=== ADDITIONAL PROGRAM PAGES ==="
test_page "/programs/cdl-transportation" "CDL Transportation" "CDL"
test_page "/programs/barber-apprenticeship" "Barber Apprenticeship" "Barber"
test_page "/programs/cna" "CNA Program" "CNA"
test_page "/apprenticeships" "Apprenticeships" "Apprentice"
test_page "/courses" "Courses" "Course"
test_page "/credentials" "Credentials" "Credential"

echo ""
echo "=== UTILITY PAGES ==="
test_page "/sitemap-page" "Sitemap" "Site"
test_page "/how-it-works" "How It Works" "How"
test_page "/pathways" "Pathways" "Pathway"
test_page "/funding" "Funding" "Funding"
test_page "/orientation" "Orientation" "Orientation"

echo ""
echo "=========================================="
echo "AUDIT COMPLETE"
echo "=========================================="
echo "✅ PASSED: $PASS"
echo "⚠️  WARNINGS: $WARN"
echo "❌ FAILED: $FAIL"
echo ""

if [ $FAIL -gt 0 ]; then
    echo "STATUS: ISSUES FOUND - $FAIL pages failed"
    exit 1
else
    echo "STATUS: ALL PAGES ACCESSIBLE"
    exit 0
fi
