import { NextRequest, NextResponse } from 'next/server';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('productId') ?? request.nextUrl.searchParams.get('product_id');
  if (!productId) return safeError('productId is required', 400);
  const target = new URL(`/api/store/download/${encodeURIComponent(productId)}`, request.url);
  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    if (!['productId', 'product_id'].includes(key)) target.searchParams.set(key, value);
  }
  return NextResponse.redirect(target, 307);
}
