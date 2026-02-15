
// lib/partners/nrf.ts
// NRF RISE Up API Integration
// Retail Industry Skills and Education

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

export class NrfAPI extends BasePartnerAPI {
  constructor(config: PartnerConfig) {
    super('nrf', config);
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      ...super.getDefaultHeaders(),
      Authorization: `Bearer ${this.config.apiKey}`,
      'X-Partner-Id': this.config.orgId || '',
    };
  }

  async createAccount(student: StudentData): Promise<PartnerAccount> {
    this.log('info', 'Creating NRF RISE Up account', {
      studentId: student.id,
    });

    try {
      const response = await this.httpClient.post<{
        learnerId: string;
        username: string;
        platformUrl: string;
      }>('/api/v1/learners', {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        partnerId: this.config.orgId,
      });

      this.log('info', 'NRF RISE Up account created', {
        externalId: response.data.learnerId,
      });

      return {
        externalId: response.data.learnerId,
        username: response.data.username,
        loginUrl: response.data.platformUrl,
      };
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to create NRF RISE Up account', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async enrollInCourse(
    accountExternalId: string,
    courseExternalCode: string
  ): Promise<CourseEnrollment> {
    this.log('info', 'Enrolling in NRF RISE Up course', {
      accountExternalId,
      courseExternalCode,
    });

    try {
      const response = await this.httpClient.post<{
        enrollmentId: string;
        courseName: string;
        courseUrl: string;
      }>('/api/v1/enrollments', {
        learnerId: accountExternalId,
        courseCode: courseExternalCode,
      });

      this.log('info', 'NRF RISE Up enrollment created', {
        enrollmentId: response.data.enrollmentId,
      });

      return {
        externalEnrollmentId: response.data.enrollmentId,
        courseId: courseExternalCode,
        courseName: response.data.courseName,
        accessUrl: response.data.courseUrl,
      };
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to enroll in NRF RISE Up course', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async getProgress(
    externalEnrollmentId: string
  ): Promise<ProgressData | null> {
    this.log('info', 'Fetching NRF RISE Up progress', {
      externalEnrollmentId,
    });

    try {
      const response = await this.httpClient.get<{
        completionPercentage: number;
        status: string;
        completedAt?: string;
        lastAccessedAt?: string;
        lessonsCompleted: number;
        totalLessons: number;
      }>(`/api/v1/enrollments/${externalEnrollmentId}/progress`);

      const completed = response.data.status === 'completed';

      return {
        percentage: response.data.completionPercentage,
        completed,
        completedAt: response.data.completedAt
          ? new Date(response.data.completedAt)
          : undefined,
        lastAccessed: response.data.lastAccessedAt
          ? new Date(response.data.lastAccessedAt)
          : undefined,
        lessonsCompleted: response.data.lessonsCompleted,
        totalLessons: response.data.totalLessons,
      };
    } catch (error) { /* Error handled silently */ 
      if (error instanceof PartnerAPIError && error.statusCode === 404) {
        return null;
      }
      this.log('error', 'Failed to fetch NRF RISE Up progress', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async getCertificate(
    externalEnrollmentId: string
  ): Promise<CertificateData | null> {
    this.log('info', 'Fetching NRF RISE Up certificate', {
      externalEnrollmentId,
    });

    try {
      const response = await this.httpClient.get<{
        certificateId: string;
        credentialId: string;
        issuedDate: string;
        downloadUrl: string;
        verificationUrl: string;
      }>(`/api/v1/enrollments/${externalEnrollmentId}/certificate`);

      return {
        certificateId: response.data.certificateId,
        certificateNumber: response.data.credentialId,
        issuedDate: new Date(response.data.issuedDate),
        downloadUrl: response.data.downloadUrl,
        verificationUrl: response.data.verificationUrl,
      };
    } catch (error) { /* Error handled silently */ 
      if (error instanceof PartnerAPIError && error.statusCode === 404) {
        return null;
      }
      this.log('error', 'Failed to fetch NRF RISE Up certificate', {
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
    this.log('info', 'Generating NRF RISE Up SSO launch URL', params);

    try {
      const response = await this.httpClient.post<{
        ssoUrl: string;
        expiresIn: number;
      }>('/api/v1/sso/token', {
        learnerId: params.accountExternalId,
        enrollmentId: params.externalEnrollmentId,
        returnUrl: params.returnTo,
      });

      return response.data.ssoUrl;
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to generate NRF RISE Up SSO URL', {
        error: 'Operation failed',
      });
      throw error;
    }
  }
}
