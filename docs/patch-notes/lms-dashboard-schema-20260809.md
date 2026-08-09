# LMS dashboard schema correction

This branch corrects two verified production mismatches in `apps/lms/app/lms/(app)/dashboard/page.tsx`:

- Removes the retired `super_admin` role from the dashboard allow-list.
- Queries `quiz_attempts.user_uuid` for the authenticated Supabase UUID instead of the legacy integer `user_id` column.

No other dashboard behavior is changed.
