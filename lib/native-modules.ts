/**
 * Native module boundary.
 * Dynamic CJS/ESM imports are normalized here so the rest of the app never
 * depends on package-loader shape differences in Node/Northflank.
 */

let sharpInstance: any = null;
let canvasInstance: any = null;
let pdfkitInstance: any = null;
let fontkitInstance: any = null;
let initializationError: string | null = null;

function moduleDefault<T = any>(module: any): T {
  return (module?.default ?? module) as T;
}

export async function withSegfaultProtection<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>,
  operationName = 'operation',
): Promise<{ result: T | null; error?: string }> {
  try {
    global.gc?.();
    return { result: await operation() };
  } catch (error) {
    console.error(`[NativeModules] ${operationName} failed:`, error);
    global.gc?.();
    if (fallback) {
      try {
        return { result: await fallback() };
      } catch (fallbackError) {
        return { result: null, error: `${String(error)}; fallback failed: ${String(fallbackError)}` };
      }
    }
    return { result: null, error: String(error) };
  }
}

export async function initializeNativeModules(): Promise<{
  success: boolean;
  errors: Record<string, string>;
  modules: { sharp: boolean; canvas: boolean; pdfkit: boolean; fontkit: boolean };
}> {
  const errors: Record<string, string> = {};
  const modules = { sharp: false, canvas: false, pdfkit: false, fontkit: false };

  try {
    sharpInstance = moduleDefault(await import('sharp'));
    modules.sharp = typeof sharpInstance === 'function';
  } catch (error) {
    errors.sharp = error instanceof Error ? error.message : String(error);
  }
  try {
    canvasInstance = await import('@napi-rs/canvas');
    modules.canvas = Boolean(canvasInstance?.Canvas);
  } catch (error) {
    errors.canvas = error instanceof Error ? error.message : String(error);
  }
  try {
    pdfkitInstance = moduleDefault(await import('pdfkit'));
    modules.pdfkit = typeof pdfkitInstance === 'function';
  } catch (error) {
    errors.pdfkit = error instanceof Error ? error.message : String(error);
  }
  try {
    fontkitInstance = moduleDefault(await import('fontkit'));
    modules.fontkit = Boolean(fontkitInstance);
  } catch (error) {
    errors.fontkit = error instanceof Error ? error.message : String(error);
  }

  initializationError = Object.keys(errors).length ? Object.entries(errors).map(([name, message]) => `${name}: ${message}`).join('; ') : null;
  const success = modules.sharp && modules.canvas && modules.pdfkit && modules.fontkit;
  return { success, errors, modules };
}

export async function getSharp(): Promise<{ sharp: any; available: boolean }> {
  if (typeof sharpInstance === 'function') return { sharp: sharpInstance, available: true };
  try {
    sharpInstance = moduleDefault(await import('sharp'));
    return { sharp: sharpInstance, available: typeof sharpInstance === 'function' };
  } catch (error) {
    console.error('[NativeModules] sharp not available:', error);
    return { sharp: null, available: false };
  }
}

export async function getCanvas(): Promise<{ canvas: any; available: boolean }> {
  if (canvasInstance?.Canvas) return { canvas: canvasInstance, available: true };
  try {
    canvasInstance = await import('@napi-rs/canvas');
    return { canvas: canvasInstance, available: Boolean(canvasInstance?.Canvas) };
  } catch (error) {
    console.error('[NativeModules] canvas not available:', error);
    return { canvas: null, available: false };
  }
}

export async function getPDFKit(): Promise<{ PDFDocument: any; available: boolean }> {
  if (typeof pdfkitInstance === 'function') return { PDFDocument: pdfkitInstance, available: true };
  try {
    pdfkitInstance = moduleDefault(await import('pdfkit'));
    return { PDFDocument: pdfkitInstance, available: typeof pdfkitInstance === 'function' };
  } catch (error) {
    console.error('[NativeModules] pdfkit not available:', error);
    return { PDFDocument: null, available: false };
  }
}

