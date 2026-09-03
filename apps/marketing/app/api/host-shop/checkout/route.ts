import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_COST_APPLICATION_URL = '/partners/host-shop/apply';

/**
 * Host Site applications use the canonical no-cost multipart workflow.
 *
 * This endpoint previously created a paid Stripe checkout session. Keeping a
 * paid path active would conflict with the current Host Site participation
 * policy and the canonical application form.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'Host Site applications do not require payment.',
      applicationUrl: NO_COST_APPLICATION_URL,
    },
    {
      status: 410,
      headers: {
        'Cache-Control': 'no-store',
        Link: `<${NO_COST_APPLICATION_URL}>; rel="alternate"`,
      },
    },
  );
}
