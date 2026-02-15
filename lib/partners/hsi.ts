
// lib/partners/hsi.ts
// HSI (Health & Safety Institute) API Integration
// CPR, AED, First Aid, Emergency Medical Responder Training

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

interface HsiCreateAccountRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  organizationId: string;
}

interface HsiEnrollmentRequest {
  studentId: string;
  courseCode: string;
  enrollmentType: 'rsv' | 'traditional' | 'blended';
}

export class HsiAPI extends BasePartnerAPI {
  constructor(config: PartnerConfig) {
    super('hsi', config);
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      ...super.getDefaultHeaders(),
      'X-API-Key': this.config.apiKey || '',
      'X-Organization-Id': this.config.orgId || '',
    };
  }

  async createAccount(student: StudentData): Promise<PartnerAccount> {
    this.log('info', 'Creating HSI account', { studentId: student.id });

    try {
      const response = await this.httpClient.post<{
        studentId: string;
        username: string;
        loginUrl: string;
      }>('/api/v1/students', {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        dateOfBirth: student.dateOfBirth,
        organizationId: this.config.orgId,
      });

      this.log('info', 'HSI account created', {
        externalId: response.data.studentId,
      });

      return {
        externalId: response.data.studentId,
        username: response.data.username,
        loginUrl: response.data.loginUrl,
      };
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to create HSI account', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async enrollInCourse(
    accountExternalId: string,
    courseExternalCode: string
  ): Promise<CourseEnrollment> {
    this.log('info', 'Enrolling in HSI course', {
      accountExternalId,
      courseExternalCode,
    });

    try {
      // Determine enrollment type based on course code
      const enrollmentType = courseExternalCode.includes('RSV')
        ? 'rsv'
        : 'blended';

      const response = await this.httpClient.post<{
        enrollmentId: string;
        courseName: string;
        accessUrl: string;
      }>('/api/v1/enrollments', {
        studentId: accountExternalId,
        courseCode: courseExternalCode,
        enrollmentType,
      });

      this.log('info', 'HSI enrollment created', {
        enrollmentId: response.data.enrollmentId,
      });

      return {
        externalEnrollmentId: response.data.enrollmentId,
        courseId: courseExternalCode,
        courseName: response.data.courseName,
        accessUrl: response.data.accessUrl,
      };
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to enroll in HSI course', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async getProgress(
    externalEnrollmentId: string
  ): Promise<ProgressData | null> {
    this.log('info', 'Fetching HSI progress', { externalEnrollmentId });

    try {
      const response = await this.httpClient.get<{
        percentage: number;
        status: string;
        completedAt?: string;
        lastAccessed?: string;
        modulesCompleted: number;
        totalModules: number;
      }>(`/api/v1/enrollments/${externalEnrollmentId}/progress`);

      const completed = response.data.status === 'completed';

      return {
        percentage: response.data.percentage,
        completed,
        completedAt: response.data.completedAt
          ? new Date(response.data.completedAt)
          : undefined,
        lastAccessed: response.data.lastAccessed
          ? new Date(response.data.lastAccessed)
          : undefined,
        lessonsCompleted: response.data.modulesCompleted,
        totalLessons: response.data.totalModules,
      };
    } catch (error) { /* Error handled silently */ 
      if (error instanceof PartnerAPIError && error.statusCode === 404) {
        return null;
      }
      this.log('error', 'Failed to fetch HSI progress', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async getCertificate(
    externalEnrollmentId: string
  ): Promise<CertificateData | null> {
    this.log('info', 'Fetching HSI certificate', { externalEnrollmentId });

    try {
      const response = await this.httpClient.get<{
        certificateId: string;
        certificateNumber: string;
        issuedDate: string;
        expirationDate: string;
        downloadUrl: string;
        verificationUrl: string;
      }>(`/api/v1/enrollments/${externalEnrollmentId}/certificate`);

      return {
        certificateId: response.data.certificateId,
        certificateNumber: response.data.certificateNumber,
        issuedDate: new Date(response.data.issuedDate),
        expirationDate: new Date(response.data.expirationDate),
        downloadUrl: response.data.downloadUrl,
        verificationUrl: response.data.verificationUrl,
      };
    } catch (error) { /* Error handled silently */ 
      if (error instanceof PartnerAPIError && error.statusCode === 404) {
        return null;
      }
      this.log('error', 'Failed to fetch HSI certificate', {
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
    this.log('info', 'Generating HSI SSO launch URL', params);

    try {
      const response = await this.httpClient.post<{
        launchUrl: string;
        expiresAt: string;
      }>('/api/v1/sso/launch', {
        studentId: params.accountExternalId,
        enrollmentId: params.externalEnrollmentId,
        returnUrl: params.returnTo,
      });

      return response.data.launchUrl;
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to generate HSI SSO URL', {
        error: 'Operation failed',
      });
      throw error;
    }
  }
}
