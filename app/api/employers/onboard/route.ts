import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const {
      employer_id,
      documents,
      business_name,
      contact_name,
      contact_email,
      contact_phone,
    } = body;

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    const { data, error }: any = await db
      .from('employer_onboarding')
      .insert([
        {
          employer_id,
          business_name,
          contact_name,
          contact_email,
          contact_phone,
          documents,
          status: 'submitted',
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    // Send notification email to admin
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'info@elevateforhumanity.org',
          subject: `New Employer Onboarding: ${business_name}`,
          html: `
            <h2>New Employer Onboarding Submission</h2>
            <p><strong>Business Name:</strong> ${business_name}</p>
            <p><strong>Contact:</strong> ${contact_name}</p>
            <p><strong>Email:</strong> ${contact_email}</p>
            <p><strong>Phone:</strong> ${contact_phone}</p>
            <p><strong>Status:</strong> Submitted for review</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/employers/onboarding">Review Submission</a></p>
          `,
        }),
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true, onboarding: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = createAdminClient();

    const { data, error }: any = await db
      .from('employer_onboarding')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ onboardings: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
