/**
 * Native Modules Wrapper
 * 
 * Provides safe access to native dependencies (sharp, canvas, pdfkit)
 * with error handling and graceful fallbacks to prevent segfaults.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentType = any;

// Track initialization state
let sharpInstance: typeof import('sharp') | null = null;
let canvasInstance: typeof import('@napi-rs/canvas') | null = null;
let pdfkitInstance: typeof import('pdfkit') | null = null;
let initializationError: string | null = null;

/**
 * Wrapper for operations that might cause segfaults
 * Forces garbage collection and catches any errors
 */
export async function withSegfaultProtection<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>,
  operationName?: string
): Promise<{ result: T | null; error?: string }> {
  const name = operationName || 'operation';
  
  try {
    // Suggest GC before heavy operation
    if (global.gc) {
      global.gc();
    }
    
    const result = await operation();
    return { result };
  } catch (e) {
    console.error(`[NativeModules] ${name} failed:`, e);
    
    // Force GC after failure
    if (global.gc) {
      global.gc();
    }
    
    if (fallback) {
      try {
        const fallbackResult = await fallback();
        return { result: fallbackResult };
      } catch (fallbackError) {
        return { result: null, error: `${String(e)}; Fallback also failed: ${String(fallbackError)}` };
      }
    }
    
    return { result: null, error: String(e) };
  }
}

/**
 * Execute PDFKit operations with segfault protection
 */
export async function withPDFKit<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup: (doc: any) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finish: (doc: any) => Promise<T>,
  options?: Record<string, unknown>
): Promise<{ result: T | null; error?: string }> {
  const { PDFDocument, available } = await getPDFKit();
  
  if (!available || !PDFDocument) {
    return { result: null, error: 'PDFKit not available' };
  }
  
  return withSegfaultProtection(
    async () => {
      const doc = new PDFDocument(options);
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      
      setup(doc);
      
      return finish(doc).then(async (result) => {
        return new Promise<T>((resolve, reject) => {
          doc.end();
          doc.on('end', () => {
            resolve(result);
          });
          doc.on('error', reject);
        });
      });
    },
    undefined,
    'PDFKit operation'
  );
}

/**
 * Safely initialize native modules
 * Call this at app startup to catch any initialization errors early
 */
export async function initializeNativeModules(): Promise<{
  success: boolean;
  error?: string;
  modules: {
    sharp: boolean;
    canvas: boolean;
    pdfkit: boolean;
  };
}> {
  const result = {
    success: true,
    modules: {
      sharp: false,
      canvas: false,
      pdfkit: false,
    },
  };

  // Try sharp
  try {
    sharpInstance = await import('sharp');
    result.modules.sharp = true;
  } catch (e) {
    console.warn('[NativeModules] sharp initialization failed:', e);
  }

  // Try canvas
  try {
    canvasInstance = await import('@napi-rs/canvas');
    result.modules.canvas = true;
  } catch (e) {
    console.warn('[NativeModules] canvas initialization failed:', e);
  }

  // Try pdfkit
  try {
    pdfkitInstance = await import('pdfkit');
    result.modules.pdfkit = true;
  } catch (e) {
    console.warn('[NativeModules] pdfkit initialization failed:', e);
  }

  if (!result.modules.sharp && !result.modules.canvas && !result.modules.pdfkit) {
    result.success = false;
    initializationError = 'All native modules failed to initialize';
  }

  return result;
}

/**
 * Get sharp instance with error handling
 */
export async function getSharp(): Promise<{
  sharp: typeof import('sharp');
  available: boolean;
}> {
  if (sharpInstance) {
    return { sharp: sharpInstance, available: true };
  }

  try {
    const sharpModule = await import('sharp');
    sharpInstance = sharpModule;
    return { sharp: sharpModule, available: true };
  } catch (e) {
    console.error('[NativeModules] sharp not available:', e);
    return {
      sharp: null as unknown as typeof import('sharp'),
      available: false,
    };
  }
}

/**
 * Get canvas instance with error handling
 */
