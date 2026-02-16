-- Add Missing RLS Policies
-- This migration adds comprehensive RLS policies for tables that were missing them

-- ============================================
-- MODULES TABLE POLICIES
-- ============================================

-- Allow everyone to view modules for published courses
CREATE POLICY "Modules are viewable for published courses" ON public.modules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = modules.course_id
            AND courses.published = true
        )
        OR
        -- Instructors can view their own course modules
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = modules.course_id
            AND courses.instructor_id = auth.uid()
        )
        OR
        -- Enrolled students can view modules
        EXISTS (
            SELECT 1 FROM public.enrollments
            JOIN public.courses ON courses.id = enrollments.course_id
            WHERE courses.id = modules.course_id
            AND enrollments.user_id = auth.uid()
        )
    );

-- Instructors can insert modules for their courses
CREATE POLICY "Instructors can insert modules" ON public.modules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = modules.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Instructors can update their own course modules
CREATE POLICY "Instructors can update own modules" ON public.modules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = modules.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Instructors can delete their own course modules
CREATE POLICY "Instructors can delete own modules" ON public.modules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = modules.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- ============================================
-- ASSIGNMENTS TABLE POLICIES
-- ============================================

-- Students can view assignments for courses they're enrolled in
CREATE POLICY "Students can view assignments for enrolled courses" ON public.assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.modules
            JOIN public.courses ON courses.id = modules.course_id
            JOIN public.enrollments ON enrollments.course_id = courses.id
            WHERE modules.id = assignments.module_id
            AND enrollments.user_id = auth.uid()
        )
        OR
        -- Instructors can view assignments for their courses
        EXISTS (
            SELECT 1 FROM public.modules
            JOIN public.courses ON courses.id = modules.course_id
            WHERE modules.id = assignments.module_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Instructors can insert assignments for their course modules
CREATE POLICY "Instructors can insert assignments" ON public.assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.modules
            JOIN public.courses ON courses.id = modules.course_id
            WHERE modules.id = assignments.module_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Instructors can update assignments for their courses
CREATE POLICY "Instructors can update assignments" ON public.assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.modules
            JOIN public.courses ON courses.id = modules.course_id
            WHERE modules.id = assignments.module_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Instructors can delete assignments for their courses
CREATE POLICY "Instructors can delete assignments" ON public.assignments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.modules
            JOIN public.courses ON courses.id = modules.course_id
            WHERE modules.id = assignments.module_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- ============================================
-- MODULE_PROGRESS TABLE - ADD UPDATE POLICY
-- ============================================

-- Users can update their own progress
CREATE POLICY "Users can update own module progress" ON public.module_progress
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.enrollments
            WHERE enrollments.id = module_progress.enrollment_id
            AND enrollments.user_id = auth.uid()
        )
    );

-- ============================================
-- SUBMISSIONS TABLE - ADD MISSING POLICIES
-- ============================================

-- Instructors can view submissions for their courses
CREATE POLICY "Instructors can view course submissions" ON public.submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assignments
            JOIN public.modules ON modules.id = assignments.module_id
            JOIN public.courses ON courses.id = modules.course_id
            WHERE assignments.id = submissions.assignment_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- Users can update their own submissions (for resubmissions)
CREATE POLICY "Users can update own submissions" ON public.submissions
    FOR UPDATE USING (auth.uid() = user_id);

-- Instructors can update submissions (for grading)
CREATE POLICY "Instructors can update submissions for grading" ON public.submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.assignments
            JOIN public.modules ON modules.id = assignments.module_id
            JOIN public.courses ON courses.id = modules.course_id
            WHERE assignments.id = submissions.assignment_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- ============================================
-- CERTIFICATES TABLE - ADD MISSING POLICIES
-- ============================================

-- Allow public viewing of certificates (for verification)
CREATE POLICY "Certificates are publicly viewable" ON public.certificates
    FOR SELECT USING (true);

-- System can insert certificates (via trigger or admin)
-- Note: This is handled by SECURITY DEFINER functions, but we add a policy for explicit admin inserts
CREATE POLICY "System can insert certificates" ON public.certificates
    FOR INSERT WITH CHECK (
        -- Only allow if user completed the course
        EXISTS (
            SELECT 1 FROM public.enrollments
            WHERE enrollments.user_id = certificates.user_id
            AND enrollments.course_id = certificates.course_id
            AND enrollments.status = 'completed'
        )
    );

-- ============================================
-- ENROLLMENTS TABLE - ADD DELETE POLICY
-- ============================================

-- Users can delete their own enrollments (unenroll)
CREATE POLICY "Users can delete own enrollments" ON public.enrollments
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- COURSES TABLE - ADD DELETE POLICY
-- ============================================

-- Instructors can delete their own courses
CREATE POLICY "Instructors can delete own courses" ON public.courses
    FOR DELETE USING (auth.uid() = instructor_id);

-- ============================================
-- PROFILES TABLE - ADD DELETE POLICY
-- ============================================

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);
