/**
 * Check Course Completion Edge Function
 * Automatically issues certificates when students complete courses
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, courseId } = await req.json();

    if (!userId || !courseId) {
      throw new Error('userId and courseId are required');
    }

    // Get course details
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;

    // Get all lessons in the course
    const { data: lessons, error: lessonsError } = await supabaseClient
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);

    if (lessonsError) throw lessonsError;

    const totalLessons = lessons.length;

    // Get completed lessons for this user
    const { data: completedLessons, error: progressError } =
      await supabaseClient
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('completed', true)
        .in(
          'lesson_id',
          lessons.map((l) => l.id)
        );

    if (progressError) throw progressError;

    const completedCount = completedLessons.length;
    const completionPercent =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // Check if course is complete
    const isComplete = completionPercent === 100;

    // Update enrollment status
    await supabaseClient
      .from('enrollments')
      .update({
        status: isComplete ? 'completed' : 'active',
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    // If complete and no certificate exists, issue one
    if (isComplete && course.certification_name) {
      const { data: existingCert } = await supabaseClient
        .from('certifications')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (!existingCert) {
        // Generate verification code
        const verifyCode = Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();

        // Issue certificate
        await supabaseClient.from('certifications').insert({
          user_id: userId,
          course_id: courseId,
          certification_name: course.certification_name,
          certification_issuer:
            course.certification_issuer || 'Elevate for Humanity',
          verify_code: verifyCode,
          issued_at: new Date().toISOString(),
        });

        console.log(
          `Certificate issued for user ${userId}, course ${courseId}`
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        completionPercent,
        isComplete,
        completedLessons: completedCount,
        totalLessons,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
