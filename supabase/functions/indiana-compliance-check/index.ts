import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);


    // Get all active program holders with Indiana credentials
    const { data: programHolders, error: fetchError } = await supabase
      .from('program_holder_applications')
      .select('*')
      .eq('status', 'approved')
      .limit(100);

    if (fetchError) {
      throw new Error(`Failed to fetch program holders: ${fetchError.message}`);
    }

    console.log(
      `[Indiana Compliance] Found ${programHolders?.length || 0} program holders to check`
    );

    const results = {
      totalChecked: programHolders?.length || 0,
      alertsSent: 0,
      enforcementActions: 0,
      errors: [] as string[],
      timestamp: new Date().toISOString(),
    };

    // Process each program holder
    for (const holder of programHolders || []) {
      try {
        // Check reporting compliance
        const reportingChecks = await checkReportingCompliance(
          supabase,
          holder.id
        );

        // Check performance compliance
        const performanceChecks = await checkPerformanceCompliance(
          supabase,
          holder.id
        );

        // Generate alerts if needed
        const alerts = generateAlerts(
          holder,
          reportingChecks,
          performanceChecks
        );

        // Send alerts
        for (const alert of alerts) {
          await sendAlert(supabase, alert);
          results.alertsSent++;
        }

        // Execute enforcement actions if needed
        const actions = generateEnforcementActions(
          holder,
          reportingChecks,
          performanceChecks
        );

        for (const action of actions) {
          await executeEnforcementAction(supabase, action);
          results.enforcementActions++;
        }
      } catch (error) {
        console.error(
          `[Indiana Compliance] Error processing holder ${holder.id}:`,
          error
        );
        results.errors.push(`Holder ${holder.id}: ${error.message}`);
      }
    }


    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
async function checkReportingCompliance(
  supabase: any,
  programHolderId: string
) {
  // Check if required reports have been submitted
  const today = new Date();
  const checks = [];

  // Example: Check student data submission (quarterly)
  const { data: lastSubmission } = await supabase
    .from('indiana_report_submissions')
    .select('*')
    .eq('program_holder_id', programHolderId)
    .eq('report_type', 'student_data_submission')
    .order('submitted_date', { ascending: false })
    .limit(1)
    .single();

  const daysSinceLastSubmission = lastSubmission
    ? Math.floor(
        (today.getTime() - new Date(lastSubmission.submitted_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 999;

  checks.push({
    reportType: 'student_data_submission',
    daysSinceLastSubmission,
    isOverdue: daysSinceLastSubmission > 90, // Quarterly = 90 days
    alertRequired: daysSinceLastSubmission > 83, // 7 days before due
  });

  return checks;
}

async function checkPerformanceCompliance(
  supabase: any,
  programHolderId: string
) {
  // Check if performance metrics meet standards
  const { data: metrics } = await supabase
    .from('indiana_performance_metrics')
    .select('*')
    .eq('program_holder_id', programHolderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!metrics) {
    return {
      meetsStandards: false,
      failures: ['No performance data available'],
      alertRequired: true,
    };
  }

  const failures = [];
  if (metrics.employment_rate < 0.7) {
    failures.push(
      `Employment rate ${(metrics.employment_rate * 100).toFixed(1)}% below 70% standard`
    );
  }
  if (metrics.credential_rate < 0.6) {
    failures.push(
      `Credential rate ${(metrics.credential_rate * 100).toFixed(1)}% below 60% standard`
    );
  }

  return {
    meetsStandards: failures.length === 0,
    failures,
    alertRequired: failures.length > 0,
    employmentRate: metrics.employment_rate,
    credentialRate: metrics.credential_rate,
  };
}

function generateAlerts(
  holder: any,
  reportingChecks: unknown[],
  performanceChecks: any
) {
  const alerts = [];

  // Generate reporting alerts
  for (const check of reportingChecks) {
    if (check.alertRequired) {
      alerts.push({
        programHolderId: holder.id,
        level: check.isOverdue ? 'critical' : 'warning',
        type: 'reporting_compliance',
        subject: `${check.reportType} ${check.isOverdue ? 'OVERDUE' : 'Due Soon'}`,
        message: `Report is ${check.isOverdue ? 'overdue' : 'due soon'}. Last submission: ${check.daysSinceLastSubmission} days ago.`,
        channels: ['email', 'dashboard'],
      });
    }
  }

  // Generate performance alerts
  if (performanceChecks.alertRequired) {
    alerts.push({
      programHolderId: holder.id,
      level: 'warning',
      type: 'performance_compliance',
      subject: 'Performance Standards Not Met',
      message: performanceChecks.failures.join('; '),
      channels: ['email', 'dashboard'],
    });
  }

  return alerts;
}

function generateEnforcementActions(
  holder: any,
  reportingChecks: unknown[],
  performanceChecks: any
) {
  const actions = [];

  // Check for critical overdue reports
  for (const check of reportingChecks) {
    if (check.isOverdue && check.daysSinceLastSubmission > 120) {
      actions.push({
        programHolderId: holder.id,
        action: 'block_enrollments',
        reason: `${check.reportType} overdue by ${check.daysSinceLastSubmission} days`,
        effectiveDate: new Date().toISOString(),
      });
    }
  }

  return actions;
}

async function sendAlert(supabase: any, alert: any) {
  // Log alert to database
  await supabase.from('indiana_alerts_sent').insert({
    program_holder_id: alert.programHolderId,
    alert_level: alert.level,
    alert_type: alert.type,
    subject: alert.subject,
    body: alert.message,
    channels: alert.channels,
    sent_at: new Date().toISOString(),
  });

  console.log(
    `[Alert] Sent ${alert.level} alert to ${alert.programHolderId}: ${alert.subject}`
  );
}

async function executeEnforcementAction(supabase: any, action: any) {
  // Log enforcement action to database
  await supabase.from('indiana_enforcement_actions').insert({
    program_holder_id: action.programHolderId,
    action: action.action,
    reason: action.reason,
    effective_date: action.effectiveDate,
    notification_sent: false,
  });

  console.log(
    `[Enforcement] Executed ${action.action} for ${action.programHolderId}: ${action.reason}`
  );
}
