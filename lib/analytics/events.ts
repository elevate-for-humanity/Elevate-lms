/**
 * GA4 Analytics Event Tracking
 * 
 * CORE FUNNEL EVENTS (Required for institutional analytics):
 * - page_view: Baseline traffic
 * - start_tax_prep: Tax funnel entry
 * - complete_tax_prep: Tax funnel completion
 * - refund_advance_viewed: Advance visibility
 * - refund_advance_opt_in: Risk monitoring
 * - store_product_view: Store intent
 * - checkout_started: Revenue funnel
 * - purchase_completed: Conversion
 * - lms_course_start: LMS usage
 * - lms_course_complete: LMS effectiveness
 * 
 * DATA HYGIENE:
 * - IP anonymization ON (configured in gtag)
 * - No PII in event names or params
 * - No raw tax data tracked
 * - Respect cookie consent
 * 
 * CONTENT GROUPINGS:
 * - Marketing
 * - Resources
 * - LMS (public)
 * - Store
 */

type EventCategory = 
  | 'engagement'
  | 'conversion'
  | 'navigation'
  | 'form'
  | 'video'
  | 'download'
  | 'error'
  | 'tax_funnel'
  | 'store'
  | 'lms'
  | 'enrollment';

type ContentGroup = 'marketing' | 'resources' | 'lms_public' | 'store' | 'tax';

interface TrackEventParams {
  action: string;
  category: EventCategory;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
  contentGroup?: ContentGroup;
  /** Arbitrary key-value pairs forwarded to GA4 as custom parameters */
  customParams?: Record<string, string | number | boolean>;
}

// Safe gtag wrapper
function safeGtag(command: string, ...args: any[]) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(command, ...args);
  }
}

// Track generic event
export function trackEvent({ action, category, label, value, nonInteraction, contentGroup, customParams }: TrackEventParams) {
  safeGtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    non_interaction: nonInteraction,
    content_group: contentGroup,
    ...customParams,
  });
}

// Set content group for page
export function setContentGroup(group: ContentGroup) {
  safeGtag('set', { content_group: group });
}

// ============================================
// TAX PREPARATION FUNNEL (REQUIRED)
// ============================================

export const TaxFunnelEvents = {
  // Tax funnel entry
  startTaxPrep: (source?: string) => {
    trackEvent({
      action: 'start_tax_prep',
      category: 'tax_funnel',
      label: source || 'direct',
      contentGroup: 'tax',
    });
  },

  // Tax funnel completion
  completeTaxPrep: (filingType?: string) => {
    trackEvent({
      action: 'complete_tax_prep',
      category: 'tax_funnel',
      label: filingType || 'standard',
      contentGroup: 'tax',
    });
  },

  // Refund advance viewed
  refundAdvanceViewed: () => {
    trackEvent({
      action: 'refund_advance_viewed',
      category: 'tax_funnel',
      contentGroup: 'tax',
    });
  },

  // Refund advance opt-in (risk monitoring)
  refundAdvanceOptIn: () => {
    trackEvent({
      action: 'refund_advance_opt_in',
      category: 'tax_funnel',
      contentGroup: 'tax',
    });
  },
};

// ============================================
// STORE / CHECKOUT FUNNEL (REQUIRED)
// ============================================

export const StoreFunnelEvents = {
  // Store product view
  productView: (productId: string, productName: string, price?: number) => {
    trackEvent({
      action: 'store_product_view',
      category: 'store',
      label: productName,
      value: price,
      contentGroup: 'store',
    });
  },

  // Checkout started
  checkoutStarted: (productId: string, value?: number) => {
    trackEvent({
      action: 'checkout_started',
      category: 'store',
      label: productId,
      value: value,
      contentGroup: 'store',
    });
  },

  // Purchase completed
  purchaseCompleted: (transactionId: string, value: number, productId?: string) => {
    safeGtag('event', 'purchase_completed', {
      event_category: 'store',
      transaction_id: transactionId,
      value: value,
      product_id: productId,
      currency: 'USD',
      content_group: 'store',
    });
  },
};

// ============================================
// LMS FUNNEL (REQUIRED)
// ============================================

