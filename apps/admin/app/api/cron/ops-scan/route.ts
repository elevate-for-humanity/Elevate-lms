import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await requireAdminClient();
  
  const scanResults = {
    timestamp: new Date().toISOString(),
    enrollments: { issues: [], count: 0 },
    documents: { issues: [], count: 0 },
    payments: { issues: [], count: 0 },
    payroll: { issues: [], count: 0 },
    login: { issues: [], count: 0 },
    onboarding: { issues: [], count: 0 },
    total: 0
  };

  // Scan Enrollment Issues
  try {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, student_id, program_id, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (enrollments && enrollments.length > 0) {
      scanResults.enrollments.issues = enrollments.map(e => ({
        id: e.id,
        student: e.student_id,
        program: e.program_id,
        status: e.status,
        age_days: Math.floor((Date.now() - new Date(e.created_at).getTime()) / 86400000)
      }));
      scanResults.enrollments.count = enrollments.length;
    }
  } catch (e) { /* table may not exist */ }

  // Scan Document Issues
  try {
    const { data: documents } = await supabase
      .from('documents')
      .select('id, student_id, status, document_type')
      .eq('status', 'pending')
      .limit(50);
    
    if (documents && documents.length > 0) {
      scanResults.documents.issues = documents;
      scanResults.documents.count = documents.length;
    }
  } catch (e) { /* table may not exist */ }

  // Scan Payment Issues
  try {
    const { data: payments } = await supabase
      .from('payments')
      .select('id, student_id, amount, status, due_date')
      .eq('status', 'failed')
      .limit(50);
    
    if (payments && payments.length > 0) {
      scanResults.payments.issues = payments;
      scanResults.payments.count = payments.length;
    }
  } catch (e) { /* table may not exist */ }

  // Scan Login Issues
  try {
    const { data: loginIssues } = await supabase
      .from('login_issues')
      .select('id, user_id, issue_type, created_at')
      .limit(50);
    
    if (loginIssues && loginIssues.length > 0) {
      scanResults.login.issues = loginIssues;
      scanResults.login.count = loginIssues.length;
    }
  } catch (e) { /* table may not exist */ }

  scanResults.total = scanResults.enrollments.count + scanResults.documents.count + 
                     scanResults.payments.count + scanResults.login.count + 
                     scanResults.payroll.count + scanResults.onboarding.count;

  return NextResponse.json({
    status: 'completed',
    scan: scanResults,
    summary: `Found ${scanResults.total} total issues across all categories`
  });
}
