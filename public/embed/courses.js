/**
 * Elevate for Humanity - Public Course Catalog Embed Widget
 */

(function () {
  'use strict';

  const EFH = window.EFH || {};
  const API_BASE = 'https://www.elevateforhumanity.org';
  const LMS_BASE = 'https://app.elevateforhumanity.org';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeImageUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(String(value), API_BASE);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return url.href;
    } catch {
      return '';
    }
  }

  EFH.Courses = {
    apiBase: API_BASE,
    lmsBase: LMS_BASE,

    init: function (options) {
      const input = options || {};
      const config = {
        container: input.container || '#efh-courses',
        limit: Math.max(1, Math.min(24, Number(input.limit) || 6)),
        showEnroll: input.showEnroll !== false,
        category: input.category || null,
      };
      this.render(config);
    },

    async fetchCourses(config) {
      const params = new URLSearchParams({ limit: String(config.limit) });
      if (config.category) params.set('category', String(config.category));

      try {
        const response = await fetch(`${this.apiBase}/api/courses?${params.toString()}`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`Course API ${response.status}`);
        const data = await response.json();
        return Array.isArray(data.data) ? data.data : [];
      } catch {
        return [];
      }
    },

    async render(config) {
      const container = document.querySelector(config.container);
      if (!container) return;

      container.innerHTML = '<div class="efh-loading">Loading courses...</div>';
      const courses = await this.fetchCourses(config);

      if (courses.length === 0) {
        container.innerHTML = '<div class="efh-empty">No courses are currently available.</div>';
        return;
      }

      const html = `
        <div class="efh-courses-grid">
          ${courses.map((course) => this.renderCourse(course, config)).join('')}
        </div>
        <style>
          .efh-courses-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;margin:24px 0}
          .efh-course-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,.08);transition:transform .2s,box-shadow .2s}
          .efh-course-card:hover{transform:translateY(-3px);box-shadow:0 8px 18px rgba(15,23,42,.12)}
          .efh-course-image{width:100%;height:180px;object-fit:cover;background:#e2e8f0}
          .efh-course-image-placeholder{height:180px;display:grid;place-items:center;background:linear-gradient(135deg,#0f766e,#155e75);color:#fff;font-weight:800;padding:24px;text-align:center}
          .efh-course-content{padding:20px}
          .efh-course-title{font-size:18px;font-weight:700;margin:0 0 8px;color:#0f172a}
          .efh-course-description{font-size:14px;color:#475569;margin:0 0 16px;line-height:1.5}
          .efh-course-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
          .efh-course-duration{font-size:13px;color:#64748b}
          .efh-course-btn{display:block;padding:11px 16px;background:#0e7490;color:#fff;text-align:center;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px}
          .efh-course-btn:hover{background:#155e75}
          .efh-loading,.efh-empty{text-align:center;padding:40px;color:#64748b}
        </style>
      `;

      container.innerHTML = html;
    },

    renderCourse(course, config) {
      const id = encodeURIComponent(String(course.id || ''));
      const title = escapeHtml(course.title || 'Course');
      const description = escapeHtml(
        course.short_description || course.description || 'Learn new skills and advance your career',
      );
      const imageUrl = safeImageUrl(course.thumbnail_url);
      const durationHours = Number(course.duration_hours || 0);
      const duration = durationHours > 0 ? `${durationHours} hours` : 'Self-paced';
      const enrollUrl = `${this.lmsBase}/lms/courses/${id}`;
      const image = imageUrl
        ? `<img src="${escapeHtml(imageUrl)}" alt="${title}" class="efh-course-image" loading="lazy">`
        : `<div class="efh-course-image-placeholder" aria-hidden="true">${title}</div>`;

      return `
        <article class="efh-course-card">
          ${image}
          <div class="efh-course-content">
            <h3 class="efh-course-title">${title}</h3>
            <p class="efh-course-description">${description}</p>
            <div class="efh-course-meta"><span class="efh-course-duration">${escapeHtml(duration)}</span></div>
            ${config.showEnroll ? `<a href="${enrollUrl}" class="efh-course-btn">View Course</a>` : ''}
          </div>
        </article>
      `;
    },
  };

  window.EFH = EFH;
})();
