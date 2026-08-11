import type { NextRequest } from 'next/server';
import { createMediaAsset, listMediaAssets } from '@/lib/admin/media-assets-route';

export const dynamic = 'force-dynamic';
export const GET = (request: NextRequest) => listMediaAssets(request);
export const POST = (request: NextRequest) => createMediaAsset(request);
