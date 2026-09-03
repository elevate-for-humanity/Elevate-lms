/**
 * Admin-native module health checker.
 * Lazy-loads native modules for the /api/health/native endpoint.
 * Does NOT eagerly initialize at startup — only when the route is called.
 */

export type NativeModuleName = 'sharp' | 'canvas' | 'fontkit' | 'pdfkit';

export type NativeModuleResult = {
  success: boolean;
  modules: Record<NativeModuleName, boolean>;
  errors: Partial<Record<NativeModuleName, string>>;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function checkNativeModules(): Promise<NativeModuleResult> {
  const modules: Record<NativeModuleName, boolean> = {
    sharp: false,
    canvas: false,
    fontkit: false,
    pdfkit: false,
  };

  const errors: Partial<Record<NativeModuleName, string>> = {};

  try {
    await import('sharp');
    modules.sharp = true;
  } catch (error) {
    errors.sharp = getErrorMessage(error);
  }

  try {
    await import('@napi-rs/canvas');
    modules.canvas = true;
  } catch (error) {
    errors.canvas = getErrorMessage(error);
  }

  try {
    await import('fontkit');
    modules.fontkit = true;
  } catch (error) {
    errors.fontkit = getErrorMessage(error);
  }

  try {
    await import('pdfkit');
    modules.pdfkit = true;
  } catch (error) {
    errors.pdfkit = getErrorMessage(error);
  }

  return {
    success: Object.values(modules).every(Boolean),
    modules,
    errors,
  };
}
