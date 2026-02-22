import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Use service role client for accurate table counts (bypasses RLS)
async function getSupabaseAdminClient() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

type RouteStatus = 'ACTIVE' | 'PARTIAL' | 'INACTIVE' | 'DEAD';

interface RouteAudit {
  path: string;
  name: string;
  category: string;
  status: RouteStatus;
  uiEntryPoint: string;
  dataWiring: {
    tables?: string[];
    storageBuckets?: string[];
    apiEndpoints?: string[];
  };
  verifiedAt: string;
  commitSha: string;
}

interface TableAudit {
  name: string;
  rowCount: number;
  status: 'ok' | 'empty' | 'error';
}

// Core routes to audit
const ROUTES_TO_AUDIT = [
  // Auth
  { path: '/login', name: 'Login', category: 'Auth', uiEntryPoint: 'Header > Login button', dataWiring: { tables: ['profiles'] } },
  { path: '/signup', name: 'Sign Up', category: 'Auth', uiEntryPoint: 'Header > Apply button', dataWiring: { tables: ['profiles'] } },
  { path: '/forgot-password', name: 'Forgot Password', category: 'Auth', uiEntryPoint: 'Login page link', dataWiring: { tables: ['profiles'] } },
  { path: '/admin/login', name: 'Admin Login', category: 'Auth', uiEntryPoint: 'Direct URL', dataWiring: { tables: ['profiles'] } },
  
  // Application Flow
  { path: '/apply', name: 'Apply Now', category: 'Application', uiEntryPoint: 'Header CTA, Footer', dataWiring: { tables: ['applications', 'profiles'] } },
  { path: '/apply/student', name: 'Student Application', category: 'Application', uiEntryPoint: '/apply page', dataWiring: { tables: ['applications'] } },
  { path: '/apply/success', name: 'Application Success', category: 'Application', uiEntryPoint: 'Post-submission redirect', dataWiring: { tables: ['applications'] } },
  { path: '/enroll', name: 'Enrollment', category: 'Application', uiEntryPoint: 'Post-approval flow', dataWiring: { tables: ['enrollments', 'student_enrollments'] } },
  
  // Student Portal
  { path: '/student-portal', name: 'Student Portal Home', category: 'Student', uiEntryPoint: 'Footer, Header dropdown', dataWiring: { tables: ['profiles', 'enrollments'] } },
  { path: '/lms', name: 'LMS Landing', category: 'Student', uiEntryPoint: 'Footer', dataWiring: { tables: ['courses', 'enrollments'] } },
  { path: '/lms/dashboard', name: 'LMS Dashboard', category: 'Student', uiEntryPoint: 'Header after login', dataWiring: { tables: ['enrollments', 'lesson_progress'] } },
  { path: '/certificates', name: 'Certificates', category: 'Student', uiEntryPoint: 'Student nav', dataWiring: { tables: ['certificates'] } },
  
  // Partner Portal
  { path: '/partner', name: 'Partner Portal', category: 'Partner', uiEntryPoint: 'Footer', dataWiring: { tables: ['program_holders', 'partner_lms_enrollments'] } },
  { path: '/program-holder', name: 'Program Holder Portal', category: 'Partner', uiEntryPoint: 'MainNav dropdown', dataWiring: { tables: ['program_holders', 'program_holder_applications'] } },
  
  // Admin
  { path: '/admin', name: 'Admin Dashboard', category: 'Admin', uiEntryPoint: 'Footer, Direct URL', dataWiring: { tables: ['profiles', 'applications', 'enrollments'] } },
  { path: '/admin/students', name: 'Student Management', category: 'Admin', uiEntryPoint: 'Admin nav', dataWiring: { tables: ['profiles', 'enrollments'] } },
  { path: '/admin/applications', name: 'Applications', category: 'Admin', uiEntryPoint: 'Admin nav', dataWiring: { tables: ['applications'] } },
  { path: '/admin/enrollments', name: 'Enrollments', category: 'Admin', uiEntryPoint: 'Admin nav', dataWiring: { tables: ['enrollments', 'student_enrollments'] } },
  { path: '/admin/programs', name: 'Programs', category: 'Admin', uiEntryPoint: 'Admin nav', dataWiring: { tables: ['programs'] } },
  { path: '/admin/courses', name: 'Courses', category: 'Admin', uiEntryPoint: 'Admin nav', dataWiring: { tables: ['courses'] } },
  { path: '/admin/program-holders', name: 'Program Holders', category: 'Admin', uiEntryPoint: 'Admin nav', dataWiring: { tables: ['program_holders'] } },
  { path: '/admin/system-status', name: 'System Status', category: 'Admin', uiEntryPoint: 'Admin settings', dataWiring: { tables: ['profiles'] } },
  
  // Marketing/Public
  { path: '/', name: 'Homepage', category: 'Marketing', uiEntryPoint: 'Logo click', dataWiring: {} },
  { path: '/programs', name: 'Programs List', category: 'Marketing', uiEntryPoint: 'Main nav', dataWiring: { tables: ['programs'] } },
  { path: '/courses', name: 'Course Catalog', category: 'Marketing', uiEntryPoint: 'Footer', dataWiring: { tables: ['courses'] } },
  { path: '/funding', name: 'Funding Options', category: 'Marketing', uiEntryPoint: 'Main nav', dataWiring: {} },
  { path: '/about', name: 'About Us', category: 'Marketing', uiEntryPoint: 'Main nav', dataWiring: {} },
  { path: '/contact', name: 'Contact', category: 'Marketing', uiEntryPoint: 'Footer', dataWiring: {} },
  
  // Payments
  { path: '/checkout', name: 'Checkout', category: 'Payments', uiEntryPoint: 'Enrollment flow', dataWiring: { apiEndpoints: ['/api/create-checkout-session'] } },
  { path: '/donate', name: 'Donations', category: 'Payments', uiEntryPoint: 'Footer', dataWiring: { apiEndpoints: ['/api/donations/webhook'] } },
];

