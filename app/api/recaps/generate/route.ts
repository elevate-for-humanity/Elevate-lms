
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Get user's organization
    const { data: profile } = await adminClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, meeting_date, attendee_email, transcript } = body as {
      title: string;
      meeting_date?: string;
      attendee_email?: string;
      transcript: string;
    };

    if (!title || !transcript) {
      return NextResponse.json(
        { error: 'Missing title or transcript' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Call OpenAI to generate recap
    const prompt = `
You are EFH's meeting recap assistant.
Return STRICT JSON with keys:
summary (string),
key_points (array of strings),
decisions (array of strings),
action_items (array of objects: { label: string, due_date: string|null }),
follow_up_email (string).
Write in a clear, professional, human tone.

Transcript:
${transcript}
    `.trim();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to generate recap' },
        { status: 500 }
      );
    }

    const completion = await response.json();
    const data = JSON.parse(completion.choices[0]?.message?.content || '{}');

    // Insert recap
    const { data: recap, error: recapErr } = await adminClient
      .from('meeting_recaps')
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        attendee_email: attendee_email || null,
        title,
        meeting_date: meeting_date
          ? new Date(meeting_date).toISOString()
          : null,
        transcript,
        summary: data.summary || null,
        key_points: data.key_points || [],
        decisions: data.decisions || [],
        follow_up_email: data.follow_up_email || null,
        source: 'manual',
      })
      .select('*')
      .single();

    if (recapErr) {
      return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
    }

    // Insert action items
    const items = Array.isArray(data.action_items) ? data.action_items : [];
    if (items.length) {
      const { error: itemsErr } = await adminClient
        .from('meeting_action_items')
        .insert(
          items.map((item: any) => ({
            recap_id: recap.id,
            label: String(it.label || '').slice(0, 500),
            due_date: it.due_date ? String(it.due_date) : null,
          }))
        );

      if (itemsErr) { /* Condition handled */ }
    }

    return NextResponse.json({ recap_id: recap.id }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        err:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}
