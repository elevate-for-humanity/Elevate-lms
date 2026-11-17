import { getSelectedRuntimeSecrets } from '../secrets';
import { initializeLaminar as initializeTracing } from './laminar';

/** Reuse the application's restricted runtime secret source in deployed servers. */
export async function initializeLaminar(service?: string): Promise<void> {
  if (process.env.NODE_ENV === 'production' && !process.env.LMNR_PROJECT_API_KEY?.trim()) {
    try {
      const values = await getSelectedRuntimeSecrets(['LMNR_PROJECT_API_KEY'], {
        signal: AbortSignal.timeout(2_000),
      });
      if (values.LMNR_PROJECT_API_KEY?.trim()) {
        process.env.LMNR_PROJECT_API_KEY = values.LMNR_PROJECT_API_KEY.trim();
      }
    } catch {
      console.warn('[laminar] Runtime tracing credential unavailable; application startup continues.');
    }
  }
  await initializeTracing(service);
}