// Critical tables
const CRITICAL_TABLES = [
  'profiles',
  'programs', 
  'courses',
  'applications',
  'enrollments',
  'student_enrollments',
  'certificates',
  'program_holders',
  'program_holder_applications',
  'donations',
  'partner_lms_enrollments',
  'lesson_progress',
  'marketing_contacts',
];

async function auditTables(supabase: any): Promise<TableAudit[]> {
  const results: TableAudit[] = [];
  
  for (const table of CRITICAL_TABLES) {
    try {
      const { count, error } = await db
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      results.push({
        name: table,
        rowCount: error ? -1 : (count || 0),
        status: error ? 'error' : (count && count > 0 ? 'ok' : 'empty'),
      });
    } catch {
      results.push({
        name: table,
        rowCount: -1,
        status: 'error',
      });
    }
  }
  
  return results;
}

function determineRouteStatus(route: typeof ROUTES_TO_AUDIT[0], tableAudits: TableAudit[]): RouteStatus {
  const requiredTables = route.dataWiring.tables || [];
  if (requiredTables.length === 0) return 'ACTIVE';
  
  const tableStatuses = requiredTables.map(t => tableAudits.find(ta => ta.name === t));
  const hasErrors = tableStatuses.some(t => t?.status === 'error');
  const allEmpty = tableStatuses.every(t => t?.status === 'empty');
  const someEmpty = tableStatuses.some(t => t?.status === 'empty');
  
  if (hasErrors) return 'DEAD';
  if (allEmpty) return 'INACTIVE';
  if (someEmpty) return 'PARTIAL';
  return 'ACTIVE';
}

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
// Require admin auth — this endpoint exposes infrastructure details
  const authClient = await createClient();
  if (authClient) {
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: profile } = await authClient.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const timestamp = new Date().toISOString();
  const commitSha = process.env.COMMIT_REF || process.env.COMMIT_SHA || 'local-dev';
  
  // Try to get Supabase admin client (service role for accurate counts)
  const supabase = await getSupabaseAdminClient();
  
  // Audit tables (only if Supabase is configured)
  let tableAudits: TableAudit[] = [];
  if (supabase) {
    tableAudits = await auditTables(supabase);
  } else {
    // Mark all tables as error if Supabase not configured
    tableAudits = CRITICAL_TABLES.map(name => ({
      name,
      rowCount: -1,
      status: 'error' as const,
    }));
  }
  
  // Audit routes
  const routeAudits: RouteAudit[] = ROUTES_TO_AUDIT.map(route => ({
    ...route,
    status: determineRouteStatus(route, tableAudits),
    verifiedAt: timestamp,
    commitSha: commitSha.slice(0, 8),
  }));
  
  // Environment check
  const envStatus = {
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  };
  
  // Summary
  const summary = {
    totalRoutes: routeAudits.length,
    active: routeAudits.filter(r => r.status === 'ACTIVE').length,
    partial: routeAudits.filter(r => r.status === 'PARTIAL').length,
    inactive: routeAudits.filter(r => r.status === 'INACTIVE').length,
    dead: routeAudits.filter(r => r.status === 'DEAD').length,
    tablesOk: tableAudits.filter(t => t.status === 'ok').length,
    tablesEmpty: tableAudits.filter(t => t.status === 'empty').length,
    tablesError: tableAudits.filter(t => t.status === 'error').length,
  };
  
  const result = {
    generatedAt: timestamp,
    commitSha,
    environment: process.env.NODE_ENV,
    summary,
    envStatus,
    tables: tableAudits,
    routes: routeAudits,
  };
  
  return NextResponse.json(result, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
