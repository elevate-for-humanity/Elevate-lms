/*
  Copyright (c) 2025 Elevate for Humanity
  Social Media Automation System
  - Facebook Pages (2x)
  - YouTube Channel
  - LinkedIn Company Page + Blog
  - Durable.co Blog Integration
  - 3x Daily Posting Schedule
  - Zapier Webhook Integration
*/

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SocialMediaAutomation {
  constructor() {
    this.config = {
      // Facebook Pages
      facebook: {
        page1: {
          pageId: process.env.FACEBOOK_PAGE_1_ID || '',
          accessToken: process.env.FACEBOOK_PAGE_1_TOKEN || '',
          name: 'Elevate for Humanity - Main',
        },
        page2: {
          pageId: process.env.FACEBOOK_PAGE_2_ID || '',
          accessToken: process.env.FACEBOOK_PAGE_2_TOKEN || '',
          name: 'Elevate for Humanity - Programs',
        },
      },

      // YouTube
      youtube: {
        channelId: process.env.YOUTUBE_CHANNEL_ID || '',
        apiKey: process.env.YOUTUBE_API_KEY || '',
        channelUrl: 'https://www.youtube.com/@elevateforhumanity',
      },

      // LinkedIn
      linkedin: {
        companyId: process.env.LINKEDIN_COMPANY_ID || '',
        accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
        companyUrl: 'https://www.linkedin.com/company/elevateforhumanity',
      },

      // Durable Blog
      durable: {
        apiKey: process.env.DURABLE_API_KEY || '',
        blogUrl: 'https://elevateforhumanity.org/blog',
        apiUrl: 'https://elevateforhumanity.org/api/blog',
      },

      // Zapier Webhooks
      zapier: {
        webhookUrl: process.env.ZAPIER_WEBHOOK_URL || '',
        enabled: !!process.env.ZAPIER_WEBHOOK_URL,
      },

      // Posting Schedule (3x daily)
      schedule: {
        times: ['09:00', '13:00', '17:00'], // 9 AM, 1 PM, 5 PM EST
        timezone: 'America/New_York',
        enabled: true,
      },
    };

    this.contentQueue = [];
    this.postHistory = [];
  }

  // ============================================
  // CONTENT GENERATION
  // ============================================

  generateDailyContent() {
    const contentTypes = [
      'program_highlight',
      'success_story',
      'industry_insight',
      'funding_opportunity',
      'career_tip',
      'certification_spotlight',
    ];

    const content = [];

    // Morning Post (9 AM) - Educational/Inspirational
    content.push({
      time: '09:00',
      type: 'program_highlight',
      platforms: ['facebook_1', 'linkedin', 'youtube_community'],
      content: this.getContentTemplate('program_highlight'),
      media: { type: 'image', url: '/assets/social/program-highlight.jpg' },
    });

    // Afternoon Post (1 PM) - Engagement/Interactive
    content.push({
      time: '13:00',
      type: 'success_story',
      platforms: ['facebook_2', 'linkedin', 'durable_blog'],
      content: this.getContentTemplate('success_story'),
      media: { type: 'video', url: '/assets/social/success-story.mp4' },
    });

    // Evening Post (5 PM) - Call-to-Action
    content.push({
      time: '17:00',
      type: 'funding_opportunity',
      platforms: ['facebook_1', 'facebook_2', 'linkedin'],
      content: this.getContentTemplate('funding_opportunity'),
      media: { type: 'image', url: '/assets/social/funding-cta.jpg' },
    });

    return content;
  }

  getContentTemplate(type) {
    const templates = {
      program_highlight: {
        title: '🎓 Program Spotlight: {program_name}',
        body: 'Transform your career with our {program_name} program!\n\n✅ Industry-recognized certification\n✅ Hands-on training\n✅ Job placement assistance\n✅ Federal funding available\n\nLearn more: {link}',
        hashtags: [
          '#CareerDevelopment',
          '#WorkforceDevelopment',
          '#Certification',
          '#Training',
        ],
        cta: 'Enroll Today',
      },
      success_story: {
        title: '🌟 Success Story: {student_name}',
        body: 'Meet {student_name}, who went from {before} to {after} in just {duration}!\n\n"{testimonial}"\n\nReady to write your success story? {link}',
        hashtags: [
          '#SuccessStory',
          '#CareerChange',
          '#Inspiration',
          '#ElevateForHumanity',
        ],
        cta: 'Start Your Journey',
      },
      industry_insight: {
        title: '📊 Industry Insight: {topic}',
        body: '{insight_text}\n\nKey Takeaways:\n• {point_1}\n• {point_2}\n• {point_3}\n\nRead more: {link}',
        hashtags: ['#IndustryInsights', '#CareerTrends', '#FutureOfWork'],
        cta: 'Learn More',
      },
      funding_opportunity: {
        title: '💰 Funding Available: {program_type}',
        body: 'Did you know? Federal funding is available for {program_type} training!\n\n✅ WIOA eligible\n✅ Workforce Ready Grants\n✅ No upfront costs\n\nCheck your eligibility: {link}',
        hashtags: [
          '#FederalFunding',
          '#WIOA',
          '#FreeTraining',
          '#CareerOpportunity',
        ],
        cta: 'Check Eligibility',
      },
      career_tip: {
        title: '💡 Career Tip: {tip_title}',
        body: '{tip_content}\n\nPro Tip: {pro_tip}\n\nWant more career advice? Follow us for daily tips! {link}',
        hashtags: ['#CareerTips', '#ProfessionalDevelopment', '#CareerAdvice'],
        cta: 'Follow for More',
      },
      certification_spotlight: {
        title: '🏆 Certification Spotlight: {cert_name}',
        body: 'The {cert_name} certification can boost your salary by {salary_increase}!\n\n📈 High demand\n💼 {job_count}+ open positions\n⏱️ Complete in {duration}\n\nGet certified: {link}',
        hashtags: [
          '#Certification',
          '#CareerGrowth',
          '#ProfessionalCertification',
        ],
        cta: 'Get Certified',
      },
    };

    return templates[type] || templates.program_highlight;
  }

  // ============================================
  // FACEBOOK POSTING
  // ============================================

  async postToFacebook(pageConfig, content) {
    if (!pageConfig.accessToken || !pageConfig.pageId) {
      return { status: 'skipped', reason: 'not_configured' };
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${pageConfig.pageId}/feed`;

      const postData = {
        message: this.formatContent(content),
        access_token: pageConfig.accessToken,
      };

      // Add media if present
      if (content.media) {
        if (content.media.type === 'image') {
          postData.link = content.media.url;
        } else if (content.media.type === 'video') {
          // Use video endpoint for videos
          const videoUrl = `https://graph.facebook.com/v18.0/${pageConfig.pageId}/videos`;
          postData.file_url = content.media.url;
        }
      }

      const response = await axios.post(url, postData);

        `✅ Posted to Facebook ${pageConfig.name}: ${response.data.id}`
      );

      return {
        status: 'success',
        platform: 'facebook',
        page: pageConfig.name,
        postId: response.data.id,
        url: `https://facebook.com/${response.data.id}`,
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // ============================================
  // YOUTUBE POSTING (Community Tab)
  // ============================================

  async postToYouTube(content) {
    if (!this.config.youtube.apiKey) {
      return { status: 'skipped', reason: 'not_configured' };
    }

    try {
      // YouTube Community Posts API
      const url = 'https://www.googleapis.com/youtube/v3/communityPosts';

      const postData = {
        snippet: {
          textMessageDetails: {
            messageText: this.formatContent(content, 'youtube'),
          },
        },
      };

      const response = await axios.post(url, postData, {
        headers: {
          Authorization: `Bearer ${this.config.youtube.apiKey}`,
          'Content-Type': 'application/json',
        },
      });


      return {
        status: 'success',
        platform: 'youtube',
        postId: response.data.id,
        url: `${this.config.youtube.channelUrl}/community`,
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // ============================================
  // LINKEDIN POSTING
  // ============================================

  async postToLinkedIn(content) {
    if (!this.config.linkedin.accessToken) {
      return { status: 'skipped', reason: 'not_configured' };
    }

    try {
      const url = 'https://api.linkedin.com/v2/ugcPosts';

      const postData = {
        author: `urn:li:organization:${this.config.linkedin.companyId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: this.formatContent(content, 'linkedin'),
            },
            shareMediaCategory: content.media ? 'IMAGE' : 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      // Add media if present
      if (content.media && content.media.type === 'image') {
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            originalUrl: content.media.url,
          },
        ];
      }

      const response = await axios.post(url, postData, {
        headers: {
          Authorization: `Bearer ${this.config.linkedin.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });


      return {
        status: 'success',
        platform: 'linkedin',
        postId: response.data.id,
        url: `${this.config.linkedin.companyUrl}/posts/${response.data.id}`,
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // ============================================
  // DURABLE BLOG POSTING
  // ============================================

  async postToDurableBlog(content) {
    if (!this.config.durable.apiKey) {
      return { status: 'skipped', reason: 'not_configured' };
    }

    try {
      const url = `${this.config.durable.apiUrl}/posts`;

      const blogPost = {
        title: content.content.title,
        body: this.formatContent(content, 'blog'),
        status: 'published',
        tags: content.content.hashtags.map((h) => h.replace('#', '')),
        featured_image: content.media?.url || null,
      };

      const response = await axios.post(url, blogPost, {
        headers: {
          Authorization: `Bearer ${this.config.durable.apiKey}`,
          'Content-Type': 'application/json',
        },
      });


      return {
        status: 'success',
        platform: 'durable_blog',
        postId: response.data.id,
        url: `${this.config.durable.blogUrl}/${response.data.slug}`,
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // ============================================
  // ZAPIER WEBHOOK INTEGRATION
  // ============================================

  async triggerZapierWebhook(content, results) {
    if (!this.config.zapier.enabled) {
      return { status: 'skipped', reason: 'not_configured' };
    }

    try {
      const webhookData = {
        timestamp: new Date().toISOString(),
        content_type: content.type,
        platforms: content.platforms,
        results: results,
        content: {
          title: content.content.title,
          body: content.content.body.substring(0, 200),
          hashtags: content.content.hashtags,
        },
      };

      const response = await axios.post(
        this.config.zapier.webhookUrl,
        webhookData
      );


      return { status: 'success', response: response.data };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  // ============================================
  // CONTENT FORMATTING
  // ============================================

  formatContent(content, platform = 'default') {
    const template = content.content;
    let formatted = `${template.title}\n\n${template.body}`;

    // Add hashtags based on platform
    if (platform === 'linkedin' || platform === 'facebook') {
      formatted += `\n\n${template.hashtags.join(' ')}`;
    } else if (platform === 'youtube') {
      // YouTube has character limits
      formatted = formatted.substring(0, 5000);
    } else if (platform === 'blog') {
      // Blog format - more detailed
      formatted = `<h1>${template.title}</h1>\n\n${template.body}\n\n<p><strong>Tags:</strong> ${template.hashtags.join(', ')}</p>`;
    }

    // Add CTA
    formatted += `\n\n${template.cta} 👉 https://elevateforhumanity.org`;

    return formatted;
  }

  // ============================================
  // AUTOMATED POSTING
  // ============================================

  async executeScheduledPost(content) {

    const results = {};

    // Post to each platform
    for (const platform of content.platforms) {
      if (platform === 'facebook_1') {
        results.facebook_1 = await this.postToFacebook(
          this.config.facebook.page1,
          content
        );
      } else if (platform === 'facebook_2') {
        results.facebook_2 = await this.postToFacebook(
          this.config.facebook.page2,
          content
        );
      } else if (platform === 'youtube_community') {
        results.youtube = await this.postToYouTube(content);
      } else if (platform === 'linkedin') {
        results.linkedin = await this.postToLinkedIn(content);
      } else if (platform === 'durable_blog') {
        results.durable_blog = await this.postToDurableBlog(content);
      }

      // Wait 2 seconds between posts to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Trigger Zapier webhook with results
    if (this.config.zapier.enabled) {
      await this.triggerZapierWebhook(content, results);
    }

    // Save to history
    this.postHistory.push({
      timestamp: new Date().toISOString(),
      content: content,
      results: results,
    });

    this.savePostHistory();

    return results;
  }

  // ============================================
  // REPORTING
  // ============================================

  generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const todayPosts = this.postHistory.filter((p) =>
      p.timestamp.startsWith(today)
    );

    const report = {
      date: today,
      total_posts: todayPosts.length,
      platforms: {
        facebook_1: todayPosts.filter(
          (p) => p.results.facebook_1?.status === 'success'
        ).length,
        facebook_2: todayPosts.filter(
          (p) => p.results.facebook_2?.status === 'success'
        ).length,
        youtube: todayPosts.filter(
          (p) => p.results.youtube?.status === 'success'
        ).length,
        linkedin: todayPosts.filter(
          (p) => p.results.linkedin?.status === 'success'
        ).length,
        durable_blog: todayPosts.filter(
          (p) => p.results.durable_blog?.status === 'success'
        ).length,
      },
      success_rate:
        (
          (todayPosts.filter((p) =>
            Object.values(p.results).some((r) => r.status === 'success')
          ).length /
            todayPosts.length) *
          100
        ).toFixed(2) + '%',
      posts: todayPosts,
    };

    return report;
  }

  savePostHistory() {
    const historyPath = path.join(
      __dirname,
      '../.autopilot_out/social-media-history.json'
    );
    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    fs.writeFileSync(historyPath, JSON.stringify(this.postHistory, null, 2));
  }

  // ============================================
  // SCHEDULER
  // ============================================

  startScheduler() {
      `   Schedule: ${this.config.schedule.times.join(', ')} ${this.config.schedule.timezone}`
    );
      `   Zapier: ${this.config.zapier.enabled ? 'Enabled' : 'Disabled'}\n`
    );

    // Generate daily content
    const dailyContent = this.generateDailyContent();

    // Schedule posts
    dailyContent.forEach((content) => {
      const [hour, minute] = content.time.split(':');
      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        parseInt(hour),
        parseInt(minute)
      );

      if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const delay = scheduledTime.getTime() - now.getTime();

      setTimeout(() => {
        this.executeScheduledPost(content);
      }, delay);

        `⏰ Scheduled ${content.type} for ${scheduledTime.toLocaleString()}`
      );
    });
  }
}

// ============================================
// CLI INTERFACE
// ============================================

if (require.main === module) {
  const automation = new SocialMediaAutomation();

  const command = process.argv[2];

  if (command === 'start') {
    automation.startScheduler();
  } else if (command === 'test') {
    const testContent = automation.generateDailyContent()[0];
    automation.executeScheduledPost(testContent).then((results) => {
    });
  } else if (command === 'report') {
    const report = automation.generateDailyReport();
  } else {
Social Media Automation System
==============================

Usage:
  node scripts/social-media-automation.js [command]

Commands:
  start   - Start the automated posting scheduler (3x daily)
  test    - Test posting to all platforms
  report  - Generate daily posting report

Configuration:
  Set environment variables in .env file:
  - FACEBOOK_PAGE_1_ID, FACEBOOK_PAGE_1_TOKEN
  - FACEBOOK_PAGE_2_ID, FACEBOOK_PAGE_2_TOKEN
  - YOUTUBE_CHANNEL_ID, YOUTUBE_API_KEY
  - LINKEDIN_COMPANY_ID, LINKEDIN_ACCESS_TOKEN
  - DURABLE_API_KEY
  - ZAPIER_WEBHOOK_URL
    `);
  }
}

module.exports = SocialMediaAutomation;
