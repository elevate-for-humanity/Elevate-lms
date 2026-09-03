/**
 * Puppeteer Script: Analyze Marketing Site & Generate Durable Setup Instructions
 *
 * This script:
 * 1. Crawls www.elevateforhumanity.org
 * 2. Analyzes current SEO setup
 * 3. Checks for social media integrations
 * 4. Generates step-by-step Durable configuration instructions
 * 5. Creates Canva animation recommendations
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const MARKETING_SITE = 'https://elevateforhumanity.org';
const OUTPUT_DIR = './analysis';

async function analyzeSite() {

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set viewport for consistent screenshots
  await page.setViewport({ width: 1920, height: 1080 });

  const analysis = {
    timestamp: new Date().toISOString(),
    url: MARKETING_SITE,
    seo: {},
    socialMedia: {},
    pages: [],
    recommendations: [],
    durableInstructions: [],
    canvaAnimations: [],
  };

  try {
    await page.goto(MARKETING_SITE, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // ============================================
    // 1. ANALYZE SEO SETUP
    // ============================================

    analysis.seo = await page.evaluate(() => {
      const getMetaContent = (name) => {
        const meta = document.querySelector(
          `meta[name="${name}"], meta[property="${name}"]`
        );
        return meta ? meta.getAttribute('content') : null;
      };

      return {
        title: document.title,
        description: getMetaContent('description'),
        keywords: getMetaContent('keywords'),
        ogTitle: getMetaContent('og:title'),
        ogDescription: getMetaContent('og:description'),
        ogImage: getMetaContent('og:image'),
        twitterCard: getMetaContent('twitter:card'),
        twitterImage: getMetaContent('twitter:image'),
        googleVerification: getMetaContent('google-site-verification'),
        bingVerification: getMetaContent('msvalidate.01'),
        hasStructuredData: !!document.querySelector(
          'script[type="application/ld+json"]'
        ),
        h1Tags: Array.from(document.querySelectorAll('h1')).map((h) =>
          h.textContent.trim()
        ),
        h2Tags: Array.from(document.querySelectorAll('h2'))
          .map((h) => h.textContent.trim())
          .slice(0, 5),
        images: Array.from(document.querySelectorAll('img'))
          .map((img) => ({
            src: img.src,
            alt: img.alt || 'MISSING ALT TEXT',
            hasAlt: !!img.alt,
          }))
          .slice(0, 10),
      };
    });

    // Check for sitemap
    try {
      const sitemapResponse = await page.goto(`${MARKETING_SITE}/sitemap.xml`, {
        waitUntil: 'networkidle2',
      });
      analysis.seo.hasSitemap = sitemapResponse.status() === 200;
    } catch (e) {
      analysis.seo.hasSitemap = false;
    }

    // Check for robots.txt
    try {
      const robotsResponse = await page.goto(`${MARKETING_SITE}/robots.txt`, {
        waitUntil: 'networkidle2',
      });
      analysis.seo.hasRobotsTxt = robotsResponse.status() === 200;
    } catch (e) {
      analysis.seo.hasRobotsTxt = false;
    }

    // Go back to homepage
    await page.goto(MARKETING_SITE, { waitUntil: 'networkidle2' });

    // ============================================
    // 2. DETECT SOCIAL MEDIA LINKS
    // ============================================

    analysis.socialMedia = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const socialPlatforms = {
        facebook: links.find((a) => a.href.includes('facebook.com')),
        twitter: links.find(
          (a) => a.href.includes('twitter.com') || a.href.includes('x.com')
        ),
        linkedin: links.find((a) => a.href.includes('linkedin.com')),
        instagram: links.find((a) => a.href.includes('instagram.com')),
        youtube: links.find((a) => a.href.includes('youtube.com')),
        tiktok: links.find((a) => a.href.includes('tiktok.com')),
      };

      return Object.entries(socialPlatforms).reduce((acc, [platform, link]) => {
        acc[platform] = link
          ? {
              url: link.href,
              text: link.textContent.trim(),
              hasIcon: link.querySelector('svg, img, i') !== null,
            }
          : null;
        return acc;
      }, {});
    });

    // ============================================
    // 3. DISCOVER PAGES
    // ============================================

    const discoveredLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links
        .map((a) => a.href)
        .filter((href) => href.startsWith(window.location.origin))
        .filter((href) => !href.includes('#'))
        .filter((href, index, self) => self.indexOf(href) === index)
        .slice(0, 20); // Limit to 20 pages
    });

    analysis.pages = discoveredLinks;

    // ============================================
    // 4. CHECK FOR ANALYTICS
    // ============================================

    analysis.analytics = await page.evaluate(() => {
      return {
        hasGoogleAnalytics: !!window.gtag || !!window.ga || !!window.dataLayer,
        hasGoogleTagManager: !!window.google_tag_manager,
        hasFacebookPixel: !!window.fbq,
        hasHotjar: !!window.hj,
        analyticsScripts: Array.from(document.querySelectorAll('script[src]'))
          .map((s) => s.src)
          .filter(
            (src) =>
              src.includes('analytics') ||
              src.includes('gtag') ||
              src.includes('gtm') ||
              src.includes('facebook') ||
              src.includes('hotjar')
          ),
      };
    });

    // ============================================
    // 5. TAKE SCREENSHOT
    // ============================================
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'homepage-screenshot.png'),
      fullPage: true,
    });

    // ============================================
    // 6. GENERATE RECOMMENDATIONS
    // ============================================

    // SEO Recommendations
    if (!analysis.seo.hasSitemap) {
      analysis.recommendations.push({
        priority: 'HIGH',
        category: 'SEO',
        issue: 'Missing sitemap.xml',
        action: 'Create and upload sitemap.xml to root directory',
      });
    }

    if (!analysis.seo.hasRobotsTxt) {
      analysis.recommendations.push({
        priority: 'MEDIUM',
        category: 'SEO',
        issue: 'Missing robots.txt',
        action: 'Create and upload robots.txt to root directory',
      });
    }

    if (!analysis.seo.description) {
      analysis.recommendations.push({
        priority: 'HIGH',
        category: 'SEO',
        issue: 'Missing meta description',
        action: 'Add meta description to all pages',
      });
    }

    if (!analysis.seo.ogImage) {
      analysis.recommendations.push({
        priority: 'HIGH',
        category: 'Social Media',
        issue: 'Missing Open Graph image',
        action: 'Create and add og:image (1200x630px)',
      });
    }

    if (!analysis.seo.bingVerification) {
      analysis.recommendations.push({
        priority: 'MEDIUM',
        category: 'SEO',
        issue: 'Bing not verified',
        action: 'Add Bing Webmaster verification code',
      });
    }

    if (!analysis.analytics.hasGoogleAnalytics) {
      analysis.recommendations.push({
        priority: 'HIGH',
        category: 'Analytics',
        issue: 'Google Analytics not detected',
        action: 'Add Google Analytics tracking code',
      });
    }

    const imagesWithoutAlt = analysis.seo.images.filter((img) => !img.hasAlt);
    if (imagesWithoutAlt.length > 0) {
      analysis.recommendations.push({
        priority: 'MEDIUM',
        category: 'Accessibility',
        issue: `${imagesWithoutAlt.length} images missing alt text`,
        action: 'Add descriptive alt text to all images',
      });
    }

    // ============================================
    // 7. GENERATE DURABLE SETUP INSTRUCTIONS
    // ============================================

    analysis.durableInstructions = [
      {
        step: 1,
        title: 'Access Durable Dashboard',
        instructions: [
          'Log in to Durable Technologies at https://durable.co/',
          'Navigate to your site: www.elevateforhumanity.org',
          'Go to Settings or Site Configuration',
        ],
      },
      {
        step: 2,
        title: 'Configure SEO Settings',
        instructions: [
          'Go to Settings → SEO',
          'Add Site Title: "Elevate for Humanity | Workforce Training & Career Development"',
          'Add Meta Description: "Career & Technical training that elevates communities. FREE workforce development programs through WIOA funding in Indianapolis, Indiana."',
          'Add Keywords: "workforce training, career development, WIOA, job training, Indianapolis"',
        ],
      },
      {
        step: 3,
        title: 'Add Google Analytics',
        instructions: [
          'Go to Settings → Integrations or Analytics',
          'Find "Google Analytics" section',
          'Enter Measurement ID: G-XXXXXXXXXX (get from analytics.google.com)',
          'Save changes',
          'Verify tracking in Google Analytics Realtime report',
        ],
      },
      {
        step: 4,
        title: 'Add Bing Verification',
        instructions: [
          'Go to Settings → SEO or Custom Code',
          'Find "Header Code" or "Custom Meta Tags" section',
          'Add: <meta name="msvalidate.01" content="YOUR_BING_CODE">',
          'Get code from bing.com/webmasters',
          'Save and verify in Bing Webmaster Tools',
        ],
      },
      {
        step: 5,
        title: 'Upload Sitemap & Robots.txt',
        instructions: [
          'Check if Durable auto-generates sitemap (visit /sitemap.xml)',
          'If not, go to Settings → Files or File Manager',
          'Upload sitemap.xml (use template from MARKETING_SITE_SEO_GUIDE.md)',
          'Upload robots.txt',
          'Verify files are accessible',
        ],
      },
      {
        step: 6,
        title: 'Connect Social Media Accounts',
        instructions: [
          'Go to Settings → Social Media or Integrations',
          'Add Facebook page URL',
          'Add LinkedIn company URL',
          'Add Twitter/X profile URL',
          'Add Instagram profile URL',
          'Enable social sharing buttons on pages',
        ],
      },
      {
        step: 7,
        title: 'Add Social Media Icons',
        instructions: [
          'Go to Design → Header or Footer',
          'Add social media icon widget',
          'Link icons to your social profiles',
          'Style icons to match brand colors (#2563EB)',
          'Test all links work correctly',
        ],
      },
      {
        step: 8,
        title: 'Configure Open Graph Images',
        instructions: [
          'Create image in Canva (1200x630px)',
          'Upload to Durable Media Library',
          'Go to Settings → SEO → Social Sharing',
          'Set default Open Graph image',
          'Set Twitter Card image (1200x600px)',
          'Test with Facebook Sharing Debugger',
        ],
      },
      {
        step: 9,
        title: 'Add Structured Data',
        instructions: [
          'Go to Settings → Custom Code or Advanced',
          'Find "Footer Code" or "Before </body>" section',
          'Add Organization schema (JSON-LD)',
          'Copy code from MARKETING_SITE_SEO_GUIDE.md',
          'Save and test with Google Rich Results Test',
        ],
      },
      {
        step: 10,
        title: 'Link to LMS Platform',
        instructions: [
          'Go to Pages → Homepage',
          'Add CTA button: "Enroll Now"',
          'Link to: https://elevateforhumanity.org/signup',
          'Add "Student Login" button',
          'Link to: https://elevateforhumanity.org/login',
          'Add to navigation menu: "Student Portal"',
        ],
      },
    ];

    // ============================================
    // 8. GENERATE CANVA ANIMATION RECOMMENDATIONS
    // ============================================

    analysis.canvaAnimations = [
      {
        type: 'Social Media Post - Facebook/LinkedIn',
        dimensions: '1080x1080px (Square)',
        purpose: 'Promote workforce training programs',
        elements: [
          'Elevate for Humanity logo (top)',
          'Bold headline: "FREE Workforce Training"',
          'Subtext: "WIOA Funded Programs"',
          'List 3-4 programs (HVAC, CNA, Barber, etc.)',
          'CTA: "Apply Today" with website URL',
          'Brand colors: #2563EB (blue), white, accent colors',
        ],
        animation: [
          'Fade in logo (0-0.5s)',
          'Slide in headline from left (0.5-1s)',
          'Pop in program icons one by one (1-2.5s)',
          'Pulse CTA button (2.5-3s)',
          'Hold final frame (3-5s)',
        ],
        canvaTemplate: 'Search: "Education Promo" or "Training Program"',
        exportSettings: 'MP4 video, 5 seconds, 1080x1080px',
      },
      {
        type: 'Instagram Story/Reel',
        dimensions: '1080x1920px (Vertical)',
        purpose: 'Quick program highlights',
        elements: [
          'Full-screen background (gradient or photo)',
          'Logo watermark (top corner)',
          'Large text: Program name',
          'Key benefits (3 bullet points)',
          'Swipe up CTA or link sticker',
          'Duration indicator dots',
        ],
        animation: [
          'Zoom in background (0-1s)',
          'Fade in program name (1-1.5s)',
          'Slide in benefits one by one (1.5-3s)',
          'Bounce CTA (3-3.5s)',
          'Hold (3.5-5s)',
        ],
        canvaTemplate: 'Search: "Instagram Story Education"',
        exportSettings: 'MP4 video, 5-15 seconds, 1080x1920px',
      },
      {
        type: 'Twitter/X Post',
        dimensions: '1200x675px (Landscape)',
        purpose: 'Program announcements',
        elements: [
          'Eye-catching background',
          'Logo (corner)',
          'Headline: "Now Enrolling"',
          'Program name and brief description',
          'Enrollment deadline',
          'Website URL',
        ],
        animation: [
          'Fade in background (0-0.5s)',
          'Slide in headline (0.5-1s)',
          'Typewriter effect for program name (1-2s)',
          'Fade in details (2-2.5s)',
          'Pulse URL (2.5-3s)',
        ],
        canvaTemplate: 'Search: "Twitter Post Education"',
        exportSettings: 'MP4 video, 3-5 seconds, 1200x675px',
      },
      {
        type: 'YouTube Intro/Outro',
        dimensions: '1920x1080px (HD)',
        purpose: 'Video content branding',
        elements: [
          'Animated logo reveal',
          'Tagline: "Elevating Communities Through Education"',
          'Subscribe button animation',
          'Social media icons',
          'Website URL',
        ],
        animation: [
          'Logo builds from pieces (0-1.5s)',
          'Glow effect on logo (1.5-2s)',
          'Tagline fades in (2-2.5s)',
          'Icons slide in from sides (2.5-3s)',
          'All elements pulse (3-5s)',
        ],
        canvaTemplate: 'Search: "YouTube Intro Education"',
        exportSettings: 'MP4 video, 5 seconds, 1920x1080px, 30fps',
      },
      {
        type: 'Website Hero Banner',
        dimensions: '1920x600px (Wide)',
        purpose: 'Homepage animated banner',
        elements: [
          'Background: Students in training (photo or video)',
          'Overlay gradient (dark to transparent)',
          'Large headline: "Transform Your Career"',
          'Subheadline: "Free Training Programs"',
          'CTA button: "Explore Programs"',
          'Trust indicators: "WIOA Approved" badge',
        ],
        animation: [
          'Ken Burns effect on background (slow zoom)',
          'Fade in headline from bottom (0-1s)',
          'Fade in subheadline (1-1.5s)',
          'Slide in CTA button (1.5-2s)',
          'Continuous subtle movement',
        ],
        canvaTemplate: 'Search: "Website Banner Education"',
        exportSettings: 'MP4 video, 10-15 seconds loop, 1920x600px',
      },
      {
        type: 'Email Header Animation',
        dimensions: '600x200px',
        purpose: 'Newsletter header',
        elements: [
          'Logo',
          'Newsletter title: "Elevate Updates"',
          'Month/Year',
          'Decorative elements (lines, shapes)',
        ],
        animation: [
          'Logo fades in (0-0.5s)',
          'Title slides in (0.5-1s)',
          'Decorative elements draw in (1-1.5s)',
          'Subtle pulse (continuous)',
        ],
        canvaTemplate: 'Search: "Email Header"',
        exportSettings: 'GIF or MP4, 2-3 seconds, 600x200px',
      },
      {
        type: 'Success Story Highlight',
        dimensions: '1080x1080px (Square)',
        purpose: 'Graduate testimonials',
        elements: [
          'Graduate photo (circular frame)',
          'Quote bubble with testimonial',
          'Name and program completed',
          'Before/After stats (if applicable)',
          'Logo watermark',
          'CTA: "Read More Stories"',
        ],
        animation: [
          'Photo zooms in and settles (0-1s)',
          'Quote bubble pops in (1-1.5s)',
          'Text types out (1.5-3s)',
          'Stats count up (3-4s)',
          'CTA pulses (4-5s)',
        ],
        canvaTemplate: 'Search: "Testimonial Post"',
        exportSettings: 'MP4 video, 5 seconds, 1080x1080px',
      },
    ];

    // ============================================
    // 9. SAVE ANALYSIS REPORT
    // ============================================

    const reportPath = path.join(OUTPUT_DIR, 'marketing-site-analysis.json');
    await fs.writeFile(reportPath, JSON.stringify(analysis, null, 2));

    // Generate Markdown Report
    const markdownReport = generateMarkdownReport(analysis);
    const mdPath = path.join(OUTPUT_DIR, 'DURABLE_SETUP_INSTRUCTIONS.md');
    await fs.writeFile(mdPath, markdownReport);

      `📸 Screenshot: ${path.join(OUTPUT_DIR, 'homepage-screenshot.png')}`
    );
  } catch (error) {
    analysis.error = error.message;
  } finally {
    await browser.close();
  }

  return analysis;
}

function generateMarkdownReport(analysis) {
  let md = `# Marketing Site Analysis & Durable Setup Instructions
## ${analysis.url}
**Generated**: ${new Date(analysis.timestamp).toLocaleString()}

---

## 📊 Current SEO Status

### Meta Tags
- **Title**: ${analysis.seo.title || '❌ Missing'}
- **Description**: ${analysis.seo.description || '❌ Missing'}
- **Keywords**: ${analysis.seo.keywords || '❌ Missing'}

### Open Graph (Social Sharing)
- **OG Title**: ${analysis.seo.ogTitle || '❌ Missing'}
- **OG Description**: ${analysis.seo.ogDescription || '❌ Missing'}
- **OG Image**: ${analysis.seo.ogImage || '❌ Missing'}

### Twitter Cards
- **Card Type**: ${analysis.seo.twitterCard || '❌ Missing'}
- **Twitter Image**: ${analysis.seo.twitterImage || '❌ Missing'}

### Technical SEO
- **Sitemap**: ${analysis.seo.hasSitemap ? '✅ Found' : '❌ Missing'}
- **Robots.txt**: ${analysis.seo.hasRobotsTxt ? '✅ Found' : '❌ Missing'}
- **Structured Data**: ${analysis.seo.hasStructuredData ? '✅ Found' : '❌ Missing'}
- **Google Verification**: ${analysis.seo.googleVerification ? '✅ Verified' : '❌ Not verified'}
- **Bing Verification**: ${analysis.seo.bingVerification ? '✅ Verified' : '❌ Not verified'}

### Analytics
- **Google Analytics**: ${analysis.analytics.hasGoogleAnalytics ? '✅ Installed' : '❌ Not found'}
- **Google Tag Manager**: ${analysis.analytics.hasGoogleTagManager ? '✅ Installed' : '❌ Not found'}
- **Facebook Pixel**: ${analysis.analytics.hasFacebookPixel ? '✅ Installed' : '❌ Not found'}

---

## 🔗 Social Media Integration

`;

  Object.entries(analysis.socialMedia).forEach(([platform, data]) => {
    if (data) {
      md += `- **${platform.charAt(0).toUpperCase() + platform.slice(1)}**: ✅ Connected (${data.url})\n`;
    } else {
      md += `- **${platform.charAt(0).toUpperCase() + platform.slice(1)}**: ❌ Not connected\n`;
    }
  });

  md += `\n---\n\n## ⚠️ Recommendations (${analysis.recommendations.length} issues found)\n\n`;

  analysis.recommendations.forEach((rec, i) => {
    md += `### ${i + 1}. [${rec.priority}] ${rec.issue}\n`;
    md += `**Category**: ${rec.category}\n`;
    md += `**Action**: ${rec.action}\n\n`;
  });

  md += `---\n\n## 📋 Durable Setup Instructions\n\n`;

  analysis.durableInstructions.forEach((instruction) => {
    md += `### Step ${instruction.step}: ${instruction.title}\n\n`;
    instruction.instructions.forEach((inst) => {
      md += `- ${inst}\n`;
    });
    md += `\n`;
  });

  md += `---\n\n## 🎨 Canva Animation Templates\n\n`;

  analysis.canvaAnimations.forEach((anim, i) => {
    md += `### ${i + 1}. ${anim.type}\n\n`;
    md += `**Dimensions**: ${anim.dimensions}\n`;
    md += `**Purpose**: ${anim.purpose}\n\n`;
    md += `**Elements to Include**:\n`;
    anim.elements.forEach((el) => (md += `- ${el}\n`));
    md += `\n**Animation Sequence**:\n`;
    anim.animation.forEach((step) => (md += `- ${step}\n`));
    md += `\n**Canva Template**: ${anim.canvaTemplate}\n`;
    md += `**Export Settings**: ${anim.exportSettings}\n\n`;
    md += `---\n\n`;
  });

  md += `## 📸 Screenshots\n\n`;
  md += `Homepage screenshot saved to: \`analysis/homepage-screenshot.png\`\n\n`;

  md += `## 🔗 Useful Links\n\n`;
  md += `- [Google Analytics](https://analytics.google.com/)\n`;
  md += `- [Google Search Console](https://search.google.com/search-console)\n`;
  md += `- [Bing Webmaster Tools](https://www.bing.com/webmasters)\n`;
  md += `- [Canva](https://www.canva.com/)\n`;
  md += `- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)\n`;
  md += `- [Twitter Card Validator](https://cards-dev.twitter.com/validator)\n`;
  md += `- [Google Rich Results Test](https://search.google.com/test/rich-results)\n\n`;

  return md;
}

// Run the analysis
analyzeSite().catch(console.error);
