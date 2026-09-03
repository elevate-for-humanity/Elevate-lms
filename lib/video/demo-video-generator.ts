/**
 * Demo Video Generator
 * 
 * Auto-generates demo videos based on subscriptions + Pexels B-roll.
 * Creates professional product demos without screen recording.
 * 
 * Usage:
 *   POST /api/demo/video-generate
 *   {
 *     planId: 'uuid',
 *     sections: ['overview', 'features', 'pricing', 'demo']
 *   }
 */

import { createClient } from '@supabase/supabase-js';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || 'IJJFHHBQ7lP0Dmn9vDvPWjLrfQTZhmVyWWYou0UD1fnXgkAdXrzdEZpw';

// Subscription plan to Pexels video mappings
const PLAN_VIDEO_MAPPING: Record<string, PlanVideoConfig> = {
  'lms-essentials': {
    searchTerms: ['online learning education', 'student laptop classroom', 'course video tutorial'],
    chapters: [
      { title: 'Welcome to Your Learning Journey', duration: 5 },
      { title: 'Course Catalog & Enrollment', duration: 10 },
      { title: 'Interactive Video Lessons', duration: 15 },
      { title: 'Progress Tracking & Certificates', duration: 10 },
    ],
  },
  'lms-professional': {
    searchTerms: ['business training corporate', 'professional development office', 'teamwork meeting'],
    chapters: [
      { title: 'Welcome to Professional Learning', duration: 5 },
      { title: 'Advanced Course Builder', duration: 15 },
      { title: 'Instructor Dashboard', duration: 12 },
      { title: 'Student Analytics & Reports', duration: 10 },
      { title: 'Certification Management', duration: 8 },
    ],
  },
  'admin-enterprise': {
    searchTerms: ['admin dashboard analytics', 'business software office', 'data management'],
    chapters: [
      { title: 'Enterprise Admin Overview', duration: 5 },
      { title: 'Student Management', duration: 12 },
      { title: 'Enrollment Pipeline', duration: 10 },
      { title: 'Billing & Subscriptions', duration: 10 },
      { title: 'Reporting & Analytics', duration: 8 },
      { title: 'API Integrations', duration: 7 },
    ],
  },
  'barber-apprenticeship': {
    searchTerms: ['barber scissors haircut', 'salon styling men', 'professional barbering'],
    chapters: [
      { title: 'Barber Apprenticeship Overview', duration: 5 },
      { title: 'Host Shop Matching', duration: 10 },
      { title: 'OJL & RTI Training', duration: 12 },
      { title: 'Competency Tracking', duration: 10 },
      { title: 'State Board Prep', duration: 8 },
    ],
  },
  'cosmetology-program': {
    searchTerms: ['beauty salon hair', 'makeup artist styling', 'cosmetology makeup'],
    chapters: [
      { title: 'Cosmetology Program Overview', duration: 5 },
      { title: 'Theory & Practical Training', duration: 15 },
      { title: 'Clinical Practice', duration: 12 },
      { title: 'Licensing Preparation', duration: 10 },
    ],
  },
  'hvac-training': {
    searchTerms: ['hvac air conditioning', 'refrigeration technician', 'heating cooling system'],
    chapters: [
      { title: 'HVAC Training Overview', duration: 5 },
      { title: 'EPA 608 Certification', duration: 15 },
      { title: 'Practical Skills Training', duration: 12 },
      { title: 'Industry Certification', duration: 8 },
    ],
  },
  'cna-certification': {
    searchTerms: ['nurse hospital healthcare', 'medical nursing care', 'healthcare worker patient'],
    chapters: [
      { title: 'CNA Certification Overview', duration: 5 },
      { title: 'Clinical Skills Training', duration: 15 },
      { title: 'Patient Care Fundamentals', duration: 12 },
      { title: 'Certification Exam Prep', duration: 10 },
    ],
  },
  'default': {
    searchTerms: ['business software platform', 'professional training education', 'technology solution'],
    chapters: [
      { title: 'Platform Overview', duration: 5 },
      { title: 'Key Features', duration: 10 },
      { title: 'Getting Started', duration: 8 },
      { title: 'Next Steps', duration: 5 },
    ],
  },
};