export async function withPDFKit<T>(
  setup: (doc: any) => void,
  finish: (doc: any) => Promise<T>,
  options?: Record<string, unknown>,
): Promise<{ result: T | null; error?: string }> {
  const { PDFDocument, available } = await getPDFKit();
  if (!available || !PDFDocument) return { result: null, error: 'PDFKit not available' };

  return withSegfaultProtection(async () => {
    const doc = new PDFDocument(options);
    setup(doc);
    const result = await finish(doc);
    return await new Promise<T>((resolve, reject) => {
      doc.once('end', () => resolve(result));
      doc.once('error', reject);
      doc.end();
    });
  }, undefined, 'PDFKit operation');
}

export async function processImageWithSharp(
  input: Buffer | string,
  operations: (pipeline: any) => any,
  fallback?: () => Promise<Buffer>,
): Promise<{ result: Buffer | null; error?: string }> {
  try {
    const { sharp, available } = await getSharp();
    if (!available || typeof sharp !== 'function') {
      return fallback ? { result: await fallback() } : { result: null, error: 'sharp not available' };
    }
    const pipeline = operations(sharp(input));
    return { result: await pipeline.toBuffer() };
  } catch (error) {
    console.error('[NativeModules] sharp processing failed:', error);
    if (fallback) {
      try {
        return { result: await fallback() };
      } catch (fallbackError) {
        return { result: null, error: String(fallbackError) };
      }
    }
    return { result: null, error: String(error) };
  }
}

export async function withCanvas(
  width: number,
  height: number,
  operation: (canvas: any) => void,
  fallback?: () => Promise<void>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { canvas, available } = await getCanvas();
    if (!available || !canvas?.Canvas) {
      if (fallback) {
        await fallback();
        return { success: true };
      }
      return { success: false, error: 'canvas not available' };
    }
    operation(new canvas.Canvas(width, height));
    return { success: true };
  } catch (error) {
    console.error('[NativeModules] canvas operation failed:', error);
    if (fallback) {
      try {
        await fallback();
        return { success: true };
      } catch (fallbackError) {
        return { success: false, error: String(fallbackError) };
      }
    }
    return { success: false, error: String(error) };
  }
}

export async function createPDFDocument(
  options?: Record<string, unknown>,
  fallback?: () => Promise<Buffer>,
): Promise<{ doc: any; available: boolean; error?: string }> {
  try {
    const { PDFDocument, available } = await getPDFKit();
    if (!available || !PDFDocument) {
      if (fallback) await fallback();
      return { doc: null, available: false, error: 'pdfkit not available' };
    }
    return { doc: new PDFDocument(options), available: true };
  } catch (error) {
    console.error('[NativeModules] PDFDocument creation failed:', error);
    if (fallback) {
      try { await fallback(); } catch (fallbackError) { return { doc: null, available: false, error: String(fallbackError) }; }
    }
    return { doc: null, available: false, error: String(error) };
  }
}

export function getInitializationError(): string | null {
  return initializationError;
}

export function isNativeModuleAvailable(module: 'sharp' | 'canvas' | 'pdfkit'): boolean {
  if (module === 'sharp') return typeof sharpInstance === 'function';
  if (module === 'canvas') return Boolean(canvasInstance?.Canvas);
  return typeof pdfkitInstance === 'function';
}

export type NativeModuleName = 'sharp' | 'canvas' | 'fontkit' | 'pdfkit';
export type NativeModuleResult = {
  success: boolean;
  modules: Record<NativeModuleName, boolean>;
  errors: Partial<Record<NativeModuleName, string>>;
};

export async function checkNativeModules(): Promise<NativeModuleResult> {
  const init = await initializeNativeModules();
  return {
    success: init.success,
    modules: { sharp: init.modules.sharp, canvas: init.modules.canvas, fontkit: init.modules.fontkit, pdfkit: init.modules.pdfkit },
    errors: init.errors as Partial<Record<NativeModuleName, string>>,
  };
}
