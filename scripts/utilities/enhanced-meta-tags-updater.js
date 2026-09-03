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

const fs = require('fs');

// Enhanced Meta Tags for All Pages
const siteConfig = {
  domain: 'https://elevateforhumanity.org',
  siteName: 'Elevate for Humanity',
  defaultImage: '/images/Social_media_open_graph_2ded65c5.png',
  googleVerification: 'EFH-workforce-development-2025',
  bingVerification: 'YOUR_BING_VERIFICATION_CODE',
  gaId: 'GA_MEASUREMENT_ID',
};

const pageConfigs = {
  'index.html': {
    title: 'Launch Your AI & Data Science Career | Elevate for Humanity',
    description:
      'Transform your career with federally-funded AI and Data Science training. WIOA-approved programs, 89% job placement rate, and employer partnerships. Start your tech career today.',
    keywords:
      'AI training, data science bootcamp, workforce development, WIOA funding, career training, federal grants, job placement, python programming, machine learning certification',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Elevate for Humanity',
      description:
        'Federally-funded AI and Data Science training programs with 89% job placement rate',
    },
  },
  'programs.html': {
    title: 'AI Courses & Data Science Programs | Best Online Bootcamp 2024',
    description:
      'Explore top-rated AI courses and data science programs. Python programming, machine learning certification, data analysis training with job guarantee.',
    keywords:
      'AI courses, data science programs, python programming course, machine learning certification, data analysis training, online bootcamp, coding courses, programming bootcamp',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'AI & Data Science Training Programs',
    },
  },
  'hub.html': {
    title: 'Workforce Development Hub | Federal Training Programs',
    description:
      'Access federal workforce development resources, WIOA funding information, and career advancement tools. Connect with employers and training partners.',
    keywords:
      'workforce development, federal training programs, WIOA resources, career advancement, employer partnerships, job training hub',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Workforce Development Hub',
    },
  },
  'pay.html': {
    title: 'Enroll Now | Federally-Funded Training Programs',
    description:
      'Start your AI or Data Science career today. Check funding eligibility, apply for WIOA grants, and enroll in certification programs with job placement guarantee.',
    keywords:
      'enroll AI training, data science enrollment, WIOA application, federal funding eligibility, career training enrollment, job placement program',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Career Training Enrollment',
    },
  },
};

function generateMetaTags(config, pageConfig) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Primary Meta Tags -->
    <title>${pageConfig.title}</title>
    <meta name="title" content="${pageConfig.title}">
    <meta name="description" content="${pageConfig.description}">
    <meta name="keywords" content="${pageConfig.keywords}">
    <meta name="author" content="${config.siteName}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="googlebot" content="index, follow">

    <!-- Canonical URL -->
    <link rel="canonical" href="${config.domain}${pageConfig.canonical || ''}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${config.domain}">
    <meta property="og:title" content="${pageConfig.title}">
    <meta property="og:description" content="${pageConfig.description}">
    <meta property="og:image" content="${config.domain}${config.defaultImage}">
    <meta property="og:site_name" content="${config.siteName}">
    <meta property="og:locale" content="en_US">

    <!-- Twitter Card -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${config.domain}">
    <meta property="twitter:title" content="${pageConfig.title}">
    <meta property="twitter:description" content="${pageConfig.description}">
    <meta property="twitter:image" content="${config.domain}${config.defaultImage}">

    <!-- Verification Tags -->
    <meta name="google-site-verification" content="${config.googleVerification}">
    <meta name="msvalidate.01" content="${config.bingVerification}">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/images/Elevate_for_Humanity_logo_81bf0fab.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/images/Elevate_for_Humanity_logo_81bf0fab.png">

    <!-- Security Headers -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta name="referrer" content="strict-origin-when-cross-origin">

    <!-- Google Analytics 4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${config.gaId}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${config.gaId}', {
            page_title: '${pageConfig.title}',
            page_location: window.location.href
        });
    </script>

    <!-- Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(pageConfig.structuredData, null, 2)}
    </script>

    <!-- Preconnect for performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://www.googletagmanager.com">

    <script src="https://cdn.tailwindcss.com"></script>`;
}

// Update meta tags for all configured pages
Object.entries(pageConfigs).forEach(([filename, pageConfig]) => {
  try {
    const content = fs.readFileSync(filename, 'utf8');

    // Find the closing </head> tag and insert before it
    const headCloseIndex = content.indexOf('</head>');
    if (headCloseIndex !== -1) {
      // Extract existing body content
      const bodyStart = content.indexOf('<body');
      const bodyContent = content.substring(bodyStart);

      // Generate new head with enhanced meta tags
      const newHead = generateMetaTags(siteConfig, pageConfig);
      const newContent = newHead + '\n</head>\n' + bodyContent;

      fs.writeFileSync(filename, newContent);
    }
  } catch (error) {
  }
});

  '2. Replace YOUR_BING_VERIFICATION_CODE with Bing verification code'
);
