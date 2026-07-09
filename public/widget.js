/**
 * Elevate for Humanity - Widget System
 *
 * Advanced embeddable widgets for Durable landing pages
 * Supports multiple widget types: programs list, CTA buttons, forms, etc.
 *
 * Usage Examples:
 *
 * 1. Programs Widget:
 * <div class="efh-widget" data-type="programs" data-limit="6"></div>
 *
 * 2. CTA Button:
 * <div class="efh-widget" data-type="cta" data-page="get-started" data-text="Get Started Today"></div>
 *
 * 3. Contact Form:
 * <div class="efh-widget" data-type="form" data-form="contact"></div>
 *
 * 4. Full Page Embed:
 * <div class="efh-widget" data-type="page" data-page="hub" data-height="600px"></div>
 *
 * <script src="https://www.elevateforhumanity.org/widget.js"></script>
 */

(function () {
  'use strict';

  const CONFIG = {
    baseUrl: 'https://www.elevateforhumanity.org',
    apiUrl: 'https://www.elevateforhumanity.org/api',
    styles: {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#10b981',
      danger: '#ef4444',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
  };

  /**
   * Widget Types
   */
  const WIDGETS = {
    /**
     * Programs List Widget
     */
    programs: function (container, options) {
      const limit = options.limit || 6;
      const layout = options.layout || 'grid'; // grid or list

      container.innerHTML = `
        <div class="efh-programs-widget" style="font-family: ${CONFIG.styles.fontFamily};">
          <div class="efh-loading" style="text-align: center; padding: 20px;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top-color: ${CONFIG.styles.primary}; border-radius: 50%; animation: efh-spin 1s linear infinite;"></div>
          </div>
        </div>
      `;

      // Simulate API call (replace with actual API when available)
      setTimeout(() => {
        const programs = [
          {
            id: 1,
            title: 'Healthcare Training',
            description: 'Comprehensive healthcare certification programs',
            duration: '12 weeks',
          },
          {
            id: 2,
            title: 'Tech Apprenticeship',
            description: 'Software development and IT training',
            duration: '16 weeks',
          },
          {
            id: 3,
            title: 'Business Management',
            description: 'Leadership and management skills',
            duration: '8 weeks',
          },
          {
            id: 4,
            title: 'Skilled Trades',
            description: 'Hands-on training in construction and trades',
            duration: '20 weeks',
          },
          {
            id: 5,
            title: 'Childcare Provider',
            description: 'Early childhood education certification',
            duration: '10 weeks',
          },
          {
            id: 6,
            title: 'Esthetics & Beauty',
            description: 'Skincare and beauty treatment courses',
            duration: '14 weeks',
          },
        ].slice(0, limit);

        const html =
          layout === 'grid' ? renderProgramsGrid(programs) : renderProgramsList(programs);

        container.querySelector('.efh-programs-widget').innerHTML = html;
      }, 500);
    },

    /**
     * CTA Button Widget
     */
    cta: function (container, options) {
      const page = options.page || 'get-started';
      const text = options.text || 'Get Started';
      const style = options.style || 'primary'; // primary, secondary, outline

      const buttonStyles = {
        primary: `background: ${CONFIG.styles.primary}; color: white; border: none;`,
        secondary: `background: ${CONFIG.styles.secondary}; color: white; border: none;`,
        outline: `background: transparent; color: ${CONFIG.styles.primary}; border: 2px solid ${CONFIG.styles.primary};`,
      };

      container.innerHTML = `
        <a href="${CONFIG.baseUrl}/${page}"
           target="_blank"
           rel="noopener noreferrer"
           class="efh-cta-button"
           style="
             display: inline-block;
             padding: 12px 32px;
             font-size: 16px;
             font-weight: 600;
             font-family: ${CONFIG.styles.fontFamily};
             text-decoration: none;
             border-radius: 8px;
             transition: all 0.3s ease;
             ${buttonStyles[style]}
           "
           onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-2px)'"
           onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'"
        >
          ${text}
        </a>
      `;
    },

    /**
     * Full Page Embed Widget
     */
    page: function (container, options) {
      const page = options.page || 'programs';
      const height = options.height || '800px';
      const width = options.width || '100%';

      container.innerHTML = `
        <iframe
          src="${CONFIG.baseUrl}/${page}"
          style="
            width: ${width};
            height: ${height};
            border: none;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          "
          loading="lazy"
          title="Elevate for Humanity - ${page}"
        ></iframe>
      `;
    },

    /**
     * Stats Widget
     */
    stats: function (container, options) {
      container.innerHTML = `
        <div class="efh-stats-widget" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          font-family: ${CONFIG.styles.fontFamily};
        ">
          <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <div style="font-size: 36px; font-weight: bold; color: ${CONFIG.styles.primary};">Many</div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">Students Trained</div>
          </div>
          <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <div style="font-size: 36px; font-weight: bold; color: ${CONFIG.styles.success};">95%</div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">Job Placement Rate</div>
          </div>
          <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <div style="font-size: 36px; font-weight: bold; color: ${CONFIG.styles.secondary};">15+</div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">Training Programs</div>
          </div>
        </div>
      `;
    },

    /**
     * Quick Links Widget
     */
    links: function (container, options) {
      const links = options.links || [
        { text: 'Browse Programs', url: 'programs' },
        { text: 'Student Hub', url: 'hub' },
        { text: 'Get Started', url: 'get-started' },
        { text: 'Contact Us', url: 'connect' },
      ];

      const linksHtml = links
        .map(
          (link) => `
        <a href="${CONFIG.baseUrl}/${link.url}"
           target="_blank"
           rel="noopener noreferrer"
           style="
             display: block;
             padding: 12px 16px;
             color: ${CONFIG.styles.primary};
             text-decoration: none;
             border-bottom: 1px solid #e5e7eb;
             transition: background 0.2s;
           "
           onmouseover="this.style.background='#f9fafb'"
           onmouseout="this.style.background='transparent'"
        >
          ${link.text} →
        </a>
      `,
        )
        .join('');

      container.innerHTML = `
        <div class="efh-links-widget" style="
          font-family: ${CONFIG.styles.fontFamily};
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        ">
          ${linksHtml}
        </div>
      `;
    },
  };

  /**
   * Helper: Render programs in grid layout
   */
  function renderProgramsGrid(programs) {
    const cards = programs
      .map(
        (program) => `
      <div style="
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        transition: all 0.3s;
        cursor: pointer;
      "
      onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.transform='translateY(-4px)'"
      onmouseout="this.style.boxShadow='none'; this.style.transform='translateY(0)'"
      onclick="window.open('${CONFIG.baseUrl}/programs', '_blank')"
      >
        <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 18px;">${program.title}</h3>
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">${program.description}</p>
        <div style="display: flex; align-items: center; gap: 8px; color: ${CONFIG.styles.primary}; font-size: 14px;">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"/>
          </svg>
          ${program.duration}
        </div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
      ">
        ${cards}
      </div>
    `;
  }

  /**
   * Helper: Render programs in list layout
   */
  function renderProgramsList(programs) {
    const items = programs
      .map(
        (program) => `
      <div style="
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
      "
      onmouseover="this.style.background='#f9fafb'"
      onmouseout="this.style.background='white'"
      onclick="window.open('${CONFIG.baseUrl}/programs', '_blank')"
      >
        <div>
          <h4 style="margin: 0 0 4px 0; color: #111827;">${program.title}</h4>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">${program.description}</p>
        </div>
        <div style="color: ${CONFIG.styles.primary}; font-size: 14px; white-space: nowrap; margin-left: 16px;">
          ${program.duration}
        </div>
      </div>
    `,
      )
      .join('');

    return items;
  }

  /**
   * Initialize all widgets on the page
   */
  function initWidgets() {
    const widgets = document.querySelectorAll('.efh-widget');

    widgets.forEach((container) => {
      const type = container.getAttribute('data-type');
      const options = {};

      // Parse all data attributes as options
      Array.from(container.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-') && attr.name !== 'data-type') {
          const key = attr.name
            .replace('data-', '')
            .replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          options[key] = attr.value;
        }
      });

      if (WIDGETS[type]) {
        WIDGETS[type](container, options);
      } else {
        container.innerHTML = `<p style="color: red;">Error: Unknown widget type "${type}"</p>`;
      }
    });

    // Add CSS animations
    addStyles();
  }

  /**
   * Add required CSS styles
   */
  function addStyles() {
    if (document.getElementById('efh-widget-styles')) return;

    const style = document.createElement('style');
    style.id = 'efh-widget-styles';
    style.textContent = `
      @keyframes efh-spin {
        to { transform: rotate(360deg); }
      }
      .efh-widget { margin: 20px 0; }
    `;
    document.head.appendChild(style);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
  } else {
    initWidgets();
  }

  // Expose API
  window.EFHWidget = {
    init: initWidgets,
    version: '1.0.0',
    config: CONFIG,
    availableWidgets: Object.keys(WIDGETS),
  };
})();
