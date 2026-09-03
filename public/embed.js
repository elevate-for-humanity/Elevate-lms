/**
 * Elevate for Humanity - Dynamic Page Embed Script
 *
 * This script allows embedding dynamic pages from the Vite app into Durable landing pages.
 *
 * Usage in Durable:
 * <div id="efh-embed" data-page="programs"></div>
 * <script src="https://www.elevateforhumanity.org/embed.js"></script>
 */

(function () {
  'use strict';

  const BASE_URL = 'https://www.elevateforhumanity.org';

  // Available pages that can be embedded
  const EMBEDDABLE_PAGES = [
    'programs',
    'hub',
    'lms',
    'get-started',
    'about',
    'partners',
    'donate',
    'connect',
    'student',
    'compliance',
    'accessibility',
  ];

  /**
   * Initialize the embed when DOM is ready
   */
  function init() {
    const container = document.getElementById('efh-embed');

    if (!container) {
      return;
    }

    const page = container.getAttribute('data-page') || 'programs';
    const height = container.getAttribute('data-height') || '800px';
    const width = container.getAttribute('data-width') || '100%';

    if (!EMBEDDABLE_PAGES.includes(page)) {
        `EFH Embed: Page "${page}" is not embeddable. Available: ${EMBEDDABLE_PAGES.join(', ')}`
      );
      container.innerHTML = `<p style="color: red;">Error: Page "${page}" not available for embedding.</p>`;
      return;
    }

    embedPage(container, page, { height, width });
  }

  /**
   * Embed a page using iframe
   */
  function embedPage(container, page, options) {
    const iframe = document.createElement('iframe');
    iframe.src = `${BASE_URL}/${page}`;
    iframe.style.width = options.width;
    iframe.style.height = options.height;
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', `Elevate for Humanity - ${page}`);

    // Add loading indicator
    container.innerHTML =
      '<div style="text-align: center; padding: 40px;">Loading...</div>';

    iframe.onload = function () {
      container.innerHTML = '';
      container.appendChild(iframe);
    };

    iframe.onerror = function () {
      container.innerHTML =
        '<p style="color: red;">Failed to load content. Please try again later.</p>';
    };
  }

  /**
   * Alternative: Load content via fetch (for same-origin or CORS-enabled)
   */
  function embedPageDirect(container, page, options) {
    fetch(`${BASE_URL}/${page}`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch page');
        return response.text();
      })
      .then((html) => {
        // Create a sandboxed container
        const wrapper = document.createElement('div');
        wrapper.style.width = options.width;
        wrapper.style.minHeight = options.height;
        wrapper.innerHTML = html;

        container.innerHTML = '';
        container.appendChild(wrapper);

        // Load scripts and styles from the fetched content
        loadExternalResources(wrapper);
      })
      .catch((error) => {
        container.innerHTML =
          '<p style="color: red;">Failed to load content. Please try again later.</p>';
      });
  }

  /**
   * Load external resources (CSS, JS) from embedded content
   */
  function loadExternalResources(wrapper) {
    // Load stylesheets
    const links = wrapper.querySelectorAll('link[rel="stylesheet"]');
    links.forEach((link) => {
      const newLink = document.createElement('link');
      newLink.rel = 'stylesheet';
      newLink.href = link.href.startsWith('http')
        ? link.href
        : BASE_URL + link.href;
      document.head.appendChild(newLink);
    });

    // Load scripts
    const scripts = wrapper.querySelectorAll('script[src]');
    scripts.forEach((script) => {
      const newScript = document.createElement('script');
      newScript.src = script.src.startsWith('http')
        ? script.src
        : BASE_URL + script.src;
      newScript.async = true;
      document.body.appendChild(newScript);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for manual initialization
  window.EFHEmbed = {
    init: init,
    version: '1.0.0',
    availablePages: EMBEDDABLE_PAGES,
  };
})();
