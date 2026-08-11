import { NextRequest } from 'next/server';
import {
  deleteMediaAsset,
  type MediaAssetRouteContext,
  updateMediaAsset,
} from '@/lib/admin/media-asset-item-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  context: MediaAssetRouteContext,
) {
  return updateMediaAsset(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: MediaAssetRouteContext,
) {
  return deleteMediaAsset(request, context);
}
