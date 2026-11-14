---
name: Pack 8 - Final Polish Features
about: Subtitles, Leaderboards, Advanced Charts, Global Leaderboard
title: '[PACK 8] Final Polish Features - Subtitles, Leaderboards, Charts'
labels: enhancement, pack-8, final-polish
assignees: ''
---

## 🎯 Goal

Complete the final polish features to bring the LMS to 100% of planned functionality:

- ✅ Subtitles / captions for video lessons
- ✅ Leaderboards (course-level + global)
- ✅ Advanced charts for instructor analytics
- ✅ Global leaderboard on student dashboard

**Estimated Time:** 3-4 hours  
**Priority:** Medium  
**Milestone:** Feature Complete

---

## 📋 PHASE 1: SUBTITLES / CAPTIONS (45 min)

### Task 1.1: Database Migration

**File:** `supabase/migrations/20251124_lesson_captions.sql`

- [ ] Migration file exists (already created)
- [ ] Run migration in Supabase SQL Editor
- [ ] Verify `lesson_captions` table created
- [ ] Verify RLS policies active

**Acceptance Criteria:**

- Table exists with columns: `id`, `lesson_id`, `language_code`, `label`, `src_url`, `is_default`
- RLS enabled
- Anyone can view captions
- Only admins/instructors can manage captions

---

### Task 1.2: Add Sample Caption Data

**Action:** Add test captions in Supabase

```sql
-- Example: Add English captions for a lesson
INSERT INTO public.lesson_captions (lesson_id, language_code, label, src_url, is_default)
VALUES (
  'YOUR_LESSON_ID',
  'en',
  'English',
  'https://example.com/captions/lesson1-en.vtt',
  true
);
```

- [ ] Add captions for at least 2 test lessons
- [ ] Verify captions are accessible

---

### Task 1.3: Update Video Player Component

**File:** `components/video/ProfessionalVideoPlayer.tsx`

- [ ] Add `CaptionTrack` type definition
- [ ] Add `captions?: CaptionTrack[]` to props
- [ ] Add `<track>` elements inside `<video>` tag
- [ ] Add `toggleCaptions()` function
- [ ] Add CC button next to PiP button
- [ ] Test TypeScript compiles

**Acceptance Criteria:**

- Props accept captions array
- Track elements render for each caption
- CC button appears when captions exist
- CC button toggles captions on/off
- No TypeScript errors

---

### Task 1.4: Update Lesson Page

**File:** `app/lms/courses/[courseId]/lessons/[lessonId]/page.tsx` (or your lesson route)

- [ ] Fetch captions from `lesson_captions` table
- [ ] Map DB rows to `CaptionTrack` format
- [ ] Pass `captions` prop to `ProfessionalVideoPlayer`
- [ ] Test page loads without errors

**Acceptance Criteria:**

- Captions fetch successfully
- Captions pass to video player
- CC button appears on video player
- Clicking CC toggles subtitles

---

## 📋 PHASE 2: LEADERBOARDS (60 min)

### Task 2.1: Database Views

**File:** `supabase/migrations/20251124_leaderboards_views.sql`

- [ ] Migration file exists (already created)
- [ ] Run migration in Supabase SQL Editor
- [ ] Verify `course_leaderboard` view created
- [ ] Verify `global_leaderboard` view created
- [ ] Test views return data

**Acceptance Criteria:**

- `course_leaderboard` view shows per-course progress
- `global_leaderboard` view shows average progress
- Views calculate percentages correctly

---

### Task 2.2: Course Leaderboard API

**File:** `app/api/courses/[courseId]/leaderboard/route.ts`

- [ ] File exists (already created)
- [ ] GET endpoint fetches from `course_leaderboard` view
- [ ] Joins profiles for user names
- [ ] Returns top 10 learners
- [ ] Test with Postman/curl

**Acceptance Criteria:**

- GET returns leaderboard array
- Each row has: rank, userId, name, progress
- Ordered by progress (descending)
- 401 if not authenticated

---

### Task 2.3: Course Leaderboard Component

**File:** `components/course/CourseLeaderboard.tsx`

