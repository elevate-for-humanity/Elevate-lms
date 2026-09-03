// lib/partners/base.ts
// Shared types + abstract base for all partner LMS APIs
export type PartnerType =
  | 'hsi'
  | 'certiport'
  | 'careersafe'
  // "milady" removed — theory delivered via Elevate LMS
  | 'jri'
  | 'nrf'
  | 'nds';
export interface StudentData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}
export interface PartnerAccount {
  externalId: string;
  username: string;
  loginUrl: string;
  passwordPlaintext?: string;
}
export interface CourseEnrollment {
  externalEnrollmentId: string;
  courseId: string;
  courseName?: string;
  accessUrl?: string;
}
export interface ProgressData {
  percentage: number;
  completed: boolean;
  completedAt?: Date;
  lastAccessed?: Date;
  lessonsCompleted?: number;
  totalLessons?: number;
}
export interface CertificateData {
  certificateId: string;
  certificateNumber?: string;
  issuedDate: Date;
  expirationDate?: Date;
  downloadUrl: string;
  verificationUrl?: string;
}
export interface PartnerAPIConfig {
  baseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  orgId?: string;
}
/** Minimal typed interface for the HTTP client used by partner subclasses. */
export interface PartnerHttpClient {
  get<T = unknown>(path: string, params?: Record<string, any>): Promise<{ data: T }>;
  post<T = unknown>(path: string, body?: Record<string, any>): Promise<{ data: T }>;
  put<T = unknown>(path: string, body?: Record<string, any>): Promise<{ data: T }>;
  patch<T = unknown>(path: string, body?: Record<string, any>): Promise<{ data: T }>;
  delete<T = unknown>(path: string): Promise<{ data: T }>;
}

/**
 * Abstract class – each real partner (HSI, Certiport, etc.)
 * will implement these methods using THEIR official API docs.
 */
export class BasePartnerAPI {
  protected config: PartnerAPIConfig;
  protected partner: PartnerType;
  protected httpClient: PartnerHttpClient;
  constructor(partner: PartnerType, config: PartnerAPIConfig = {}) {
    this.partner = partner;
    this.config = config;
    this.httpClient = null as unknown as PartnerHttpClient; // set by subclass before use
  }
  /**
   * Logging helper
   */
  protected log(levelOrData: any, message?: string, data?: any): void {}
  /**
   * Get default headers for API requests
   */
  protected getDefaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'ElevateForHumanity/1.0',
    };
  }
  createAccount(student: StudentData): Promise<PartnerAccount> {
    throw new Error('createAccount must be implemented by subclass');
  }
  enrollInCourse(accountExternalId: string, courseExternalCode: string): Promise<CourseEnrollment> {
    throw new Error('enrollInCourse must be implemented by subclass');
  }
  getProgress(externalEnrollmentId: string): Promise<ProgressData | null> {
    throw new Error('getProgress must be implemented by subclass');
  }
  getCertificate(externalEnrollmentId: string): Promise<CertificateData | null> {
    throw new Error('getCertificate must be implemented by subclass');
  }
  /**
   * Create SSO / deep link so student can jump straight into the course
   */
  getSsoLaunchUrl(params: {
    accountExternalId: string;
    externalEnrollmentId: string;
    returnTo?: string;
  }): Promise<string> {
    throw new Error('getSsoLaunchUrl must be implemented by subclass');
  }
}
