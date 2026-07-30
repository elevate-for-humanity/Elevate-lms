import { NextResponse } from 'next/server';
import { checkNativeModules } from '@/lib/native-modules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await checkNativeModules();

  const failedModules = Object.entries(result.modules)
    .filter(([, loaded]) => !loaded)
    .map(([name]) => name);

  if (!result.success) {
    console.error('[native-health] Native modules unavailable:', {
      failedModules,
      errors: result.errors,
    });
  }

  return NextResponse.json(
    {
      ready: result.success,
      modules: result.modules,
      failedModules: failedModules.length ? failedModules : undefined,
      timestamp: new Date().toISOString(),
    },
    {
      status: result.success ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
