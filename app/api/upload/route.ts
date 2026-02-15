import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@/lib/supabase/server';
import { rateLimitNew as rateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types with their MIME types and valid extensions
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
};

// Magic bytes for file type validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'application/msword': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]], // ZIP-based
};

// Rate limit: 10 uploads per minute per user
const UPLOAD_RATE_LIMIT = { limit: 10, windowMs: 60_000 };

/**
 * Validate file extension against allowed types
 */
function isValidExtension(mimeType: string, extension: string): boolean {
  const allowedExtensions = ALLOWED_FILE_TYPES[mimeType];
  if (!allowedExtensions) return false;
  return allowedExtensions.includes(extension.toLowerCase());
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let sanitized = filename.replace(/[/\\:*?"<>|]/g, '').replace(/\0/g, '');
  
  // Remove all dot sequences (path traversal prevention)
  sanitized = sanitized.replace(/\.{2,}/g, '.');
  
  // Remove leading dots to prevent hidden files
  sanitized = sanitized.replace(/^\.+/, '');
  
  // Limit length
  if (sanitized.length > 100) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.slice(0, 90);
    sanitized = ext ? `${name}.${ext}` : name;
  }
  
  return sanitized || 'unnamed';
}

/**
 * Validate file content matches declared MIME type using magic bytes
 */
async function validateFileContent(file: File, declaredMimeType: string): Promise<boolean> {
  const signatures = FILE_SIGNATURES[declaredMimeType];
  if (!signatures) {
    // For types without signature validation, rely on extension check
    return true;
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  return signatures.some(signature => {
    if (bytes.length < signature.length) return false;
    return signature.every((byte, index) => bytes[index] === byte);
  });
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts.pop()?.toLowerCase() || '';
}

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting
    const identifier = `upload:${user.id}`;
    const rateLimitResult = rateLimit(identifier, UPLOAD_RATE_LIMIT);

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { success: false, error: 'Too many upload requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          }
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate MIME type is in allowed list
    if (!ALLOWED_FILE_TYPES[file.type]) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed. Allowed types: PDF, DOC, DOCX, JPG, PNG' },
        { status: 400 }
      );
    }

    // Sanitize and validate filename
    const sanitizedName = sanitizeFilename(file.name);
    const extension = getFileExtension(sanitizedName);

    if (!extension) {
      return NextResponse.json(
        { success: false, error: 'File must have a valid extension' },
        { status: 400 }
      );
    }

    // Validate extension matches MIME type
    if (!isValidExtension(file.type, extension)) {
      return NextResponse.json(
        { success: false, error: 'File extension does not match file type' },
        { status: 400 }
      );
    }

    // Validate file content (magic bytes)
    const contentValid = await validateFileContent(file, file.type);
    if (!contentValid) {
      logger.warn('File content validation failed', { 
        userId: user.id, 
        filename: sanitizedName,
        declaredType: file.type 
      });
      return NextResponse.json(
        { success: false, error: 'File content does not match declared type' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate secure unique filename (no user input in final path)
    const timestamp = Date.now();
    const randomString = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const safeExtension = extension.replace(/[^a-z0-9]/gi, '');
    const filename = `${timestamp}-${randomString}.${safeExtension}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return file URL
    const fileUrl = `/uploads/${filename}`;

    logger.info('File uploaded successfully', {
      userId: user.id,
      filename,
      originalName: sanitizedName,
      size: file.size,
      type: file.type,
    });

    return NextResponse.json({
      success: true,
      data: {
        filename,
        originalName: sanitizedName,
        url: fileUrl,
        size: file.size,
        type: file.type
      }
    });
  } catch (error) {
    logger.error('Upload error:', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'No filename provided' },
        { status: 400 }
      );
    }

    // Validate filename format to prevent path traversal
    // Only allow alphanumeric, dash, underscore, and single dot for extension
    const safeFilenamePattern = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/;
    if (!safeFilenamePattern.test(filename)) {
      return NextResponse.json(
        { success: false, error: 'Invalid filename format' },
        { status: 400 }
      );
    }

    logger.info('File deletion requested', {
      userId: user.id,
      filename,
    });

    // Delete from Supabase storage with ownership verification
    if (supabase) {
      // Verify file belongs to user by checking path prefix
      const userPrefix = `${user.id}/`;
      if (!filename.startsWith(userPrefix)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized to delete this file' },
          { status: 403 }
        );
      }

      const { error } = await supabase.storage
        .from('uploads')
        .remove([filename]);

      if (error) {
        logger.error('Storage deletion error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to delete file from storage' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('Delete error:', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
