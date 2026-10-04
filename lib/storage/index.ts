/**
 * Storage Module - Barrel Export
 * 
 * Central export point for all storage utilities.
 * Supabase Storage and provider-neutral S3-compatible object storage are supported.
 */

// Supabase Storage - Course Assets
export {
  BUCKETS,
  uploadCourseAsset,
  deleteCourseAsset,
  getSignedCourseAssetUrl as getCourseAssetSignedUrl,
  getPublicCourseAssetUrl,
  uploadStudentSubmission,
  uploadCertificateTemplate as uploadCertificate,
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

// Provider-neutral S3-compatible object storage
export {
  getObjectStorageConfig,
  getObjectStorageClient,
  getObjectStoragePublicUrl,
  getObjectStorageRuntimeSummary,
  isObjectStorageConfigured,
  isObjectStoragePublicDeliveryConfigured,
  uploadToObjectStorage,
  uploadFromUrlToObjectStorage,
  deleteFromObjectStorage,
  getSignedObjectUrl,
  listObjectStorageKeys,
  getContentType,
  type ObjectStorageConfig,
  type ObjectStorageProvider,
  type ObjectUploadResult,
} from './object-storage';

// Legacy R2 names remain available while callers migrate.
export {
  isR2Configured,
  uploadToR2,
  uploadFromUrlToR2,
  deleteFromR2,
  getSignedR2Url,
  listR2Files,
  getR2PublicUrl,
  type UploadResult,
} from '@/lib/cloudflare-r2';

// Signed URL utilities
export { getSignedDocumentUrl as getSignedDownloadUrl } from './signed-url';

// Compliance Evidence
export { uploadComplianceEvidenceFile } from './complianceEvidence';
