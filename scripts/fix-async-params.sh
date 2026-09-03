#!/bin/bash

# Fix async params in all API routes for Next.js 16

echo "🔧 Fixing async params in API routes..."

# List of files to fix
files=(
  "app/api/wioa/support-services/[id]/approve/route.ts"
  "app/api/wioa/case-management/[id]/route.ts"
  "app/api/wioa/iep/[id]/route.ts"
  "app/api/messages/[id]/route.ts"
  "app/api/lessons/[lessonId]/qa/route.ts"
  "app/api/lessons/[lessonId]/bookmarks/route.ts"
  "app/api/lessons/[lessonId]/notes/route.ts"
  "app/api/forums/[forumId]/threads/[threadId]/route.ts"
  "app/api/forums/[forumId]/route.ts"
  "app/api/verify/certificate/[certificateId]/route.ts"
  "app/api/certificates/[id]/download/route.ts"
  "app/api/events/[id]/register/route.ts"
  "app/api/study-groups/[id]/join/route.ts"
  "app/api/quizzes/[quizId]/route.ts"
  "app/api/notes/[id]/route.ts"
  "app/api/signature/documents/[id]/sign/route.ts"
  "app/api/signature/documents/[id]/route.ts"
  "app/api/partner-launch/[enrollmentId]/route.ts"
  "app/api/hr/time-entries/[id]/route.ts"
  "app/api/hr/employees/[id]/route.ts"
  "app/api/hr/leave-requests/[id]/route.ts"
  "app/api/marketing/campaigns/[id]/send/route.ts"
  "app/api/videos/[videoId]/meta/route.ts"
  "app/api/assignments/[id]/submit/route.ts"
  "app/api/courses/[courseId]/lessons/[lessonId]/resources/route.ts"
  "app/api/courses/[courseId]/lessons/[lessonId]/progress/route.ts"
  "app/api/courses/[courseId]/lessons/[lessonId]/complete/route.ts"
  "app/api/courses/[courseId]/reviews/route.ts"
  "app/api/courses/[courseId]/announcements/route.ts"
  "app/api/courses/[courseId]/leaderboard/route.ts"
  "app/api/courses/[courseId]/route.ts"
  "app/api/cm/learners/[id]/notes/route.ts"
  "app/api/cm/learners/[id]/route.ts"
  "app/api/admin/applications/[id]/approve/route.ts"
  "app/api/admin/applications/[id]/route.ts"
  "app/api/admin/program-holders/[id]/route.ts"
  "app/api/scorm/attempts/[attemptId]/data/route.ts"
)

count=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Create a Python script to do the replacement
    python3 << 'PYTHON_SCRIPT'
import sys
import re

file_path = sys.argv[1]

with open(file_path, 'r') as f:
    content = f.read()

# Pattern 1: Single param
# { params }: { params: { id: string } }
# -> { params }: { params: Promise<{ id: string }> }
content = re.sub(
    r'\{ params \}: \{ params: \{ ([^}]+) \} \}',
    r'{ params }: { params: Promise<{ \1 }> }',
    content
)

# Add await params at the start of function if not present
if 'await params' not in content and 'params: Promise<{' in content:
    # Find the function body start
    content = re.sub(
        r'(\) \{)\n(\s+)(try \{|const |if |return )',
        r'\1\n\2const resolvedParams = await params;\n\2\3',
        content,
        count=1
    )
    # Replace params.xxx with resolvedParams.xxx
    content = re.sub(r'params\.(\w+)', r'resolvedParams.\1', content)

with open(file_path, 'w') as f:
    f.write(content)

print(f"✅ Fixed: {file_path}")
PYTHON_SCRIPT "$file"
    
    count=$((count + 1))
  fi
done

echo ""
echo "✅ Fixed $count files"
