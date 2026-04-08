import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// Lazy-load OpenAI client to prevent build-time errors
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  return new OpenAI({ apiKey });
}

/**
 * POST /api/ai/build-remote
 * 
 * AI builds/enhances a user's existing website remotely.
 * User stays on their platform, we provide:
 * - Generated code snippets to add
 * - Embed scripts for LMS features
 * - API integrations
 * - Design recommendations
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;


    const body = await request.json();
    const { 
      url,
      platform, // wordpress, wix, squarespace, shopify, custom, etc.
      features, // what they want: lms, courses, payments, etc.
      scrapedData, // optional: pre-scraped site data
    } = body;

    if (!url || !platform) {
      return NextResponse.json(
        { error: 'URL and platform required' },
        { status: 400 }
      );
    }

    // Generate integration based on their platform
    const integration = await generateIntegration(url, platform, features, scrapedData);

    return NextResponse.json({
      success: true,
      integration,
    });
  } catch (error) {
    logger.error('Build remote error:', error);
    return NextResponse.json(
      { error: 'Failed to generate integration' },
      { status: 500 }
    );
  }
}

async function generateIntegration(
  url: string, 
  platform: string, 
  features: string[],
  scrapedData?: any
) {
  const siteId = `site_${Date.now().toString(36)}`;
  const apiKey = `elk_${Buffer.from(url).toString('base64').slice(0, 20)}_${Date.now().toString(36)}`;

  // Base embed script that works on any site
  const embedScript = `
<!-- Elevate LMS Integration -->
<script>
  (function(e,l,v,a,t){
    e.ElevateLMS=e.ElevateLMS||{};
    e.ElevateLMS.siteId="${siteId}";
    e.ElevateLMS.apiKey="${apiKey}";
    var s=l.createElement('script');
    s.src='https://cdn.elevatelms.com/embed.js';
    s.async=true;
    l.head.appendChild(s);
  })(window,document);
</script>
<!-- End Elevate LMS -->
`.trim();

  // Platform-specific instructions
  const platformInstructions: Record<string, any> = {
    wordpress: {
      name: 'WordPress',
      steps: [
        'Go to Appearance → Theme Editor → header.php',
        'Paste the embed code before </head>',
        'Or install our WordPress plugin for easier setup',
      ],
      pluginUrl: 'https://wordpress.org/plugins/elevate-lms/',
      shortcodes: [
        { code: '[elevate_courses]', description: 'Display course catalog' },
        { code: '[elevate_login]', description: 'Student login form' },
        { code: '[elevate_dashboard]', description: 'Student dashboard' },
        { code: '[elevate_enroll id="123"]', description: 'Enroll button for specific course' },
      ],
      phpSnippet: `
<?php
// Add to functions.php
function elevate_lms_init() {
    wp_enqueue_script('elevate-lms', 'https://cdn.elevatelms.com/embed.js', array(), '1.0', true);
    wp_localize_script('elevate-lms', 'elevateLMS', array(
        'siteId' => '${siteId}',
        'apiKey' => '${apiKey}',
        'ajaxUrl' => admin_url('admin-ajax.php'),
    ));
}
add_action('wp_enqueue_scripts', 'elevate_lms_init');
?>
`.trim(),
    },

    wix: {
      name: 'Wix',
      steps: [
        'Go to Settings → Custom Code',
        'Click "Add Custom Code"',
        'Paste the embed code',
        'Set placement to "Head"',
        'Apply to "All pages"',
      ],
      velo: `
// Add to page code for custom integration
import { elevateLMS } from 'public/elevate-lms.js';
import { applyRateLimit } from '@/lib/api/withRateLimit';

import { withRuntime } from '@/lib/api/withRuntime';

$w.onReady(function () {
    elevateLMS.init({
        siteId: '${siteId}',
        apiKey: '${apiKey}'
    });
    
    // Display courses in a repeater
    elevateLMS.getCourses().then(courses => {
        $w('#coursesRepeater').data = courses;
    });
});
`.trim(),
    },

    squarespace: {
      name: 'Squarespace',
      steps: [
        'Go to Settings → Advanced → Code Injection',
        'Paste the embed code in "Header"',
        'Save changes',
      ],
      blockCode: `
<!-- Add as Code Block where you want courses -->
<div id="elevate-courses"></div>
<script>
  ElevateLMS.render('#elevate-courses', {
    type: 'course-catalog',
    layout: 'grid',
    columns: 3
  });
</script>
`.trim(),
    },

    shopify: {
      name: 'Shopify',
      steps: [
        'Go to Online Store → Themes → Edit Code',
        'Open theme.liquid',
        'Paste embed code before </head>',
      ],
      liquidSnippet: `
{% comment %} Add to theme.liquid {% endcomment %}
{{ 'https://cdn.elevatelms.com/embed.js' | script_tag }}
<script>
  ElevateLMS.init({
    siteId: '${siteId}',
    apiKey: '${apiKey}',
    shopifyCustomerId: {{ customer.id | json }},
    shopifyCustomerEmail: {{ customer.email | json }}
  });
</script>
`.trim(),
    },

    webflow: {
      name: 'Webflow',
      steps: [
        'Go to Project Settings → Custom Code',
        'Paste in "Head Code"',
        'Publish your site',
      ],
      attributes: [
        { attr: 'data-elevate="course-card"', description: 'Turn any div into a course card' },
        { attr: 'data-elevate="enroll-btn"', description: 'Turn button into enroll action' },
        { attr: 'data-elevate="progress-bar"', description: 'Show student progress' },
      ],
    },

    custom: {
      name: 'Custom/HTML',
      steps: [
        'Add the embed code to your HTML <head>',
        'Use our JavaScript API to add features',
      ],
      apiExamples: `
// Initialize
ElevateLMS.init({
  siteId: '${siteId}',
  apiKey: '${apiKey}'
});

// Get courses
const courses = await ElevateLMS.getCourses();

// Enroll student
await ElevateLMS.enroll({
  courseId: 'course_123',
  studentEmail: 'student@elevateforhumanity.org'
});

// Track progress
ElevateLMS.trackProgress({
  courseId: 'course_123',
  lessonId: 'lesson_456',
  completed: true
});

// Render course catalog
ElevateLMS.render('#my-container', {
  type: 'course-catalog',
  theme: 'light',
  columns: 3
});

// Render student dashboard
ElevateLMS.render('#dashboard', {
  type: 'student-dashboard'
});
`.trim(),
    },
  };

  const platformConfig = platformInstructions[platform] || platformInstructions.custom;

  // Generate feature-specific components
  const components = [];

  if (features?.includes('courses') || !features) {
    components.push({
      name: 'Course Catalog',
      embedCode: `<div data-elevate="course-catalog" data-layout="grid" data-columns="3"></div>`,
      description: 'Displays all your courses in a responsive grid',
    });
  }

  if (features?.includes('enrollment') || !features) {
    components.push({
      name: 'Enrollment Button',
      embedCode: `<button data-elevate="enroll" data-course-id="COURSE_ID">Enroll Now</button>`,
      description: 'One-click enrollment with payment processing',
    });
  }

  if (features?.includes('dashboard') || !features) {
    components.push({
      name: 'Student Dashboard',
      embedCode: `<div data-elevate="student-dashboard"></div>`,
      description: 'Shows enrolled courses, progress, certificates',
    });
  }

  if (features?.includes('login') || !features) {
    components.push({
      name: 'Login/Signup',
      embedCode: `<div data-elevate="auth" data-mode="login"></div>`,
      description: 'Student authentication widget',
    });
  }

  if (features?.includes('progress') || !features) {
    components.push({
      name: 'Progress Tracker',
      embedCode: `<div data-elevate="progress" data-course-id="COURSE_ID"></div>`,
      description: 'Visual progress bar for course completion',
    });
  }

  // API endpoints they can use
  const apiEndpoints = [
    {
      method: 'GET',
      endpoint: '/api/v1/courses',
      description: 'List all courses',
      example: `curl -H "Authorization: Bearer ${apiKey}" https://api.elevatelms.com/v1/courses`,
    },
    {
      method: 'POST',
      endpoint: '/api/v1/enrollments',
      description: 'Enroll a student',
      example: `curl -X POST -H "Authorization: Bearer ${apiKey}" -d '{"courseId":"123","email":"student@elevateforhumanity.org"}' https://api.elevatelms.com/v1/enrollments`,
    },
    {
      method: 'GET',
      endpoint: '/api/v1/students/:id/progress',
      description: 'Get student progress',
      example: `curl -H "Authorization: Bearer ${apiKey}" https://api.elevatelms.com/v1/students/123/progress`,
    },
    {
      method: 'POST',
      endpoint: '/api/v1/webhooks',
      description: 'Register webhook for events',
      example: `curl -X POST -H "Authorization: Bearer ${apiKey}" -d '{"url":"https://yoursite.com/webhook","events":["enrollment.created","course.completed"]}' https://api.elevatelms.com/v1/webhooks`,
    },
  ];

  return {
    siteId,
    apiKey,
    platform: platformConfig.name,
    embedScript,
    setupSteps: platformConfig.steps,
    platformSpecific: platformConfig,
    components,
    apiEndpoints,
    dashboardUrl: `https://app.elevatelms.com/sites/${siteId}`,
    docsUrl: 'https://docs.elevatelms.com/integrations',
    webhookEvents: [
      'enrollment.created',
      'enrollment.completed', 
      'course.started',
      'course.completed',
      'lesson.completed',
      'certificate.issued',
      'payment.received',
    ],
  };
}
export const POST = withRuntime(withApiAudit('/api/ai/build-remote', _POST));
