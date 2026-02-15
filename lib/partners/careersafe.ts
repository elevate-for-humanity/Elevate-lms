
// lib/partners/careersafe.ts
// CareerSafe API Integration
// OSHA 10, OSHA 30, Safety Training

import {
  BasePartnerAPI,
  StudentData,
  PartnerAccount,
  CourseEnrollment,
  ProgressData,
  CertificateData,
} from './base';
import { PartnerConfig } from './config';
import { PartnerAPIError } from './http-client';

export class CareerSafeAPI extends BasePartnerAPI {
  constructor(config: PartnerConfig) {
    super('careersafe', config);
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      ...super.getDefaultHeaders(),
      'X-API-Key': this.config.apiKey || '',
      'X-Organization-Code': this.config.orgId || '',
    };
  }

  async createAccount(student: StudentData): Promise<PartnerAccount> {
    this.log('info', 'Creating CareerSafe account', {
      studentId: student.id,
    });

    try {
      const response = await this.httpClient.post<{
        memberId: string;
        username: string;
        loginUrl: string;
        temporaryPassword?: string;
      }>('/api/members', {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        organizationCode: this.config.orgId,
      });

      this.log('info', 'CareerSafe account created', {
        externalId: response.data.memberId,
      });

      return {
        externalId: response.data.memberId,
        username: response.data.username,
        loginUrl: response.data.loginUrl,
        passwordPlaintext: response.data.temporaryPassword,
      };
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to create CareerSafe account', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async enrollInCourse(
    accountExternalId: string,
    courseExternalCode: string
  ): Promise<CourseEnrollment> {
    this.log('info', 'Enrolling in CareerSafe course', {
      accountExternalId,
      courseExternalCode,
    });

    try {
      const response = await this.httpClient.post<{
        enrollmentId: string;
        courseName: string;
        courseUrl: string;
      }>('/api/enrollments', {
        memberId: accountExternalId,
        courseCode: courseExternalCode,
        organizationCode: this.config.orgId,
      });

      this.log('info', 'CareerSafe enrollment created', {
        enrollmentId: response.data.enrollmentId,
      });

      return {
        externalEnrollmentId: response.data.enrollmentId,
        courseId: courseExternalCode,
        courseName: response.data.courseName,
        accessUrl: response.data.courseUrl,
      };
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to enroll in CareerSafe course', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async getProgress(
    externalEnrollmentId: string
  ): Promise<ProgressData | null> {
    this.log('info', 'Fetching CareerSafe progress', {
      externalEnrollmentId,
    });

    try {
      const response = await this.httpClient.get<{
        percentComplete: number;
        status: string;
        completionDate?: string;
        lastAccessDate?: string;
        chaptersCompleted: number;
        totalChapters: number;
      }>(`/api/enrollments/${externalEnrollmentId}/progress`);

      const completed = response.data.status === 'completed';

      return {
        percentage: response.data.percentComplete,
        completed,
        completedAt: response.data.completionDate
          ? new Date(response.data.completionDate)
          : undefined,
        lastAccessed: response.data.lastAccessDate
          ? new Date(response.data.lastAccessDate)
          : undefined,
        lessonsCompleted: response.data.chaptersCompleted,
        totalLessons: response.data.totalChapters,
      };
    } catch (error) { /* Error handled silently */ 
      if (error instanceof PartnerAPIError && error.statusCode === 404) {
        return null;
      }
      this.log('error', 'Failed to fetch CareerSafe progress', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async getCertificate(
    externalEnrollmentId: string
  ): Promise<CertificateData | null> {
    this.log('info', 'Fetching CareerSafe certificate', {
      externalEnrollmentId,
    });

    try {
      const response = await this.httpClient.get<{
        certificateId: string;
        cardNumber: string;
        issueDate: string;
        expirationDate: string;
        pdfUrl: string;
        verificationUrl: string;
      }>(`/api/enrollments/${externalEnrollmentId}/certificate`);

      return {
        certificateId: response.data.certificateId,
        certificateNumber: response.data.cardNumber,
        issuedDate: new Date(response.data.issueDate),
        expirationDate: new Date(response.data.expirationDate),
        downloadUrl: response.data.pdfUrl,
        verificationUrl: response.data.verificationUrl,
      };
    } catch (error) { /* Error handled silently */ 
      if (error instanceof PartnerAPIError && error.statusCode === 404) {
        return null;
      }
      this.log('error', 'Failed to fetch CareerSafe certificate', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async getSsoLaunchUrl(params: {
    accountExternalId: string;
    externalEnrollmentId: string;
    returnTo?: string;
  }): Promise<string> {
    this.log('info', 'Generating CareerSafe SSO launch URL', params);

    try {
      const response = await this.httpClient.post<{
        launchUrl: string;
        expiresAt: string;
      }>('/api/sso/launch', {
        memberId: params.accountExternalId,
        enrollmentId: params.externalEnrollmentId,
        returnUrl: params.returnTo,
      });

      return response.data.launchUrl;
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to generate CareerSafe SSO URL', {
        error: 'Operation failed',
      });
      throw error;
    }
  }
}