export const LmsFunnelEvents = {
  // Course start
  courseStart: (courseId: string, courseName: string) => {
    trackEvent({
      action: 'lms_course_start',
      category: 'lms',
      label: courseName,
      contentGroup: 'lms_public',
    });
  },

  // Course complete
  courseComplete: (courseId: string, courseName: string, completionMinutes?: number) => {
    trackEvent({
      action: 'lms_course_complete',
      category: 'lms',
      label: courseName,
      value: completionMinutes,
      contentGroup: 'lms_public',
    });
  },

  // Lesson complete
  lessonComplete: (courseId: string, lessonId: string) => {
    trackEvent({
      action: 'lms_lesson_complete',
      category: 'lms',
      label: `${courseId}/${lessonId}`,
    });
  },

  // Quiz complete
  quizComplete: (quizId: string, score: number, passed: boolean) => {
    trackEvent({
      action: 'lms_quiz_complete',
      category: 'lms',
      label: quizId,
      value: score,
    });
  },

  // Certificate earned
  certificateEarned: (certificateId: string, courseName: string) => {
    trackEvent({
      action: 'certificate_earned',
      category: 'lms',
      label: courseName,
    });
  },
};

// ============================================
// ENROLLMENT FUNNEL
// ============================================

export const EnrollmentEvents = {
  // Application start
  applicationStart: (programId?: string) => {
    trackEvent({
      action: 'application_start',
      category: 'enrollment',
      label: programId,
    });
  },

  // Application submit
  applicationSubmit: (programId?: string) => {
    trackEvent({
      action: 'application_submit',
      category: 'enrollment',
      label: programId,
    });
  },

  // Enrollment complete
  enrollmentComplete: (programId: string, programName: string) => {
    trackEvent({
      action: 'enrollment_complete',
      category: 'enrollment',
      label: programName,
    });
  },
};

// Pre-defined conversion events
export const ConversionEvents = {
  // Application submitted
  applicationSubmit: (programName?: string) => {
    trackEvent({
      action: 'application_submit',
      category: 'conversion',
      label: programName,
    });
  },

  // Contact form submitted
  contactSubmit: () => {
    trackEvent({
      action: 'contact_submit',
      category: 'conversion',
    });
  },

  // User signed up
  signUp: (method?: string) => {
    trackEvent({
      action: 'sign_up',
      category: 'conversion',
      label: method,
    });
  },

  // User logged in
  login: (method?: string) => {
    trackEvent({
      action: 'login',
      category: 'conversion',
      label: method,
    });
  },

  // Course enrollment
  courseEnroll: (courseName: string, value?: number) => {
    trackEvent({
      action: 'course_enroll',
      category: 'conversion',
      label: courseName,
      value,
    });
  },

  // Purchase completed
  purchase: (itemName: string, value: number) => {
    trackEvent({
      action: 'purchase',
      category: 'conversion',
      label: itemName,
      value,
    });
  },

  // Donation made
  donate: (amount: number) => {
    trackEvent({
      action: 'donate',
      category: 'conversion',
      value: amount,
    });
  },
};

// Engagement events
export const EngagementEvents = {
  // Page scroll depth
  scrollDepth: (percentage: number) => {
    trackEvent({
      action: 'scroll_depth',
      category: 'engagement',
      label: `${percentage}%`,
      value: percentage,
      nonInteraction: true,
    });
  },

  // Time on page
  timeOnPage: (seconds: number) => {
    trackEvent({
      action: 'time_on_page',
      category: 'engagement',
      value: seconds,
      nonInteraction: true,
    });
  },

  // Video play
  videoPlay: (videoTitle: string) => {
    trackEvent({
      action: 'video_play',
      category: 'video',
      label: videoTitle,
    });
  },

  // Video complete
  videoComplete: (videoTitle: string) => {
    trackEvent({
      action: 'video_complete',
      category: 'video',
      label: videoTitle,
    });
  },

  // File download
  fileDownload: (fileName: string) => {
    trackEvent({
      action: 'file_download',
      category: 'download',
      label: fileName,
    });
  },

  // External link click
  externalLinkClick: (url: string) => {
    trackEvent({
      action: 'external_link_click',
      category: 'navigation',
      label: url,
    });
  },

  // CTA click
  ctaClick: (ctaName: string, location?: string) => {
    trackEvent({
      action: 'cta_click',
      category: 'engagement',
      label: `${ctaName}${location ? ` - ${location}` : ''}`,
    });
  },

  // Search performed
  search: (query: string) => {
    trackEvent({
      action: 'search',
      category: 'engagement',
      label: query,
    });
  },
};

