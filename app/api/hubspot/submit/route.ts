
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      firstname,
      lastname,
      email,
      phone,
      program,
      message,
      source = 'website-inquiry',
    } = body || {};

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const portalId = process.env.HUBSPOT_PORTAL_ID;
    const formGuid = process.env.HUBSPOT_FORM_GUID;
    const token =
      process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_API_KEY;

    if (!portalId || !formGuid || !token) {
      logger.error('HubSpot configuration missing');
      // Fallback to email if HubSpot not configured
      return NextResponse.json({
        ok: true,
        fallback: 'email',
        message: 'Form submitted (email fallback)',
      });
    }

    // HubSpot secure form submission endpoint
    const url = `https://api.hsforms.com/submissions/v3/integration/secure/submit/${portalId}/${formGuid}`;

    const payload = {
      fields: [
        { name: 'firstname', value: firstname || '' },
        { name: 'lastname', value: lastname || '' },
        { name: 'email', value: email },
        { name: 'phone', value: phone || '' },
        { name: 'program_interest', value: program || '' },
        { name: 'message', value: message || '' },
        { name: 'lead_source', value: source },
      ],
      context: {
        pageUri: req.headers.get('referer') || '',
        pageName: 'Inquiry Form',
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      logger.error('HubSpot submission failed', { data });
      return NextResponse.json(
        {
          ok: false,
          error: 'Submission failed',
          details: data,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    logger.error('HubSpot API err', err as Error);
    return NextResponse.json(
      {
        ok: false,
        err: toErrorMessage(err) || 'Internal server err',
      },
      { status: 500 }
    );
  }
}
