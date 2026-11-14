/**
 * External SDK Type Declarations
 * 
 * Provides TypeScript types for third-party SDKs and APIs
 * that don't have official @types packages or need custom extensions.
 */

// ============================================
// WINDOW EXTENSIONS
// ============================================

/**
 * Extended Window interface for third-party SDK integrations
 */
export interface Window {
  // Facebook Pixel
  fbq?: FacebookPixel.fbq;
  _fbq?: FacebookPixel._fbq;
  
  // Google Analytics 4
  gtag?: Gtag.Gtag;
  dataLayer?: Gtag.DataLayer;
  
  // Affirm
  affirm?: Affirm.AffirmInstance;
  _affirm_config?: Affirm.AffirmConfig;
  
  // Web APIs
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  
  // Speech Recognition
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

// ============================================
// FACEBOOK PIXEL
// ============================================

export namespace FacebookPixel {
  export interface fbq {
    (...args: unknown[]): void;
    callMethod?: (...args: unknown[]) => void;
    push: (...args: unknown[]) => void;
    load?: (event: string) => void;
    fbCalls?: unknown[][];
  }

  export interface _fbq {
    (...args: unknown[]): void;
    push: (...args: unknown[]) => void;
  }

  export type EventName =
    | 'PageView'
    | 'ViewContent'
    | 'Search'
    | 'AddToCart'
    | 'AddToWishlist'
    | 'InitiateCheckout'
    | 'AddPaymentInfo'
    | 'Purchase'
    | 'Lead'
    | 'CompleteRegistration'
    | 'Contact'
    | 'CustomizeProduct'
    | 'Donate'
    | 'FindLocation'
    | 'Schedule'
    | 'StartTrial'
    | 'SubmitApplication'
    | 'Subscribe'
    | 'CustomizeProduct'
    | string;

  export interface EventData {
    [key: string]: string | number | boolean | undefined;
  }
}

// ============================================
// GOOGLE ANALYTICS 4 (gtag)
// ============================================

export namespace Gtag {
  export interface Gtag {
    (...args: unknown[]): void;
    js: (config: { id: string }) => void;
    config: (targetId: string, config?: ConfigParams) => void;
    set: (targetId: string, config: ConfigParams) => void;
    get: (targetId: string, fieldName: string, callback?: () => void) => void;
    event: (eventName: string, eventParams?: EventParams) => void;
    consent: (options: ConsentOptions) => void;
  }

  export type DataLayer = unknown[][];

  export interface ConfigParams {
    [key: string]: string | number | boolean | undefined;
  }

  export interface EventParams {
    // Standard GA4 event parameters
    event_category?: string;
    event_label?: string;
    value?: number;
    currency?: string;
    
    // E-commerce parameters
    items?: GA4Item[];
    transaction_id?: string;
    affiliation?: string;
    coupon?: string;
    shipping?: number;
    tax?: number;
    revenue?: number;
    
    // Custom parameters
    [key: string]: string | number | boolean | undefined | GA4Item[];
  }

  export interface GA4Item {
    item_id: string;
    item_name: string;
    item_brand?: string;
    item_category?: string;
    item_category2?: string;
    item_category3?: string;
    item_category4?: string;
    item_category5?: string;
    item_variant?: string;
    price?: number;
    quantity?: number;
    coupon?: string;
    index?: number;
    affiliation?: string;
    creative_name?: string;
    creative_slot?: string;
    promotion_id?: string;
    promotion_name?: string;
  }

  export interface ConsentOptions {
    analytics_storage?: 'granted' | 'denied';
    ad_storage?: 'granted' | 'denied';
    ad_user_data?: 'granted' | 'denied';
    ad_personalization?: 'granted' | 'denied';
    wait_for_update?: number;
  }
}

// ============================================
// AFFIRM
// ============================================

export namespace Affirm {
  export interface AffirmInstance {
    checkout: {
      (config: CheckoutConfig): void;
      open: (options?: CheckoutOptions) => void;
      close: () => void;
    };
    promotional: (config: PromoConfig) => {
      contains: (amount: number) => boolean;
    };
    ui: {
      ready: (callback: () => void) => void;
      on: (event: string, callback: () => void) => void;
    };
    isInitialized: () => boolean;
  }

  export interface AffirmConfig {
    public_api_key: string;
    script?: string;
  }

  export interface CheckoutConfig {
    merchant?: {
      name?: string;
      user_confirmation_url?: string;
      user_cancel_url?: string;
      user_return_url?: string;
    };
    shipping?: Address;
    billing?: Address;
    items?: CheckoutItem[];
    currency?: string;
    tax_amount?: number;
    shipping_amount?: number;
    total?: number;
  }

  export interface CheckoutOptions {
    method?: string;
  }

  export interface PromoConfig {
    amount: number;
    locale?: string;
    country_code?: string;
    logo?: {
      logo_url?: string;
      logo_width?: number;
      logo_height?: number;
    };
  }

  export interface Address {
    name?: {
      first?: string;
      last?: string;
      full?: string;
    };
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      zipcode?: string;
      country?: string;
    };
    phone_number?: string;
    phone_number_include?: boolean;
    email?: string;
  }

  export interface CheckoutItem {
    sku: string;
    display_name?: string;
    description?: string;
    unit_price?: number;
    qty?: number;
    item_url?: string;
    item_image_url?: string;
    categories?: string[][];
  }
}

// ============================================
// SPEECH RECOGNITION API
// ============================================

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: SpeechRecognitionErrorCode;
  message: string;
}

export type SpeechRecognitionErrorCode =
  | 'aborted'
  | 'audio-capture'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'network'
  | 'no-speech'
  | 'not-allowed'
  | 'service-not-allowed';

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// ============================================
// SUPABASE DATABASE TYPES
// ============================================

/**
 * Supabase profiles table type
 */
export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  role?: string;
  organization_id?: string;
}

/**
 * Supabase enrollments with relations
 */
export interface EnrollmentWithProfile {
  id: string;
  user_id: string;
  program_id?: string;
  program_name?: string;
  status?: string;
  enrolled_at?: string;
  completed_at?: string;
  profiles?: Profile;
  enrollments?: { count: number }[];
}

/**
 * Training programs relation
 */
export interface TrainingProgram {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  created_at?: string;
}

// ============================================
// WEB VITALS
// ============================================

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  entries: PerformanceEntry[];
}

// ============================================
// REQUEST IDLE CALLBACK
// ============================================

export interface IdleRequestCallback {
  (deadline: IdleDeadline): void;
}

export interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining: () => number;
}

export interface IdleRequestOptions {
  timeout?: number;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Record with string keys and any values
 */
export type StringRecord = Record<string, unknown>;

/**
 * Safe callback type
 */
export type SafeCallback<T extends unknown[]> = (...args: T) => void;
