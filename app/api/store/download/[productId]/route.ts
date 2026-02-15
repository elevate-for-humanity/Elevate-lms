import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Changed from edge to support S3 SDK
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { getDigitalProduct } from '@/lib/store/digital-products';
import { createClient } from '@/lib/supabase/server';
import { generateSignedDownloadUrl, isStorageConfigured, getProductFileInfo, getPublicFallbackUrl } from '@/lib/storage/file-storage';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

/**
 * Download digital product
 *
 * This endpoint handles secure download delivery for purchased digital products.
 * Verifies purchase tokens, tracks downloads, and delivers files via signed URLs.
 */

async function verifyDownloadToken(
  token: string,
  productId: string
): Promise<{ valid: boolean; userId?: string }> {
  try {
    const supabase = await createClient();

    // Check if purchase exists with this token
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*, user_id')
      .eq('download_token', token)
      .eq('product_id', productId)
      .single();

    if (!purchase) return { valid: false };

    // Check if token has expired (24 hours)
    if (purchase.token_expires_at) {
      const expiresAt = new Date(purchase.token_expires_at);
      if (expiresAt < new Date()) return { valid: false };
    }

    return { valid: true, userId: purchase.user_id };
  } catch (error) {
    // Token verification failed
    return { valid: false };
  }
}

async function verifyUserEntitlement(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data: entitlement } = await supabase
      .from('user_entitlements')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('status', 'active')
      .single();

    return !!entitlement;
  } catch (error) {
    return false;
  }
}

async function logDownload(
  productId: string,
  token: string,
  request: NextRequest
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from('downloads').insert({
      product_id: productId,
      download_token: token,
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    });
  } catch (error) {
      logger.error("Unhandled error", error instanceof Error ? error : undefined);
    }
}

/**
 * Handle download request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { productId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token'); // Verification token from purchase

    // Get product
    const product = getDigitalProduct(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify purchase token
    if (!token) {
      return NextResponse.json(
        { error: 'Download token required' },
        { status: 401 }
      );
    }

    // Verify token against purchase records
    const tokenResult = await verifyDownloadToken(token, productId);
    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired download link' },
        { status: 403 }
      );
    }

    // Double-check user entitlement
    if (tokenResult.userId) {
      const hasEntitlement = await verifyUserEntitlement(tokenResult.userId, productId);
      if (!hasEntitlement) {
        return NextResponse.json(
          { error: 'Access revoked or expired' },
          { status: 403 }
        );
      }
    }

    // Log download attempt
    await logDownload(productId, token, request);

    // Check if storage is configured (R2/S3)
    if (isStorageConfigured()) {
      // Generate signed URL from S3/R2
      const fileInfo = getProductFileInfo(productId);
      if (fileInfo) {
        const signedUrl = await generateSignedDownloadUrl(productId, 3600); // 1 hour expiry
        if (signedUrl) {
          return NextResponse.redirect(signedUrl);
        }
      }
    }

    // Fallback: return product download URL if configured
    if (product.downloadUrl) {
      return NextResponse.redirect(product.downloadUrl);
    }

    // Fallback: use public folder if file exists there
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    const publicUrl = getPublicFallbackUrl(productId, baseUrl);
    if (publicUrl) {
      return NextResponse.redirect(publicUrl);
    }

    // If no download URL configured, return error
    return NextResponse.json({
      error: 'Download not available',
      message: 'Please contact support for assistance.',
    }, { status: 503 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    );
  }
}
