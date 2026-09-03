/**
 * Universal Navigation System for Elevate for Humanity
 * Provides consistent header and footer across all pages
 */

(function () {
  'use strict';

  // Configuration
  const config = {
    siteName: 'Elevate for Humanity',
    logo: '🎓',
    phone: '+1-317-314-3757',
    email: 'elevateforhumanity@gmail.com',
    socialMedia: {
      facebook: 'https://www.facebook.com/elevateforhumanity',
      linkedin: 'https://www.linkedin.com/company/elevate-for-humanity',
      youtube: 'https://www.youtube.com/@elevateforhumanity',
      instagram: 'https://www.instagram.com/elevateforhumanity',
    },
  };

  // Navigation links
  const navLinks = [
    { text: 'Home', href: '/' },
    { text: 'Programs', href: '/programs' },
    { text: 'Apply', href: '/apply' },
    { text: 'Employers', href: '/employers' },
    { text: 'Partners', href: '/pages/partner-onboarding.html' },
    { text: 'About', href: '/about' },
  ];

  // Create universal header
  function createHeader() {
    const header = document.createElement('header');
    header.style.cssText = `
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    `;

    // Logo
    const logo = document.createElement('a');
    logo.href = '/';
    logo.style.cssText = `
      font-size: 1.5rem;
      font-weight: 700;
      color: #2563eb;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
    logo.innerHTML = `${config.logo} <span>${config.siteName}</span>`;

    // Navigation
    const nav = document.createElement('nav');
    nav.style.cssText = `
      display: flex;
      gap: 2rem;
      align-items: center;
    `;

    const navList = document.createElement('ul');
    navList.style.cssText = `
      display: flex;
      gap: 2rem;
      list-style: none;
      margin: 0;
      padding: 0;
    `;

    navLinks.forEach((link) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      a.style.cssText = `
        color: #1f2937;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.3s;
      `;
      a.addEventListener('mouseenter', () => (a.style.color = '#2563eb'));
      a.addEventListener('mouseleave', () => (a.style.color = '#1f2937'));
      li.appendChild(a);
      navList.appendChild(li);
    });

    nav.appendChild(navList);

    // Mobile menu toggle (simplified)
    const mobileToggle = document.createElement('button');
    mobileToggle.innerHTML = '☰';
    mobileToggle.style.cssText = `
      display: none;
      font-size: 1.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #1f2937;
    `;

    // Responsive behavior
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    function handleMobile(e) {
      if (e.matches) {
        navList.style.display = 'none';
        mobileToggle.style.display = 'block';
      } else {
        navList.style.display = 'flex';
        mobileToggle.style.display = 'none';
      }
    }
    mediaQuery.addListener(handleMobile);
    handleMobile(mediaQuery);

    mobileToggle.addEventListener('click', () => {
      if (navList.style.display === 'none') {
        navList.style.display = 'flex';
        navList.style.flexDirection = 'column';
        navList.style.position = 'absolute';
        navList.style.top = '100%';
        navList.style.left = '0';
        navList.style.right = '0';
        navList.style.background = 'white';
        navList.style.padding = '1rem';
        navList.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      } else {
        navList.style.display = 'none';
      }
    });

    container.appendChild(logo);
    container.appendChild(nav);
    container.appendChild(mobileToggle);
    header.appendChild(container);

    return header;
  }

  // Create universal footer
  function createFooter() {
    const footer = document.createElement('footer');
    footer.style.cssText = `
      background: #1f2937;
      color: white;
      padding: 3rem 0 1.5rem;
      margin-top: 4rem;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    `;

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    `;

    // About section
    const aboutSection = document.createElement('div');
    aboutSection.innerHTML = `
      <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">${config.siteName}</h3>
      <p style="color: rgba(255,255,255,0.8); margin-bottom: 1rem;">
        Government-approved workforce development and career training platform.
        WIOA, DOL, DOE compliant.
      </p>
      <p style="color: rgba(255,255,255,0.8);">
        📞 <a href="tel:${config.phone}" style="color: rgba(255,255,255,0.8); text-decoration: none;">${config.phone}</a><br>
        📧 <a href="mailto:${config.email}" style="color: rgba(255,255,255,0.8); text-decoration: none;">${config.email}</a>
      </p>
    `;

    // Programs section
    const programsSection = document.createElement('div');
    programsSection.innerHTML = `
      <h4 style="margin-bottom: 1rem; font-size: 1.125rem;">Programs</h4>
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li style="margin-bottom: 0.5rem;"><a href="/programs" style="color: rgba(255,255,255,0.8); text-decoration: none;">All Programs</a></li>
        <li style="margin-bottom: 0.5rem;"><a href="/apply" style="color: rgba(255,255,255,0.8); text-decoration: none;">Apply Now</a></li>
        <li style="margin-bottom: 0.5rem;"><a href="/lms" style="color: rgba(255,255,255,0.8); text-decoration: none;">Student Portal</a></li>
        <li style="margin-bottom: 0.5rem;"><a href="/lms/instructor" style="color: rgba(255,255,255,0.8); text-decoration: none;">Instructor Portal</a></li>
      </ul>
    `;

    // Partners section
    const partnersSection = document.createElement('div');
    partnersSection.innerHTML = `
      <h4 style="margin-bottom: 1rem; font-size: 1.125rem;">Partners</h4>
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li style="margin-bottom: 0.5rem;"><a href="/employers" style="color: rgba(255,255,255,0.8); text-decoration: none;">Employers</a></li>
        <li style="margin-bottom: 0.5rem;"><a href="/pages/partner-onboarding.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Partner Onboarding</a></li>
        <li style="margin-bottom: 0.5rem;"><a href="/pages/selfish-inc.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Selfish Inc</a></li>
        <li style="margin-bottom: 0.5rem;"><a href="/pages/partners.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">All Partners</a></li>
      </ul>
    `;

    // Resources section
    const resourcesSection = document.createElement('div');
    resourcesSection.innerHTML = `
      <h4 style="margin-bottom: 1rem; font-size: 1.125rem;">Resources</h4>
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li style="margin-bottom: 0.5rem;"><a href="/support" style="color: rgba(255,255,255,0.8); text-decoration: none;">Support</a></li>
        <li style="margin-bottom: 0.5rem;"><a href="/policies/privacy.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Privacy Policy</a></li>
        <li style="margin-bottom: 0.5rem;"><a href="/policies/terms.html" style="color: rgba(255,255,255,0.8); text-decoration: none;">Terms of Service</a></li>
        <li style="margin-bottom: 0.5rem;"><a href="/accessibility" style="color: rgba(255,255,255,0.8); text-decoration: none;">Accessibility</a></li>
      </ul>
    `;

    grid.appendChild(aboutSection);
    grid.appendChild(programsSection);
    grid.appendChild(partnersSection);
    grid.appendChild(resourcesSection);

    // Social media
    const social = document.createElement('div');
    social.style.cssText = `
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin: 2rem 0;
    `;
    social.innerHTML = `
      <a href="${config.socialMedia.facebook}" target="_blank" rel="noopener" style="color: white; font-size: 1.5rem; text-decoration: none;">📘</a>
      <a href="${config.socialMedia.linkedin}" target="_blank" rel="noopener" style="color: white; font-size: 1.5rem; text-decoration: none;">💼</a>
      <a href="${config.socialMedia.youtube}" target="_blank" rel="noopener" style="color: white; font-size: 1.5rem; text-decoration: none;">📺</a>
      <a href="${config.socialMedia.instagram}" target="_blank" rel="noopener" style="color: white; font-size: 1.5rem; text-decoration: none;">📷</a>
    `;

    // Copyright
    const copyright = document.createElement('div');
    copyright.style.cssText = `
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6);
    `;
    copyright.innerHTML = `
      <p>© ${new Date().getFullYear()} Elevate for Humanity. All rights reserved. | A 501(c)(3) Nonprofit Organization</p>
    `;

    container.appendChild(grid);
    container.appendChild(social);
    container.appendChild(copyright);
    footer.appendChild(container);

    return footer;
  }

  // Initialize on DOM ready
  function init() {
    // Insert header at the beginning of body
    const header = createHeader();
    document.body.insertBefore(header, document.body.firstChild);

    // Append footer at the end of body
    const footer = createFooter();
    document.body.appendChild(footer);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
