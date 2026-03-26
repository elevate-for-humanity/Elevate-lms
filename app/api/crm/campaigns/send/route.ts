// Using Node.js runtime for email compatibility

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      ![
        'admin',
        'super_admin',
        'staff',
        'program_holder',
        'instructor',
      ].includes(profile.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const {
      name,
      subject,
      from_name,
      from_email,
      html_content,
      target_audience,
    } = body;

    // Get recipients based on target audience
    let recipients: any[] = [];

    switch (target_audience) {
      case 'all_students':
        const { data: allStudents } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'student');
        recipients = allStudents || [];
        break;

      case 'active_students':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: activeStudents } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'student')
          .gte('last_sign_in_at', sevenDaysAgo.toISOString());
        recipients = activeStudents || [];
        break;

      case 'inactive_students':
        const sevenDaysAgoInactive = new Date();
        sevenDaysAgoInactive.setDate(sevenDaysAgoInactive.getDate() - 7);
        const { data: inactiveStudents } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'student')
          .lt('last_sign_in_at', sevenDaysAgoInactive.toISOString());
        recipients = inactiveStudents || [];
        break;

      case 'program_holders':
        const { data: programHolders } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'program_holder');
        recipients = programHolders || [];
        break;

      case 'instructors':
        const { data: instructors } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'instructor');
        recipients = instructors || [];
        break;

      case 'employers':
        const { data: employers } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'employer');
        recipients = employers || [];
        break;

      case 'staff':
        const { data: staff } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'staff');
        recipients = staff || [];
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid target audience' },
          { status: 400 }
        );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found' },
        { status: 400 }
      );
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        name,
        subject,
        from_name,
        from_email,
        html_content,
        status: 'sending',
        sent_count: 0,
        opened_count: 0,
        clicked_count: 0,
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    // Send emails in batches (Resend allows 100 per request)
    let sentCount = 0;
    const batchSize = 100;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      // Replace variables in HTML for each recipient
      const emailPromises = batch.map(async (recipient) => {
        const personalizedContent = html_content
          .replace(/\{\{student_name\}\}/g, recipient.full_name || 'Student')
          .replace(/\{\{user_name\}\}/g, recipient.full_name || 'User')
          .replace(/\{\{organization_name\}\}/g, 'Elevate for Humanity')
          .replace(
            /\{\{dashboard_link\}\}/g,
            'https://www.elevateforhumanity.org/dashboard'
          )
          .replace(/\{\{support_email\}\}/g, 'support@elevateforhumanity.org')
          .replace(/\{\{support_phone\}\}/g, '(555) 123-4567');

        try {
          await resend.emails.send({
            from: `${from_name} <${from_email}>`,
            to: recipient.email,
            subject,
            html: personalizedContent,
          });

          sentCount++;

          // Log email send
          await supabase.from('email_logs').insert({
            campaign_id: campaign.id,
            recipient_email: recipient.email,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });
        } catch (error) {
          // Log failure
          await supabase.from('email_logs').insert({
            campaign_id: campaign.id,
            recipient_email: recipient.email,
            status: 'failed',
            error_message:
              'Internal server error',
          });
        }
      });

      await Promise.all(emailPromises);
    }

    // Update campaign with final counts
    await supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_count: sentCount,
      })
      .eq('id', campaign.id);

    return NextResponse.json({
      success: true,
      campaign_id: campaign.id,
      sent_count: sentCount,
      total_recipients: recipients.length,
    });
  } catch (error) { 
    return NextResponse.json(
      {
        error:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/crm/campaigns/send', _POST);