interface Chapter {
  title: string;
  duration: number;
}

interface PlanVideoConfig {
  searchTerms: string[];
  chapters: Chapter[];
}

export interface DemoVideoRequest {
  planId?: string;
  planSlug: string;
  title?: string;
  description?: string;
  sections?: ('overview' | 'features' | 'pricing' | 'demo' | 'testimonials')[];
}

export interface DemoVideoResult {
  success: boolean;
  planSlug: string;
  title: string;
  videos: {
    section: string;
    videoUrl: string;
    thumbnail: string;
    duration: number;
  }[];
  totalDuration: number;
}

/**
 * Search Pexels for a relevant video
 */
async function searchPexelsVideo(query: string): Promise<{ url: string; thumbnail: string; duration: number } | null> {
  try {
    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { 'Authorization': PEXELS_API_KEY } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.videos || data.videos.length === 0) return null;
    
    // Find best video (HD, good duration)
    const video = data.videos.find((v: any) => 
      v.duration >= 10 && 
      v.video_files?.some((f: any) => f.quality === 'hd')
    ) || data.videos[0];
    
    const hdFile = video.video_files?.find((f: any) => f.quality === 'hd');
    const mp4File = video.video_files?.find((f: any) => f.file_type.includes('mp4'));
    
    return {
      url: hdFile?.link || mp4File?.link || video.video_files?.[0]?.link,
      thumbnail: video.image || video.picture,
      duration: video.duration,
    };
  } catch (error) {
    console.error('Pexels search failed:', error);
    return null;
  }
}

/**
 * Generate demo videos for a subscription plan
 */
export async function generateDemoVideos(request: DemoVideoRequest): Promise<DemoVideoResult> {
  const { planSlug, title, description, sections = ['overview', 'features', 'demo'] } = request;
  
  // Get plan config
  const config = PLAN_VIDEO_MAPPING[planSlug] || PLAN_VIDEO_MAPPING['default'];
  
  console.info(`🎬 Generating demo videos for: ${planSlug}`);
  console.info(`   Sections: ${sections.join(', ')}`);
  
  const videos: DemoVideoResult['videos'] = [];
  let totalDuration = 0;
  
  // Generate video for each section
  for (const section of sections) {
    // Search for relevant video
    const searchTerm = config.searchTerms[Math.floor(Math.random() * config.searchTerms.length)];
    const video = await searchPexelsVideo(searchTerm);
    
    if (video) {
      videos.push({
        section,
        videoUrl: video.url,
        thumbnail: video.thumbnail,
        duration: video.duration,
      });
      totalDuration += video.duration;
      
      console.info(`   ✅ ${section}: ${video.url.substring(0, 50)}...`);
    } else {
      console.warn(`   ⚠️ ${section}: No video found for "${searchTerm}"`);
    }
  }
  
  return {
    success: videos.length > 0,
    planSlug,
    title: title || `${planSlug} Demo`,
    videos,
    totalDuration,
  };
}

/**
 * Get all available demo video configs
 */
export function getDemoVideoConfigs() {
  return Object.entries(PLAN_VIDEO_MAPPING).map(([slug, config]) => ({
    slug,
    searchTerms: config.searchTerms,
    chapterCount: config.chapters.length,
    estimatedDuration: config.chapters.reduce((sum, c) => sum + c.duration, 0),
  }));
}

/**
 * Get Pexels videos for multiple search terms (batch)
 */
export async function getPexelsVideosForPlan(planSlug: string): Promise<{
  urls: string[];
  thumbnails: string[];
}> {
  const config = PLAN_VIDEO_MAPPING[planSlug] || PLAN_VIDEO_MAPPING['default'];
  
  const results = await Promise.all(
    config.searchTerms.map(term => searchPexelsVideo(term))
  );
  
  return {
    urls: results.filter(r => r).map(r => r!.url),
    thumbnails: results.filter(r => r).map(r => r!.thumbnail),
  };
}
