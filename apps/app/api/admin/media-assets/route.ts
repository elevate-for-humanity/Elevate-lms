import { NextRequest } from 'next/server';
import {
  createMediaAsset,
  listMediaAssets,
} from '@/lib/admin/media-assets-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return listMediaAssets(request);
}

export async function POST(request: NextRequest) {
  return createMediaAsset(request);
}
