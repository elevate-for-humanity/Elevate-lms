/**
 * Upload API Security Tests
 *
 * Tests authentication, rate limiting, file validation, and path traversal prevention
 */

import { describe, it, expect, beforeEach } from 'vitest';

// File type validation constants (mirroring the API)
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
};

const FILE_SIGNATURES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'application/msword': [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4b, 0x03, 0x04],
  ],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper functions (mirroring the API implementation)
function isValidExtension(mimeType: string, extension: string): boolean {
  const allowedExtensions = ALLOWED_FILE_TYPES[mimeType];
  if (!allowedExtensions) return false;
  return allowedExtensions.includes(extension.toLowerCase());
}

function sanitizeFilename(filename: string): string {
  let sanitized = filename.replace(/[\/\\:\*\?"<>\|]/g, '').replace(/\0/g, '');

  // Remove all dot sequences (path traversal prevention)
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  sanitized = sanitized.replace(/^\.+/, '');

  if (sanitized.length > 100) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.slice(0, 90);
    sanitized = ext ? `${name}.${ext}` : name;
  }

  return sanitized || 'unnamed';
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts.pop()?.toLowerCase() || '';
}

function validateFileContent(bytes: Uint8Array, declaredMimeType: string): boolean {
  const signatures = FILE_SIGNATURES[declaredMimeType];
  if (!signatures) return true;

  return signatures.some((signature) => {
    if (bytes.length < signature.length) return false;
    return signature.every((byte, index) => bytes[index] === byte);
  });
}

function isValidFilenameFormat(filename: string): boolean {
  const safeFilenamePattern = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/;
  return safeFilenamePattern.test(filename);
}

// Mock rate limiter
class MockRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private limit: number;
  private windowMs: number;

  constructor(limit: number = 10, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(identifier: string): { ok: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || entry.resetTime < now) {
      this.requests.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return { ok: true, remaining: this.limit - 1 };
    }

    entry.count++;
    const remaining = Math.max(0, this.limit - entry.count);
    return { ok: entry.count <= this.limit, remaining };
  }

  reset() {
    this.requests.clear();
  }
}

// Mock upload service
interface UploadResult {
  success: boolean;
  error?: string;
  data?: {
    filename: string;
    originalName: string;
    url: string;
    size: number;
    type: string;
  };
}

class MockUploadService {
  private rateLimiter: MockRateLimiter;
  private authenticatedUsers: Set<string> = new Set(['user-1', 'user-2', 'admin-1']);

  constructor() {
    this.rateLimiter = new MockRateLimiter(10, 60000);
  }

  async upload(
    userId: string | null,
    file: { name: string; type: string; size: number; content: Uint8Array },
  ): Promise<UploadResult> {
    // Authentication check
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    if (!this.authenticatedUsers.has(userId)) {
      return { success: false, error: 'Authentication required' };
    }

    // Rate limiting
    const rateLimitResult = this.rateLimiter.check(`upload:${userId}`);
    if (!rateLimitResult.ok) {
      return { success: false, error: 'Too many upload requests. Please try again later.' };
    }

    // File presence check
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File size exceeds 10MB limit' };
    }

    // MIME type validation
    if (!ALLOWED_FILE_TYPES[file.type]) {
      return {
        success: false,
        error: 'File type not allowed. Allowed types: PDF, DOC, DOCX, JPG, PNG',
      };
    }

    // Filename sanitization and validation
    const sanitizedName = sanitizeFilename(file.name);
    const extension = getFileExtension(sanitizedName);

    if (!extension) {
      return { success: false, error: 'File must have a valid extension' };
    }

    // Extension-MIME type match validation
    if (!isValidExtension(file.type, extension)) {
      return { success: false, error: 'File extension does not match file type' };
    }

    // Content validation (magic bytes)
    if (!validateFileContent(file.content, file.type)) {
      return { success: false, error: 'File content does not match declared type' };
    }

    // Generate secure filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 18);
    const safeExtension = extension.replace(/[^a-z0-9]/gi, '');
    const filename = `${timestamp}-${randomString}.${safeExtension}`;

    return {
      success: true,
      data: {
        filename,
        originalName: sanitizedName,
        url: `/uploads/${filename}`,
        size: file.size,
        type: file.type,
      },
    };
  }

  async delete(
    userId: string | null,
    filename: string,
  ): Promise<{ success: boolean; error?: string }> {
    // Authentication check
    if (!userId || !this.authenticatedUsers.has(userId)) {
      return { success: false, error: 'Authentication required' };
    }

    // Filename validation
    if (!filename) {
      return { success: false, error: 'No filename provided' };
    }

    if (!isValidFilenameFormat(filename)) {
      return { success: false, error: 'Invalid filename format' };
    }

    return { success: true };
  }

  resetRateLimiter() {
    this.rateLimiter.reset();
  }
}

