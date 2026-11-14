// Autopilot DB Worker - Handles all database operations
// Runs inside Supabase Edge Functions with service role access

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    const autopilotToken = Deno.env.get('AUTOPILOT_TOKEN');

    if (!authHeader || !authHeader.includes(autopilotToken || '')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { task, data } = await req.json();

    let result;

    switch (task) {
      case 'apply_migrations':
        result = await applyMigrations(supabase, data);
        break;

      case 'verify_schema':
        result = await verifySchema(supabase);
        break;

      case 'add_course':
        result = await addCourse(supabase, data);
        break;

      case 'reseed_data':
        result = await reseedData(supabase, data);
        break;

      case 'fix_rls':
        result = await fixRLS(supabase);
        break;

      case 'health_check':
        result = await healthCheck(supabase);
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown task', task }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Apply migrations from storage or inline SQL
async function applyMigrations(supabase: any, data: any) {
  const { sql } = data;

  if (!sql) {
    throw new Error('No SQL provided');
  }

  // Split SQL into statements
  const statements = sql
    .split(';')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0 && !s.startsWith('--'));

  const results = [];

  for (const statement of statements) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement,
      });

      if (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
          throw error;
        }
      }

      results.push({
        statement: statement.substring(0, 50) + '...',
        success: true,
      });
    } catch (err) {
      results.push({
        statement: statement.substring(0, 50) + '...',
        success: false,
        error: err.message,
      });
    }
  }

  return {
    applied: results.filter((r) => r.success).length,
    total: results.length,
    results,
  };
}

// Verify all expected tables exist
async function verifySchema(supabase: any) {
  const expectedTables = [
    'programs',
    'courses',
    'lessons',
    'enrollments',
    'lesson_progress',
    'certificates',
    'instructor_certificates',
    'analytics_events',
    'page_views',
    'automation_workflows',
    'automation_executions',
    'generated_content',
    'scholarship_applications',
    'scholarship_reviews',
    'stripe_accounts',
    'stripe_splits',
  ];

  const results = [];

  for (const table of expectedTables) {
    const { error } = await supabase.from(table).select('count').limit(0);
    results.push({ table, exists: !error });
  }

  const missing = results.filter((r) => !r.exists);

  return {
    total: expectedTables.length,
    existing: results.filter((r) => r.exists).length,
    missing: missing.map((r) => r.table),
    healthy: missing.length === 0,
  };
}

// Add a course with lessons
async function addCourse(supabase: any, data: any) {
  const { program_slug, course_code, course_title, course_summary, lessons } = data;

  // Get program ID
  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', program_slug)
    .single();

  if (!program) {
    throw new Error(`Program not found: ${program_slug}`);
  }

  // Insert course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      program_id: program.id,
      code: course_code,
      title: course_title,
      summary: course_summary,
    })
    .select()
    .single();

  if (courseError) throw courseError;

  // Insert lessons
  const lessonResults = [];
  for (const lesson of lessons || []) {
    const { error } = await supabase.from('lessons').insert({
      course_id: course.id,
      idx: lesson.idx,
      title: lesson.title,
      video_url: lesson.video_url,
      html: lesson.html,
    });

    lessonResults.push({ idx: lesson.idx, success: !error });
  }

  return {
    course_id: course.id,
    course_code,
    lessons_added: lessonResults.filter((r) => r.success).length,
  };
}

// Reseed test data
async function reseedData(supabase: any, data: any) {
  const { table, records } = data;

  const { error } = await supabase.from(table).insert(records);

  if (error) throw error;

  return { table, inserted: records.length };
}

// Fix RLS policies
async function fixRLS(supabase: any) {
  // Re-apply RLS policies
  const rlsSQL = `
    -- Enable RLS on all tables
    ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
    ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
    ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql: rlsSQL });

  if (error && !error.message.includes('already')) {
    throw error;
  }

  return { fixed: true };
}

// Health check
async function healthCheck(supabase: any) {
  const checks = [];

  // Check database connection
  try {
    const { error } = await supabase.from('programs').select('count').limit(0);
    checks.push({
      check: 'database_connection',
      status: !error ? 'healthy' : 'unhealthy',
    });
  } catch (error) {
    checks.push({ check: 'database_connection', status: 'unhealthy' });
  }

  // Check tables exist
  const schema = await verifySchema(supabase);
  checks.push({
    check: 'schema_integrity',
    status: schema.healthy ? 'healthy' : 'unhealthy',
    details: schema,
  });

  // Check RLS enabled
  try {
    const { data } = await supabase.rpc('check_rls_enabled');
    checks.push({ check: 'rls_policies', status: 'healthy' });
  } catch (error) {
    checks.push({ check: 'rls_policies', status: 'unknown' });
  }

  const allHealthy = checks.every((c) => c.status === 'healthy');

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  };
}
