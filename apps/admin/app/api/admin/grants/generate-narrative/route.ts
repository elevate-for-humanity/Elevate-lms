import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Field-specific prompts — workforce/grant language, no fluff
const FIELD_PROMPTS: Record<string, string> = {
  executive_summary:
    'Write a 3-sentence executive summary for a workforce development grant application. Lead with the problem, state the solution, end with the measurable outcome. Sound like an experienced nonprofit director wrote it.',
  problem_statement:
    'Write a 2-paragraph problem statement for a workforce development grant. Use specific language about barriers to employment, skills gaps, and economic conditions. Do not use generic filler. Flag any statistics you cannot verify with [VERIFY].',
  project_description:
    'Write a 3-paragraph project description for a workforce training program. Describe the training model, delivery method, and participant pathway. Be specific about activities, not aspirational.',
  goals_and_objectives:
    'Write 3-5 SMART goals for a workforce development grant. Each goal must be measurable. Format as a numbered list. Flag any metrics you cannot verify with [VERIFY].',
  evaluation_plan:
    'Write an evaluation plan for a workforce development grant. Include data collection methods, success metrics, and reporting frequency. Be specific and operational.',
  sustainability_plan:
    'Write a sustainability plan for a workforce development grant. Address funding diversification, earned revenue, and institutional partnerships. Be realistic, not aspirational.',
  budget_narrative:
    'Write a budget narrative justification for a workforce development grant. Justify each major cost category. Be specific about how funds will be used. Do not invent dollar amounts — use [AMOUNT] as placeholder.',
  target_population:
    'Write a 1-paragraph description of the target population for a workforce development grant. Be specific about demographics, barriers, and eligibility criteria.',
  partner_agencies:
    'Write a 1-paragraph description of partner agencies and their roles in a workforce development program. Be specific about each partner\'s contribution.',
};

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'public');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { field, org_name, uei, opportunity_title, agency, target_population, geographic_area, existing } = body;

  if (!field) return safeError('field required', 400);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return safeError('OpenAI not configured', 500);

  const fieldPrompt = FIELD_PROMPTS[field];
  if (!fieldPrompt) return safeError(`No prompt defined for field: ${field}`, 400);

  // Load org facts from DB to ground the response
  const db = await requireAdminClient();
  const { data: facts } = await db
    .from('sos_organization_facts')
    .select('fact_key, fact_value_json')
    .eq('status', 'approved');

  const factLines = (facts ?? [])
    .map(f => `${f.fact_key}: ${typeof f.fact_value_json === 'string' ? f.fact_value_json : JSON.stringify(f.fact_value_json)}`)
    .join('\n');

  const systemPrompt = `You are a professional grant writer for a workforce development nonprofit.
You write in a direct, credible, operational voice — not corporate, not academic, not generic AI.
You never invent statistics or facts. If a metric is unknown, write [VERIFY: description].
You use the organization's verified data below as your source of truth.

ORGANIZATION DATA:
Organization: ${org_name ?? 'Not provided'}
UEI: ${uei ?? 'Not provided'}
Geographic Area: ${geographic_area ?? 'Not provided'}
Target Population: ${target_population ?? 'Not provided'}

VERIFIED FACTS:
${factLines || 'No facts on file — flag all specific claims with [VERIFY]'}

GRANT CONTEXT:
Opportunity: ${opportunity_title ?? 'Not provided'}
Agency: ${agency ?? 'Not provided'}

RULES:
- Sound like a real person wrote this, not AI
- No filler phrases like "we are committed to" or "our mission is to"
- Use active voice
- Be specific about activities, not aspirational about values
- Flag unverifiable claims with [VERIFY: what needs to be verified]
- Keep responses under 300 words unless the field requires more`;

  const userPrompt = existing
    ? `Improve this existing draft. Keep what's good, fix what's weak:\n\n${existing}\n\n${fieldPrompt}`
    : fieldPrompt;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return safeError(`OpenAI error: ${err.slice(0, 200)}`, 502);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ text, field, source: 'ai_drafted_narrative' });
  } catch (e) {
    return safeInternalError(e, 'Narrative generation failed');
  }
}
