import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Career course purchases use the active payment system. The retired Stripe
// checkout must never activate learner access through an old callback.
export const POST = () => NextResponse.json({ error: 'Webhook retired' }, { status: 410 });