- [ ] File exists (already created)
- [ ] Fetches from API on mount
- [ ] Displays rank, name, progress bar
- [ ] Shows loading state
- [ ] Shows empty state
- [ ] Test renders correctly

**Acceptance Criteria:**

- Component loads without errors
- Shows "Loading..." initially
- Shows leaderboard when data exists
- Shows empty state when no data
- Progress bars display correctly

---

### Task 2.4: Integrate into Course Page

**File:** `app/lms/courses/[slug]/page.tsx`

- [ ] Import `CourseLeaderboard` component
- [ ] Add to sidebar or bottom section
- [ ] Pass `courseId` prop
- [ ] Test page loads
- [ ] Verify leaderboard displays

**Acceptance Criteria:**

- Leaderboard appears on course page
- Shows real data when available
- Responsive on mobile
- No layout issues

---

## 📋 PHASE 3: GLOBAL LEADERBOARD (30 min)

### Task 3.1: Global Leaderboard API

**File:** `app/api/leaderboard/global/route.ts`

- [ ] File exists (already created)
- [ ] GET endpoint fetches from `global_leaderboard` view
- [ ] Joins profiles for user names
- [ ] Returns top 10 learners
- [ ] Marks current user with `isYou: true`
- [ ] Test with Postman/curl

**Acceptance Criteria:**

- GET returns leaderboard array
- Each row has: rank, userId, name, avgProgress, isYou
- Current user row marked correctly
- 401 if not authenticated

---

### Task 3.2: Global Leaderboard Component

**File:** `components/dashboard/GlobalLeaderboard.tsx`

- [ ] File exists (already created)
- [ ] Fetches from API on mount
- [ ] Displays rank, name, progress bar
- [ ] Highlights current user row (orange background)
- [ ] Shows loading state
- [ ] Shows empty state
- [ ] Test renders correctly

**Acceptance Criteria:**

- Component loads without errors
- Shows "Loading..." initially
- Shows leaderboard when data exists
- Current user row highlighted
- Progress bars display correctly

---

### Task 3.3: Integrate into Student Dashboard

**File:** `app/portal/student/dashboard/page.tsx` (or main student dashboard)

- [ ] Import `GlobalLeaderboard` component
- [ ] Add to right sidebar or bottom section
- [ ] Test page loads
- [ ] Verify leaderboard displays

**Acceptance Criteria:**

- Leaderboard appears on dashboard
- Shows real data when available
- Current user highlighted
- Responsive on mobile

---

## 📋 PHASE 4: ADVANCED CHARTS (45 min)

### Task 4.1: Install Recharts

```bash
npm install recharts
# or
yarn add recharts
```

- [ ] Run install command
- [ ] Verify package.json updated
- [ ] Verify no dependency conflicts

---

### Task 4.2: Engagement Charts Component

**File:** `components/instructor/EngagementCharts.tsx`

- [ ] File exists (already created)
- [ ] Uses `LineChart` for enrollments vs completions
- [ ] Uses `BarChart` for completion funnel
- [ ] Aggregates data by day
- [ ] Test renders without errors

**Acceptance Criteria:**

- Line chart shows enrollments and completions over time
- Bar chart shows enrolled vs completed counts
- Charts responsive
- No console errors

---

### Task 4.3: Instructor Analytics Page

**File:** `app/instructor/courses/[slug]/analytics/page.tsx`

- [ ] Create or update file
- [ ] Verify instructor owns course
- [ ] Fetch enrollments, certificates, progress data
- [ ] Display summary stat cards
- [ ] Render `EngagementCharts` component
- [ ] Test page loads

**Acceptance Criteria:**

- Page loads without errors
- Only course instructor can access
- Stat cards show correct numbers
- Charts render with real data
- Responsive on mobile

---

### Task 4.4: Link from Instructor Dashboard

**File:** `app/instructor/dashboard/page.tsx`

- [ ] Add "Analytics" link to each course card
- [ ] Link to `/instructor/courses/[slug]/analytics`
- [ ] Test navigation works

**Acceptance Criteria:**

- Analytics link visible on each course
- Clicking link navigates to analytics page
- Back button works

---

## 📋 PHASE 5: TESTING (30 min)

