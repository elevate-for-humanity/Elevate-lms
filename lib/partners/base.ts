// lib/partners/base.ts
// Shared types + abstract base for all partner LMS APIs
export type PartnerType =
  | "hsi"
  | "certiport"
  | "careersafe"
  // "milady" removed — theory delivered via Elevate LMS
  | "jri"
  | "nrf"
  | "nds";
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
/**
 * Abstract class – each real partner (HSI, Certiport, etc.)
 * will implement these methods using THEIR official API docs.
 */
export class BasePartnerAPI {
  protected config: PartnerAPIConfig;
  protected partner: PartnerType;
  protected httpClient: any; // HTTP client for API calls
  constructor(partner: PartnerType, config: PartnerAPIConfig = {}) {
    this.partner = partner;
    this.config = config;
    this.httpClient = null; // Initialize as needed in subclasses
  }
  /**
   * Logging helper
   */
  protected log(data: any): void {
  }
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
  enrollInCourse(
    accountExternalId: string,
    courseExternalCode: string
  ): Promise<CourseEnrollment> {
    throw new Error('enrollInCourse must be implemented by subclass');
  }
  getProgress(
    externalEnrollmentId: string
  ): Promise<ProgressData | null> {
    throw new Error('getProgress must be implemented by subclass');
  }
  getCertificate(
    externalEnrollmentId: string
  ): Promise<CertificateData | null> {
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
