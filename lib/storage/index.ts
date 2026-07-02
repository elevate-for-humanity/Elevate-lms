/**
 * Storage Module - Barrel Export
 * 
 * Central export point for all storage utilities.
 * Supabase Storage and Cloudflare R2 are both supported.
 */

// Supabase Storage - Course Assets
export {
  BUCKETS,
  uploadCourseAsset,
  deleteCourseAsset,
  getCourseAssetSignedUrl,
  getPublicCourseAssetUrl,
  uploadStudentSubmission,
  uploadCertificate,
  uploadToCertBucket,
  listCourseAssets,
} from './course-assets';

// Supabase Storage - File Storage (Product downloads)
export {
  PRODUCT_FILES,
  isStorageConfigured,
  generateSignedDownloadUrl,
  uploadFile,
  getProductFileInfo,
  getPublicFallbackUrl,
} from './file-storage';

// Cloudflare R2
export {
  isR2Configured,
  uploadToR2,
  uploadFromUrlToR2,
  deleteFromR2,
  getSignedR2Url,
  listR2Files,
  getR2PublicUrl,
  getContentType,
  type UploadResult,
} from '@/lib/cloudflare-r2';

// Signed URL utilities
export { getSignedDownloadUrl } from './getSignedDownload';
export { generateSignedUrl } from './signed-url';

// Compliance Evidence
export { uploadComplianceEvidenceFile } from './complianceEvidence';
