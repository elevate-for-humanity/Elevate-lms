import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getCategories } from '@/lib/store/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || undefined;
  const audience = searchParams.get('audience') || undefined;
  const featured = searchParams.get('featured') === 'true';
  const search = searchParams.get('search') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const [products, categories] = await Promise.all([
      getProducts({ category, audience, featured, search, limit, offset }),
      getCategories(),
    ]);

    return NextResponse.json({ 
      products,
      categories,
      total: products.length,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Products API error:', error);
    return NextResponse.json({ 
      products: [], 
      categories: [],
      error: 'Failed to fetch products' 
    }, { status: 500 });
  }
}