describe('Upload API Security', () => {
  let uploadService: MockUploadService;

  beforeEach(() => {
    uploadService = new MockUploadService();
  });

  describe('Authentication', () => {
    it('should reject unauthenticated upload requests', async () => {
      const file = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF
      };

      const result = await uploadService.upload(null, file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });

    it('should reject requests from unknown users', async () => {
      const file = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      };

      const result = await uploadService.upload('unknown-user', file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });

    it('should accept authenticated upload requests', async () => {
      const file = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject unauthenticated delete requests', async () => {
      const result = await uploadService.delete(null, '12345-abc.pdf');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const file = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      };

      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        const result = await uploadService.upload('user-1', file);
        expect(result.success).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', async () => {
      const file = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      };

      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        await uploadService.upload('user-1', file);
      }

      // 11th request should be blocked
      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many upload requests. Please try again later.');
    });

    it('should track rate limits per user', async () => {
      const file = {
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024,
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      };

      // User 1 makes 10 requests
      for (let i = 0; i < 10; i++) {
        await uploadService.upload('user-1', file);
      }

      // User 1 is blocked
      const user1Result = await uploadService.upload('user-1', file);
      expect(user1Result.success).toBe(false);

      // User 2 can still upload
      const user2Result = await uploadService.upload('user-2', file);
      expect(user2Result.success).toBe(true);
    });
  });

  describe('File Size Validation', () => {
    it('should reject files exceeding size limit', async () => {
      const file = {
        name: 'large.pdf',
        type: 'application/pdf',
        size: 11 * 1024 * 1024, // 11MB
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File size exceeds 10MB limit');
    });

    it('should accept files within size limit', async () => {
      const file = {
        name: 'normal.pdf',
        type: 'application/pdf',
        size: 5 * 1024 * 1024, // 5MB
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(true);
    });
  });

  describe('File Type Validation', () => {
    it('should reject disallowed MIME types', async () => {
      const file = {
        name: 'script.js',
        type: 'application/javascript',
        size: 1024,
        content: new Uint8Array([0x63, 0x6f, 0x6e, 0x73, 0x74]), // "const"
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File type not allowed. Allowed types: PDF, DOC, DOCX, JPG, PNG');
    });

    it('should reject HTML files', async () => {
      const file = {
        name: 'page.html',
        type: 'text/html',
        size: 1024,
        content: new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c]), // "<html"
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File type not allowed. Allowed types: PDF, DOC, DOCX, JPG, PNG');
    });

    it('should accept allowed MIME types', async () => {
      const allowedFiles = [
        {
          name: 'doc.pdf',
          type: 'application/pdf',
          content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
        },
        { name: 'image.jpg', type: 'image/jpeg', content: new Uint8Array([0xff, 0xd8, 0xff]) },
        {
          name: 'image.png',
          type: 'image/png',
          content: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        },
      ];

      for (const fileData of allowedFiles) {
        uploadService.resetRateLimiter();
        const result = await uploadService.upload('user-1', { ...fileData, size: 1024 });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Extension Validation', () => {
    it('should reject mismatched extension and MIME type', async () => {
      const file = {
        name: 'fake.jpg', // Claims to be JPG
        type: 'application/pdf', // But MIME says PDF
        size: 1024,
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File extension does not match file type');
    });

    it('should reject files without extension', async () => {
      const file = {
        name: 'noextension',
        type: 'application/pdf',
        size: 1024,
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File must have a valid extension');
    });
  });

  describe('Content Validation (Magic Bytes)', () => {
    it('should reject PDF with wrong magic bytes', async () => {
      const file = {
        name: 'fake.pdf',
        type: 'application/pdf',
        size: 1024,
        content: new Uint8Array([0x00, 0x00, 0x00, 0x00]), // Not PDF magic bytes
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File content does not match declared type');
    });

    it('should reject JPEG with wrong magic bytes', async () => {
      const file = {
        name: 'fake.jpg',
        type: 'image/jpeg',
        size: 1024,
        content: new Uint8Array([0x89, 0x50, 0x4e, 0x47]), // PNG magic bytes
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File content does not match declared type');
    });

    it('should accept files with correct magic bytes', async () => {
      const file = {
        name: 'valid.pdf',
        type: 'application/pdf',
        size: 1024,
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]), // %PDF-1.4
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(true);
    });
  });

  describe('Filename Sanitization', () => {
    it('should sanitize path traversal attempts', () => {
      const maliciousNames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config',
        'file/../../../secret.txt',
        '/etc/passwd',
        'C:\\Windows\\System32\\config',
      ];

      for (const name of maliciousNames) {
        const sanitized = sanitizeFilename(name);
        expect(sanitized).not.toContain('..');
        expect(sanitized).not.toContain('/');
        expect(sanitized).not.toContain('\\');
      }
    });

    it('should remove null bytes', () => {
      const nameWithNull = 'file\x00.pdf';
      const sanitized = sanitizeFilename(nameWithNull);
      expect(sanitized).not.toContain('\x00');
    });

    it('should remove leading dots', () => {
      const hiddenFile = '.hidden.pdf';
      const sanitized = sanitizeFilename(hiddenFile);
      expect(sanitized).not.toMatch(/^\./);
    });

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(200) + '.pdf';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(100);
      expect(sanitized).toMatch(/\.pdf$/);
    });

    it('should handle empty filename', () => {
      const sanitized = sanitizeFilename('');
      expect(sanitized).toBe('unnamed');
    });

    it('should remove special characters', () => {
      const specialName = 'file<>:"|?*.pdf';
      const sanitized = sanitizeFilename(specialName);
      expect(sanitized).not.toMatch(/[<>:"|?*]/);
    });
  });

  describe('Delete Filename Validation', () => {
    it('should reject path traversal in delete', async () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        'uploads/../secret.txt',
      ];

      for (const filename of maliciousFilenames) {
        const result = await uploadService.delete('user-1', filename);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid filename format');
      }
    });

    it('should reject filenames with special characters', async () => {
      const invalidFilenames = [
        'file name.pdf', // space
        'file<script>.pdf', // HTML chars
        'file;rm -rf.pdf', // command injection
      ];

      for (const filename of invalidFilenames) {
        const result = await uploadService.delete('user-1', filename);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid filename format');
      }
    });

    it('should accept valid filenames', async () => {
      const validFilenames = [
        '1234567890-abcdef123456.pdf',
        'timestamp-random_string.jpg',
        'file-name_123.png',
      ];

      for (const filename of validFilenames) {
        const result = await uploadService.delete('user-1', filename);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Generated Filename Security', () => {
    it('should generate safe filenames without user input', async () => {
      const file = {
        name: '../../../malicious.pdf',
        type: 'application/pdf',
        size: 1024,
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(true);
      expect(result.data?.filename).not.toContain('..');
      expect(result.data?.filename).not.toContain('/');
      expect(result.data?.filename).toMatch(/^\d+-[a-z0-9]+\.pdf$/);
    });

    it('should preserve original name separately', async () => {
      const file = {
        name: 'my document.pdf',
        type: 'application/pdf',
        size: 1024,
        content: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      };

      const result = await uploadService.upload('user-1', file);

      expect(result.success).toBe(true);
      expect(result.data?.originalName).toBe('my document.pdf');
      expect(result.data?.filename).not.toBe('my document.pdf');
    });
  });
});

describe('File Extension Validation', () => {
  it('should validate PDF extension', () => {
    expect(isValidExtension('application/pdf', 'pdf')).toBe(true);
    expect(isValidExtension('application/pdf', 'PDF')).toBe(true);
    expect(isValidExtension('application/pdf', 'jpg')).toBe(false);
  });

  it('should validate JPEG extensions', () => {
    expect(isValidExtension('image/jpeg', 'jpg')).toBe(true);
    expect(isValidExtension('image/jpeg', 'jpeg')).toBe(true);
    expect(isValidExtension('image/jpeg', 'png')).toBe(false);
  });

  it('should validate PNG extension', () => {
    expect(isValidExtension('image/png', 'png')).toBe(true);
    expect(isValidExtension('image/png', 'PNG')).toBe(true);
    expect(isValidExtension('image/png', 'jpg')).toBe(false);
  });

  it('should validate DOC extensions', () => {
    expect(isValidExtension('application/msword', 'doc')).toBe(true);
    expect(
      isValidExtension(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'docx',
      ),
    ).toBe(true);
  });

  it('should reject unknown MIME types', () => {
    expect(isValidExtension('application/x-malware', 'exe')).toBe(false);
    expect(isValidExtension('text/javascript', 'js')).toBe(false);
  });
});

describe('File Content Validation', () => {
  it('should validate PDF magic bytes', () => {
    const validPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const invalidPdf = new Uint8Array([0x00, 0x00, 0x00, 0x00]);

    expect(validateFileContent(validPdf, 'application/pdf')).toBe(true);
    expect(validateFileContent(invalidPdf, 'application/pdf')).toBe(false);
  });

  it('should validate JPEG magic bytes', () => {
    const validJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const invalidJpeg = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

    expect(validateFileContent(validJpeg, 'image/jpeg')).toBe(true);
    expect(validateFileContent(invalidJpeg, 'image/jpeg')).toBe(false);
  });

  it('should validate PNG magic bytes', () => {
    const validPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const invalidPng = new Uint8Array([0xff, 0xd8, 0xff]);

    expect(validateFileContent(validPng, 'image/png')).toBe(true);
    expect(validateFileContent(invalidPng, 'image/png')).toBe(false);
  });

  it('should handle files shorter than signature', () => {
    const shortFile = new Uint8Array([0x25, 0x50]);
    expect(validateFileContent(shortFile, 'application/pdf')).toBe(false);
  });
});
