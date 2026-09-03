#!/bin/bash

# Fix student/LMS routes by adding user_id scoping pattern
# This script identifies common patterns and applies fixes

echo "Analyzing student/LMS routes for scoping fixes..."

# Pattern 1: Client components fetching profiles without user filter
find app/student app/lms -name "*.tsx" -type f | while read file; do
  if grep -q "from('profiles')" "$file" && ! grep -q "eq('id', user.id)" "$file" && ! grep -q "eq('user_id'" "$file"; then
    echo "⚠️  $file - profiles query without user filter"
  fi
done

# Pattern 2: Enrollments without user filter
find app/student app/lms -name "*.tsx" -type f | while read file; do
  if grep -q "from('enrollments')" "$file" && ! grep -q "eq('student_id'" "$file" && ! grep -q "eq('user_id'" "$file"; then
    echo "⚠️  $file - enrollments query without user filter"
  fi
done

# Pattern 3: Student progress without user filter
find app/student app/lms -name "*.tsx" -type f | while read file; do
  if grep -q "from('student_progress')" "$file" && ! grep -q "eq('student_id'" "$file" && ! grep -q "eq('user_id'" "$file"; then
    echo "⚠️  $file - student_progress query without user filter"
  fi
done

echo ""
echo "Manual fixes required for each file above:"
echo "1. Add: const { data: { user } } = await supabase.auth.getUser();"
echo "2. Add: if (!user) redirect('/login');"
echo "3. Add: .eq('user_id', user.id) or .eq('student_id', user.id) to queries"