### Task 5.1: Subtitles Testing

- [ ] Play video with captions
- [ ] Click CC button
- [ ] Verify captions appear
- [ ] Click CC again
- [ ] Verify captions disappear
- [ ] Test with multiple caption tracks
- [ ] Test on mobile

**Acceptance Criteria:**

- Captions toggle on/off correctly
- Captions display properly
- No video playback issues
- Works on all browsers

---

### Task 5.2: Leaderboards Testing

**Course Leaderboard:**

- [ ] Navigate to course page
- [ ] Verify leaderboard displays
- [ ] Check rank order is correct
- [ ] Verify progress percentages accurate
- [ ] Test with no data (empty state)

**Global Leaderboard:**

- [ ] Navigate to student dashboard
- [ ] Verify global leaderboard displays
- [ ] Check current user is highlighted
- [ ] Verify average progress accurate
- [ ] Test with no data (empty state)

**Acceptance Criteria:**

- Both leaderboards display correctly
- Data is accurate
- Empty states work
- Responsive on mobile

---

### Task 5.3: Charts Testing

- [ ] Navigate to instructor analytics page
- [ ] Verify line chart displays
- [ ] Verify bar chart displays
- [ ] Check data accuracy
- [ ] Test with no data
- [ ] Test responsive behavior

**Acceptance Criteria:**

- Charts render without errors
- Data is accurate
- Charts responsive
- Tooltips work
- No console errors

---

### Task 5.4: Cross-Browser Testing

- [ ] Chrome: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Mobile Chrome: Responsive
- [ ] Mobile Safari: Responsive

**Acceptance Criteria:**

- Works in all browsers
- No browser-specific bugs
- Responsive on all devices

---

## 📋 PHASE 6: DOCUMENTATION (15 min)

### Task 6.1: Update README

- [ ] Document caption feature
- [ ] Document leaderboard features
- [ ] Document analytics charts
- [ ] Add usage examples

---

### Task 6.2: Create Pack 8 Documentation

**File:** `PACK_8_FINAL_POLISH_COMPLETE.md`

- [ ] Document all features
- [ ] Add screenshots (optional)
- [ ] List all files created/modified
- [ ] Add testing instructions

---

## ✅ Definition of Done

- [ ] All checkboxes above are checked
- [ ] All migrations run successfully
- [ ] All API endpoints working
- [ ] All components rendering
- [ ] All pages loading without errors
- [ ] All features tested and verified
- [ ] Build succeeds with zero errors
- [ ] Documentation updated
- [ ] Cross-browser tested

---

## 📊 Progress Tracking

**Total Tasks:** 40  
**Completed:** 0 / 40  
**Progress:** 0%

---

## 🔗 Related Documentation

- [`DEPLOYMENT_RECIPE.md`](../../DEPLOYMENT_RECIPE.md) - Deployment guide
- [`DEVELOPER_TASK_SHEET.md`](../../DEVELOPER_TASK_SHEET.md) - Task checklist
- [`START_HERE_MASTER_INDEX.md`](../../START_HERE_MASTER_INDEX.md) - All docs

---

## 💬 Notes

**Design Guidelines:**

- Follow existing Tailwind patterns
- Use rounded-xl for cards
- Use shadow-sm for elevation
- Match existing color scheme

**Technical Notes:**

- Recharts is client-side only
- Captions must be WebVTT format (.vtt)
- Leaderboard views update automatically
- Charts aggregate data by day

**Future Enhancements:**

- Multiple caption language selector
- Leaderboard filters (by date range)
- More chart types (pie, area)
- Export analytics to PDF/CSV

---

## 🎉 Success Criteria

**Pack 8 is complete when:**

- ✅ Videos have working captions with CC button
- ✅ Course pages show leaderboards
- ✅ Student dashboard shows global leaderboard
- ✅ Instructor analytics has charts
- ✅ All features tested and working
- ✅ Platform is 100% feature complete

**Platform Status After Pack 8:**

- 🎯 100% of planned features complete
- 🚀 Production ready
- 📊 Full analytics
- 🏆 Gamification complete
- 🎓 Professional LMS

---

**Let's finish strong!** 💪🎓🚀
