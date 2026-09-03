/**
 * Video Templates System
 *
 * Pre-built video templates for common use cases
 * Similar to InVideo's template library
 */

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  duration: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  scenes: TemplateScene[];
  customizable: string[];
}

export interface TemplateScene {
  id: string;
  type: 'title' | 'content' | 'image' | 'split' | 'outro';
  duration: number;
  background: string;
  textPosition: 'center' | 'top' | 'bottom' | 'left' | 'right';
  animation: 'fade' | 'slide' | 'zoom' | 'none';
  placeholder?: string;
}

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: 'training-intro',
    name: 'Training Course Introduction',
    description: 'Professional introduction for online training courses',
    category: 'education',
    thumbnail: '/templates/training-intro.jpg',
    duration: 30,
    aspectRatio: '16:9',
    scenes: [
      {
        id: 'title',
        type: 'title',
        duration: 5,
        background: '#1e3a8a',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Course Title',
      },
      {
        id: 'content',
        type: 'content',
        duration: 20,
        background: '#3b82f6',
        textPosition: 'center',
        animation: 'slide',
        placeholder: 'Course Description',
      },
      {
        id: 'outro',
        type: 'outro',
        duration: 5,
        background: '#1e3a8a',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Get Started',
      },
    ],
    customizable: ['title', 'description', 'colors', 'logo'],
  },
  {
    id: 'social-media-promo',
    name: 'Social Media Promo',
    description: 'Eye-catching promotional video for social media',
    category: 'marketing',
    thumbnail: '/templates/social-promo.jpg',
    duration: 15,
    aspectRatio: '9:16',
    scenes: [
      {
        id: 'hook',
        type: 'title',
        duration: 3,
        background: '#ec4899',
        textPosition: 'center',
        animation: 'zoom',
        placeholder: 'Attention-Grabbing Hook',
      },
      {
        id: 'content',
        type: 'content',
        duration: 9,
        background: '#f472b6',
        textPosition: 'center',
        animation: 'slide',
        placeholder: 'Main Message',
      },
      {
        id: 'cta',
        type: 'outro',
        duration: 3,
        background: '#ec4899',
        textPosition: 'center',
        animation: 'zoom',
        placeholder: 'Call to Action',
      },
    ],
    customizable: ['text', 'colors', 'music'],
  },
  {
    id: 'product-demo',
    name: 'Product Demonstration',
    description: 'Showcase your product or service features',
    category: 'marketing',
    thumbnail: '/templates/product-demo.jpg',
    duration: 45,
    aspectRatio: '16:9',
    scenes: [
      {
        id: 'intro',
        type: 'title',
        duration: 5,
        background: '#059669',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Product Name',
      },
      {
        id: 'feature1',
        type: 'split',
        duration: 10,
        background: '#10b981',
        textPosition: 'left',
        animation: 'slide',
        placeholder: 'Feature 1',
      },
      {
        id: 'feature2',
        type: 'split',
        duration: 10,
        background: '#10b981',
        textPosition: 'right',
        animation: 'slide',
        placeholder: 'Feature 2',
      },
      {
        id: 'feature3',
        type: 'split',
        duration: 10,
        background: '#10b981',
        textPosition: 'left',
        animation: 'slide',
        placeholder: 'Feature 3',
      },
      {
        id: 'cta',
        type: 'outro',
        duration: 10,
        background: '#059669',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Get Started Today',
      },
    ],
    customizable: ['features', 'images', 'colors', 'cta'],
  },
  {
    id: 'testimonial',
    name: 'Customer Testimonial',
    description: 'Highlight customer success stories',
    category: 'marketing',
    thumbnail: '/templates/testimonial.jpg',
    duration: 30,
    aspectRatio: '1:1',
    scenes: [
      {
        id: 'intro',
        type: 'title',
        duration: 5,
        background: '#7c3aed',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Customer Success Story',
      },
      {
        id: 'testimonial',
        type: 'content',
        duration: 20,
        background: '#8b5cf6',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Customer Quote',
      },
      {
        id: 'outro',
        type: 'outro',
        duration: 5,
        background: '#7c3aed',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Join Our Success Stories',
      },
    ],
    customizable: ['quote', 'customer-name', 'photo', 'colors'],
  },
  {
    id: 'explainer',
    name: 'Explainer Video',
    description: 'Explain complex concepts simply',
    category: 'education',
    thumbnail: '/templates/explainer.jpg',
    duration: 60,
    aspectRatio: '16:9',
    scenes: [
      {
        id: 'problem',
        type: 'title',
        duration: 10,
        background: '#dc2626',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'The Problem',
      },
      {
        id: 'solution',
        type: 'content',
        duration: 30,
        background: '#3b82f6',
        textPosition: 'center',
        animation: 'slide',
        placeholder: 'Our Solution',
      },
      {
        id: 'how-it-works',
        type: 'content',
        duration: 15,
        background: '#10b981',
        textPosition: 'center',
        animation: 'slide',
        placeholder: 'How It Works',
      },
      {
        id: 'cta',
        type: 'outro',
        duration: 5,
        background: '#7c3aed',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Get Started',
      },
    ],
    customizable: ['problem', 'solution', 'steps', 'colors'],
  },
  {
    id: 'announcement',
    name: 'Company Announcement',
    description: 'Share important company news',
    category: 'corporate',
    thumbnail: '/templates/announcement.jpg',
    duration: 20,
    aspectRatio: '16:9',
    scenes: [
      {
        id: 'title',
        type: 'title',
        duration: 5,
        background: '#1e293b',
        textPosition: 'center',
        animation: 'zoom',
        placeholder: 'Big News!',
      },
      {
        id: 'announcement',
        type: 'content',
        duration: 12,
        background: '#334155',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Announcement Details',
      },
      {
        id: 'outro',
        type: 'outro',
        duration: 3,
        background: '#1e293b',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Learn More',
      },
    ],
    customizable: ['announcement', 'logo', 'colors'],
  },
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    description: 'Trendy vertical video for Instagram',
    category: 'social-media',
    thumbnail: '/templates/instagram-reel.jpg',
    duration: 15,
    aspectRatio: '9:16',
    scenes: [
      {
        id: 'hook',
        type: 'title',
        duration: 2,
        background: '#f59e0b',
        textPosition: 'center',
        animation: 'zoom',
        placeholder: 'Hook',
      },
      {
        id: 'content',
        type: 'content',
        duration: 11,
        background: '#fbbf24',
        textPosition: 'bottom',
        animation: 'slide',
        placeholder: 'Content',
      },
      {
        id: 'cta',
        type: 'outro',
        duration: 2,
        background: '#f59e0b',
        textPosition: 'center',
        animation: 'zoom',
        placeholder: 'CTA',
      },
    ],
    customizable: ['text', 'music', 'effects'],
  },
  {
    id: 'youtube-intro',
    name: 'YouTube Channel Intro',
    description: 'Professional intro for YouTube videos',
    category: 'social-media',
    thumbnail: '/templates/youtube-intro.jpg',
    duration: 10,
    aspectRatio: '16:9',
    scenes: [
      {
        id: 'logo',
        type: 'title',
        duration: 3,
        background: '#000000',
        textPosition: 'center',
        animation: 'zoom',
        placeholder: 'Channel Logo',
      },
      {
        id: 'tagline',
        type: 'content',
        duration: 5,
        background: '#ff0000',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Channel Tagline',
      },
      {
        id: 'subscribe',
        type: 'outro',
        duration: 2,
        background: '#000000',
        textPosition: 'center',
        animation: 'fade',
        placeholder: 'Subscribe!',
      },
    ],
    customizable: ['logo', 'tagline', 'colors', 'music'],
  },
];

export function getTemplateById(id: string): VideoTemplate | undefined {
  return VIDEO_TEMPLATES.find((template) => template.id === id);
}

export function getTemplatesByCategory(category: string): VideoTemplate[] {
  return VIDEO_TEMPLATES.filter((template) => template.category === category);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(VIDEO_TEMPLATES.map((t) => t.category)));
}
