/**
 * Course Asset Storage Service
 * 
 * Handles all course media and document storage using Supabase Storage.
 * All assets are stored in cloud storage, not local filesystem.
 */

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

const BUCKETS = {
  COURSE_ASSETS: 'course-assets',
  STUDENT_SUBMISSIONS: 'student-submissions',
  CERTIFICATES: 'certificates',
  VENDOR_ASSETS: 'vendor-assets',
  MARKETING: 'marketing',
} as const;

type BucketType = typeof BUCKETS[keyof typeof BUCKETS];

interface UploadResult {
  url: string;
  path: string;
  filename: string;
}

/**
 * Upload a course asset to Supabase Storage
 */
export async function uploadCourseAsset(
  courseSlug: string,
  assetType: 'hero' | 'images' | 'videos' | 'downloads' | 'worksheets' | 'quizzes' | 'certificates',
  file: File | Buffer,
  filename: string
): Promise<UploadResult> {
  const supabase = await requireAdminClient();
  const path = `${courseSlug}/${assetType}/${Date.now()}-${filename}`;
  
  let data;
  if (file instanceof File) {
    const { data: uploadData, error } = await supabase.storage
      .from(BUCKETS.COURSE_ASSETS)
      .upload(path, file, { cacheControl: '3600', upsert: true });
    
    if (error) throw error;
    data = uploadData;
  } else {
    const { data: uploadData, error } = await supabase.storage
      .from(BUCKETS.COURSE_ASSETS)
      .upload(path, file, { cacheControl: '3600', upsert: true });
    
    if (error) throw error;
    data = uploadData;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKETS.COURSE_ASSETS)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    filename,
  };
}

/**
 * Get a signed URL for private course content (videos, downloads, etc.)
 */
export async function getSignedCourseAssetUrl(
  courseSlug: string,
  assetType: string,
  filename: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = await createClient();
  const path = `${courseSlug}/${assetType}/${filename}`;

  const { data, error } = await supabase.storage
    .from(BUCKETS.COURSE_ASSETS)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

/**
 * Get public URL for public course assets (hero images, thumbnails)
 */
export function getPublicCourseAssetUrl(
  courseSlug: string,
  assetType: string,
  filename: string
): string {
  return `https://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKETS.COURSE_ASSETS}/${courseSlug}/${assetType}/${filename}`;
}

/**
 * Upload student submission
 */
export async function uploadStudentSubmission(
  studentId: string,
  courseSlug: string,
  file: File,
  submissionType: 'assignments' | 'documents' | 'portfolio'
): Promise<UploadResult> {
  const supabase = await requireAdminClient();
  const path = `${studentId}/${courseSlug}/${submissionType}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(BUCKETS.STUDENT_SUBMISSIONS)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(BUCKETS.STUDENT_SUBMISSIONS)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    filename: file.name,
  };
}

/**
 * Get signed URL for student submission
 */
export async function getSignedSubmissionUrl(
  studentId: string,
  courseSlug: string,
  filename: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = await createClient();
  const path = `${studentId}/${courseSlug}/${filename}`;

  const { data, error } = await supabase.storage
    .from(BUCKETS.STUDENT_SUBMISSIONS)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

/**
 * Upload certificate template
 */
export async function uploadCertificateTemplate(
  courseSlug: string,
  file: File
): Promise<UploadResult> {
  const supabase = await requireAdminClient();
  const path = `${courseSlug}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(BUCKETS.CERTIFICATES)
    .upload(path, file, { cacheControl: '86400', upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(BUCKETS.CERTIFICATES)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    filename: file.name,
  };
}

/**
 * Delete course asset
 */
export async function deleteCourseAsset(
  courseSlug: string,
  assetType: string,
  filename: string
): Promise<boolean> {
  const supabase = await requireAdminClient();
  const path = `${courseSlug}/${assetType}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKETS.COURSE_ASSETS)
    .remove([path]);

  return !error;
}

/**
 * List course assets
 */
export async function listCourseAssets(
  courseSlug: string,
  assetType?: string
): Promise<string[]> {
  const supabase = await requireAdminClient();
  const prefix = assetType 
    ? `${courseSlug}/${assetType}/` 
    : `${courseSlug}/`;

  const { data, error } = await supabase.storage
    .from(BUCKETS.COURSE_ASSETS)
    .list(courseSlug, { prefix: assetType ? `${assetType}/` : undefined });

  if (error) return [];

  return data?.map(f => f.name) || [];
}

export { BUCKETS };