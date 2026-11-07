import { describe, expect, it } from 'vitest';
import { isTransientElevateMediaUploadFailure } from '@/lib/storage/elevate-media-storage';

describe('B2 transient storage classification', () => {
  it('retries provider incidents, 429 and 5xx without retrying authorization failures', () => {
    expect(isTransientElevateMediaUploadFailure(new Error('internal incident'))).toBe(true);
    expect(isTransientElevateMediaUploadFailure({name:'InternalError'})).toBe(true);
    expect(isTransientElevateMediaUploadFailure({$metadata:{httpStatusCode:503}})).toBe(true);
    expect(isTransientElevateMediaUploadFailure({$metadata:{httpStatusCode:429}})).toBe(true);
    expect(isTransientElevateMediaUploadFailure({$metadata:{httpStatusCode:403}})).toBe(false);
    expect(isTransientElevateMediaUploadFailure(new Error('missing bucket credentials'))).toBe(false);
  });
});
