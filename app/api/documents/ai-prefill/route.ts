import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { aiChat } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Field labels shown to the user in the review panel
const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full Name',
  first_name: 'First Name',
  last_name: 'Last Name',
  date_of_birth: 'Date of Birth',
  ssn_last4: 'SSN (last 4)',
  phone: 'Phone',
  address: 'Address',
  city: 'City',
  state: 'State',
  zip: 'ZIP Code',
  email: 'Email',
  gender: 'Gender',
  race: 'Race / Ethnicity',
  veteran_status: 'Veteran Status',
  disability_status: 'Disability Status',
  education_level: 'Education Level',
  employer_name: 'Employer Name',
  employer_address: 'Employer Address',
  ein: 'EIN',
  license_number: 'License Number',
  expiration_date: 'Expiration Date',
  issue_date: 'Issue Date',
  document_number: 'Document Number',
  issuing_state: 'Issuing State / Authority',
  income_amount: 'Income Amount',
  pay_period: 'Pay Period',
};

// Which profile columns each extracted field maps to.
// ssn_last4 is intentionally excluded — it must be written via
// lib/security/secure-identity.ts to the secure_identity table, not profiles.
const PROFILE_FIELD_MAP: Record<string, { table: string; column: string }> = {
  full_name: { table: 'profiles', column: 'full_name' },
  first_name: { table: 'profiles', column: 'first_name' },
  last_name: { table: 'profiles', column: 'last_name' },
  date_of_birth: { table: 'profiles', column: 'date_of_birth' },
  phone: { table: 'profiles', column: 'phone' },
  address: { table: 'profiles', column: 'address' },
  city: { table: 'profiles', column: 'city' },
  state: { table: 'profiles', column: 'state' },
  zip: { table: 'profiles', column: 'zip_code' },
};

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const db = await requireAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { documentId, documentType } = body as { documentId?: string; documentType?: string };

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    // Fetch the document record — must belong to this user
    const { data: doc, error: docErr } = await db
      .from('documents')
      .select('id, file_path, mime_type, ocr_text, document_type')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (docErr || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Fetch current profile so AI can compare / fill gaps
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'full_name, first_name, last_name, date_of_birth, phone, address, city, state, zip_code, email',
      )
      .eq('id', user.id)
      .maybeSingle();

    // Get OCR text — use stored value if available, otherwise generate a signed URL
    // and ask AI to extract from the raw text we already have
    let ocrText = doc.ocr_text as string | null;

    // If no OCR text yet, generate a signed URL and attempt extraction via AI vision
    if (!ocrText) {
      const { data: signedData } = await db.storage
        .from('documents')
        .createSignedUrl(doc.file_path as string, 120);

      if (signedData?.signedUrl) {
        // Use AI to extract text from the document URL
        try {
          const extractResult = await aiChat({
            messages: [
              {
                role: 'system',
                content:
                  'You are a document OCR assistant. Extract all readable text from the document. Return only the raw extracted text, no commentary.',
              },
              {
                role: 'user',
                content: `Extract all text from this document: ${signedData.signedUrl}`,
              },
            ],
            temperature: 0,
            maxTokens: 2000,
          });
          ocrText = extractResult.content ?? null;
        } catch (err) {
          logger.warn('[ai-prefill] AI text extraction failed, proceeding without OCR', err);
        }
      }
    }

    if (!ocrText) {
      return NextResponse.json({
        fields: [],
        message: 'Could not extract text from this document. Please fill in fields manually.',
      });
    }

    // Ask AI to map extracted text to structured fields
    const docLabel = documentType || doc.document_type || 'document';
    const profileContext = profile
      ? `Current profile data (use to fill gaps, do NOT override with lower-confidence values):\n${JSON.stringify(
          {
            full_name: profile.full_name,
            first_name: profile.first_name,
            last_name: profile.last_name,
            date_of_birth: profile.date_of_birth,
            phone: profile.phone,
            address: profile.address,
            city: profile.city,
            state: profile.state,
            zip_code: profile.zip_code,
            email: profile.email,
          },
          null,
          2,
        )}`
      : 'No existing profile data.';

    const systemPrompt = `You are a document field extraction assistant for a workforce training platform.
Given OCR text from a ${docLabel}, extract structured fields and return ONLY valid JSON.

Rules:
- Only include fields you can extract with reasonable confidence
- For names, split into first_name and last_name when possible
- Dates must be in YYYY-MM-DD format
- Do not extract or include SSN or any part of a social security number
- Do not invent or guess values
- Return an empty fields array if nothing can be extracted

${profileContext}

Return this exact JSON shape:
{
  "fields": [
    {
      "key": "field_key",
      "value": "extracted value",
      "confidence": "high" | "medium" | "low",
      "source": "document" | "profile_match"
    }
  ]
}

Valid field keys: ${Object.keys(FIELD_LABELS).join(', ')}`;

    const aiResult = await aiChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Document OCR text:\n\n${ocrText.slice(0, 4000)}` },
      ],
      temperature: 0,
      maxTokens: 1500,
    });

    // Parse AI response
    let extracted: { fields: { key: string; value: string; confidence: string; source: string }[] } =
      { fields: [] };
    try {
      const raw = aiResult.content ?? '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      logger.warn('[ai-prefill] Failed to parse AI JSON response', parseErr);
    }

    // Enrich each field with label and profile mapping info
    const enrichedFields = (extracted.fields ?? [])
      .filter((f) => f.key && f.value && FIELD_LABELS[f.key])
      .map((f) => ({
        key: f.key,
        label: FIELD_LABELS[f.key] ?? f.key,
        value: f.value,
        confidence: f.confidence ?? 'medium',
        source: f.source ?? 'document',
        canSaveToProfile: !!PROFILE_FIELD_MAP[f.key],
        profileTarget: PROFILE_FIELD_MAP[f.key] ?? null,
      }));

    return NextResponse.json({ fields: enrichedFields });
  } catch (err) {
    logger.error('[api/documents/ai-prefill] error', err);
    return safeInternalError();
  }
}

// PATCH — apply confirmed fields to the user's profile
export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { fields } = body as {
      fields: { key: string; value: string }[];
    };

    if (!Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: 'fields array is required' }, { status: 400 });
    }

    // Build profile update from confirmed fields
    const profileUpdate: Record<string, string> = {};
    for (const f of fields) {
      const mapping = PROFILE_FIELD_MAP[f.key];
      if (mapping?.table === 'profiles' && f.value) {
        profileUpdate[mapping.column] = f.value;
      }
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id);

      if (updateErr) {
        logger.error('[ai-prefill PATCH] profile update failed', updateErr);
        return NextResponse.json({ error: 'Failed to save fields' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, saved: Object.keys(profileUpdate) });
  } catch (err) {
    logger.error('[api/documents/ai-prefill PATCH] error', err);
    return safeInternalError();
  }
}
