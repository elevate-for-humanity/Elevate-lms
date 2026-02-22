import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { cloneRepository } from '@/lib/store/stripe-products';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    // Get product details
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: product, error } = await db
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Generate unique repo name
    const timestamp = Date.now();
    const newRepoName = `${product.repo.split('/')[1]}-clone-${timestamp}`;

    // Clone the repository
    const clonedRepo = await cloneRepository(product.repo, newRepoName);

    // Log the clone (optional - could save to database)
    await db.from('product_clones').insert({
      product_id: productId,
      cloned_repo: clonedRepo,
      cloned_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      message: 'Repository cloned successfully!',
      repo: clonedRepo,
      url: `https://github.com/${clonedRepo}`,
    });
  } catch (error) { 
    logger.error(
      'Clone codebase error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to clone repository',
        message: toErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