export async function getCanvas(): Promise<{
  canvas: typeof import('@napi-rs/canvas') | null;
  available: boolean;
}> {
  if (canvasInstance) {
    return { canvas: canvasInstance, available: true };
  }

  try {
    const canvas = await import('@napi-rs/canvas');
    canvasInstance = canvas;
    return { canvas, available: true };
  } catch (e) {
    console.error('[NativeModules] canvas not available:', e);
    return { canvas: null, available: false };
  }
}

/**
 * Get PDFKit constructor with error handling
 */
export async function getPDFKit(): Promise<{
  PDFDocument: typeof import('pdfkit');
  available: boolean;
}> {
  if (pdfkitInstance) {
    return { PDFDocument: pdfkitInstance, available: true };
  }

  try {
    const pdfkit = await import('pdfkit');
    pdfkitInstance = pdfkit;
    return { PDFDocument: pdfkit, available: true };
  } catch (e) {
    console.error('[NativeModules] pdfkit not available:', e);
    return {
      PDFDocument: null as unknown as typeof import('pdfkit'),
      available: false,
    };
  }
}

/**
 * Safe sharp image processing with fallback
 */
export async function processImageWithSharp(
  input: Buffer | string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operations: (pipeline: any) => any,
  fallback?: () => Promise<Buffer>
): Promise<{ result: Buffer | null; error?: string }> {
  try {
    const { sharp, available } = await getSharp();
    if (!available) {
      if (fallback) {
        const result = await fallback();
        return { result };
      }
      return { result: null, error: 'sharp not available' };
    }

    // sharp(input) creates a pipeline - use default import
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sharpFn = (sharp as any).default || (sharp as any);
    let pipeline = sharpFn(input);
    pipeline = operations(pipeline);
    const result = await pipeline.toBuffer();
    return { result };
  } catch (e) {
    console.error('[NativeModules] sharp processing failed:', e);
    if (fallback) {
      try {
        const result = await fallback();
        return { result };
      } catch (fallbackError) {
        return { result: null, error: String(fallbackError) };
      }
    }
    return { result: null, error: String(e) };
  }
}

/**
 * Safe canvas operations with fallback
 */
export async function withCanvas(
  width: number,
  height: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operation: (canvas: any) => void,
  fallback?: () => Promise<void>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { canvas, available } = await getCanvas();
    if (!available) {
      if (fallback) {
        await fallback();
        return { success: true };
      }
      return { success: false, error: 'canvas not available' };
    }

    const c = new canvas.Canvas(width, height);
    operation(c);
    return { success: true };
  } catch (e) {
    console.error('[NativeModules] canvas operation failed:', e);
    if (fallback) {
      try {
        await fallback();
        return { success: true };
      } catch (fallbackError) {
        return { success: false, error: String(fallbackError) };
      }
    }
    return { success: false, error: String(e) };
  }
}

/**
 * Safe PDF document creation with fallback
 */
export async function createPDFDocument(
  options?: Record<string, unknown>,
  fallback?: () => Promise<Buffer>
): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any;
  available: boolean;
  error?: string;
}> {
  try {
    const { PDFDocument, available } = await getPDFKit();
    if (!available) {
      if (fallback) {
        const buffer = await fallback();
        return { doc: null, available: false };
      }
      return { doc: null, available: false, error: 'pdfkit not available' };
    }

    const doc = new PDFDocument(options);
    return { doc, available: true };
  } catch (e) {
    console.error('[NativeModules] PDFDocument creation failed:', e);
    if (fallback) {
      try {
        await fallback();
        return { doc: null, available: false };
      } catch (fallbackError) {
        return { doc: null, available: false, error: String(fallbackError) };
      }
    }
    return { doc: null, available: false, error: String(e) };
  }
}

/**
 * Get initialization error if any
 */
export function getInitializationError(): string | null {
  return initializationError;
}

/**
 * Check if native modules are available
 */
export function isNativeModuleAvailable(module: 'sharp' | 'canvas' | 'pdfkit'): boolean {
  switch (module) {
    case 'sharp':
      return sharpInstance !== null;
    case 'canvas':
      return canvasInstance !== null;
    case 'pdfkit':
      return pdfkitInstance !== null;
    default:
      return false;
  }
}
