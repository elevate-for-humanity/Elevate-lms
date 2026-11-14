/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

// Video Storage Manager for LMS
// Uses Cloudflare R2 for video content

class VideoStorageManager {
  constructor() {
    this.bucketId = process.env.CLOUDFLARE_R2_BUCKET;
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.baseUrl = `https://${this.bucketId}.r2.cloudflarestorage.com`;
  }

  // Upload video to Cloudflare R2
  async uploadVideo(videoFile, courseId, lessonId) {
    try {
      const fileName = `videos/${courseId}/${lessonId}/${videoFile.name}`;

      // Use Cloudflare R2 API
      const response = await fetch(`${this.baseUrl}/${fileName}`, {
        method: 'PUT',
        body: videoFile,
        headers: {
          'Content-Type': videoFile.type,
        },
      });

      if (response.ok) {
        return {
          success: true,
          videoUrl: `${this.baseUrl}/${fileName}`,
          fileName: fileName,
        };
      }

      throw new Error('Upload failed');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate signed URL for video access
  getVideoUrl(courseId, lessonId, filename) {
    return `${this.baseUrl}/videos/${courseId}/${lessonId}/${filename}`;
  }

  // List all videos for a course
  async getCourseVideos(courseId) {
    try {
      const response = await fetch(`${this.baseUrl}/videos/${courseId}/`);
      return await response.json();
    } catch (error) {
      return [];
    }
  }
}

export default VideoStorageManager;
