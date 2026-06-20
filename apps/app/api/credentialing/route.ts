/**
 * Credentialing State Workforce API
 * Credential Engine - Credential Framework Publishing
 * 
 * Organization: Elevate for Humanity
 * Organization ID: #34772
 * CTID: ce-6e3defc7-c349-4d16-aadb-35f02c998758
 * 
 * Status: Pending approval
 * When approved: Will receive API key for publishing/consuming
 */

import { NextRequest, NextResponse } from 'next/server';

const CREDENTIAL_ENGINE_API = 'https://credentialengine.org/api/';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const apiKey = process.env.CREDENTIAL_ENGINE_API_KEY;

  return NextResponse.json({
    status: 'pending_approval',
    organization: {
      name: 'Elevate for Humanity',
      id: '34772',
      website: 'https://elevateforhumanity.org',
      description: 'CREDENTILING STATE WORKFORCE PROGRAMS',
      ctid: 'ce-6e3defc7-c349-4d16-aadb-35f02c998758',
    },
    capabilities: {
      publishing: 'Pending approval',
      consuming: 'Pending approval',
      competencyFrameworks: {
        published: 50,
        limit: 'Unlimited when approved',
      },
    },
    apiKeyConfigured: !!apiKey,
    endpoints: {
      credentialSearch: 'https://credentialengine.org/credentialregistry/',
      frameworkPublishing: 'https://credentialengine.org/publisher/',
      documentation: 'https://credentialengine.org/developers/',
    },
    nextSteps: apiKey ? null : [
      '1. Wait for organization approval',
      '2. Receive API key via email',
      '3. Add CREDENTIAL_ENGINE_API_KEY to secrets',
      '4. Start publishing competency frameworks',
    ],
  });
}

export async function POST(request: NextRequest) {
  const { credentialCtdlId, competencyFramework, publish } = await request.json();
  const apiKey = process.env.CREDENTIAL_ENGINE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: 'CREDENTIAL_ENGINE_API_KEY not configured',
      status: 'pending_approval',
      message: 'Add API key once your organization is approved',
    }, { status: 503 });
  }

  try {
    if (publish && competencyFramework) {
      // Publish a competency framework
      const res = await fetch(`${CREDENTIAL_ENGINE_API}publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ctid: 'ce-6e3defc7-c349-4d16-aadb-35f02c998758',
          framework: competencyFramework,
        }),
      });

      return NextResponse.json({
        success: true,
        published: await res.json(),
        organization: 'Elevate for Humanity',
      });
    }

    // Search credentials
    const searchRes = await fetch(
      `${CREDENTIAL_ENGINE_API}search?q=${encodeURIComponent(credentialCtdlId || '')}`,
      {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      }
    );

    return NextResponse.json({
      results: await searchRes.json(),
      attribution: 'Credential Engine Registry',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Credential Engine API error' }, { status: 500 });
  }
}