// Form events
export const FormEvents = {
  // Form started
  formStart: (formName: string) => {
    trackEvent({
      action: 'form_start',
      category: 'form',
      label: formName,
    });
  },

  // Form field interaction
  formFieldFocus: (formName: string, fieldName: string) => {
    trackEvent({
      action: 'form_field_focus',
      category: 'form',
      label: `${formName} - ${fieldName}`,
    });
  },

  // Form error
  formError: (formName: string, errorMessage: string) => {
    trackEvent({
      action: 'form_error',
      category: 'error',
      label: `${formName}: ${errorMessage}`,
    });
  },

  // Form abandoned
  formAbandon: (formName: string, lastField?: string) => {
    trackEvent({
      action: 'form_abandon',
      category: 'form',
      label: `${formName}${lastField ? ` - last: ${lastField}` : ''}`,
    });
  },
};

// Error tracking
export const ErrorEvents = {
  // JavaScript error
  jsError: (message: string, source?: string) => {
    trackEvent({
      action: 'js_error',
      category: 'error',
      label: `${message}${source ? ` (${source})` : ''}`,
      nonInteraction: true,
    });
  },

  // API error
  apiError: (endpoint: string, statusCode: number) => {
    trackEvent({
      action: 'api_error',
      category: 'error',
      label: `${endpoint} - ${statusCode}`,
      nonInteraction: true,
    });
  },

  // 404 page
  notFound: (path: string) => {
    trackEvent({
      action: '404_error',
      category: 'error',
      label: path,
      nonInteraction: true,
    });
  },
};

// ============================================
// DEMO + TRIAL FUNNEL
// ============================================
//
// GA4 SETUP REQUIRED:
// The `correlation_id` custom parameter is sent with trial events.
// To make it queryable in GA4 reports (not just DebugView), register it:
//   GA4 Admin → Custom definitions → Create custom dimension
//     Name: Correlation ID
//     Scope: Event
//     Event parameter: correlation_id
//

export const DemoTrialFunnelEvents = {
  demoPrimaryCtaClicked: () => {
    trackEvent({
      action: 'demo_primary_cta_clicked',
      category: 'demo_trial_funnel',
      label: 'start_trial_from_demo',
    });
  },

  demoTourStarted: (tourId: string) => {
    trackEvent({
      action: 'demo_tour_started',
      category: 'demo_trial_funnel',
      label: tourId,
    });
  },

  demoTourCompleted: (tourId: string) => {
    trackEvent({
      action: 'demo_tour_completed',
      category: 'demo_trial_funnel',
      label: tourId,
    });
  },

  trialCreatedSuccess: (subdomain: string, correlationId?: string) => {
    trackEvent({
      action: 'trial_created_success',
      category: 'demo_trial_funnel',
      label: subdomain,
      customParams: correlationId ? { correlation_id: correlationId } : undefined,
    });
  },

  trialCreatedFailed: (error: string, correlationId?: string) => {
    trackEvent({
      action: 'trial_created_failed',
      category: 'demo_trial_funnel',
      label: error,
      customParams: correlationId ? { correlation_id: correlationId } : undefined,
    });
  },

  trialSuccessOpenDashboard: (subdomain: string, correlationId?: string) => {
    trackEvent({
      action: 'trial_success_open_dashboard',
      category: 'demo_trial_funnel',
      label: subdomain,
      customParams: correlationId ? { correlation_id: correlationId } : undefined,
    });
  },

  redirectNoticeShown: (reason: string) => {
    trackEvent({
      action: 'redirect_notice_shown',
      category: 'demo_trial_funnel',
      label: reason,
      nonInteraction: true,
    });
  },

  redirectNoticeCtaClicked: (reason: string) => {
    trackEvent({
      action: 'redirect_notice_cta_clicked',
      category: 'demo_trial_funnel',
      label: reason,
    });
  },
};
