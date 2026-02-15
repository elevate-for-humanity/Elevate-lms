
// lib/partners/nds.ts
// NDS (National Drug Screening) API Integration
// Drug-Free Workplace Training, DOT/CDL Drug & Alcohol Awareness

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

export class NdsAPI extends BasePartnerAPI {
  constructor(config: PartnerConfig) {
    super('nds', config);
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      ...super.getDefaultHeaders(),
      'X-API-Key': this.config.apiKey || '',
      'X-Client-Id': this.config.orgId || '',
    };
  }

  async createAccount(student: StudentData): Promise<PartnerAccount> {
    this.log('info', 'Creating NDS account', { studentId: student.id });

    try {
      const response = await this.httpClient.post<{
        participantId: string;
        username: string;
        portalUrl: string;
      }>('/api/participants', {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        clientId: this.config.orgId,
      });

      this.log('info', 'NDS account created', {
        externalId: response.data.participantId,
      });

      return {
        externalId: response.data.participantId,
        username: response.data.username,
        loginUrl: response.data.portalUrl,
      };
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to create NDS account', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async enrollInCourse(
    accountExternalId: string,
    courseExternalCode: string
  ): Promise<CourseEnrollment> {
    this.log('info', 'Enrolling in NDS course', {
      accountExternalId,
      courseExternalCode,
    });

    try {
      const response = await this.httpClient.post<{
        enrollmentId: string;
        courseName: string;
        trainingUrl: string;
      }>('/api/enrollments', {
        participantId: accountExternalId,
        courseCode: courseExternalCode,
      });

      this.log('info', 'NDS enrollment created', {
        enrollmentId: response.data.enrollmentId,
      });

      return {
        externalEnrollmentId: response.data.enrollmentId,
        courseId: courseExternalCode,
        courseName: response.data.courseName,
        accessUrl: response.data.trainingUrl,
      };
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to enroll in NDS course', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async getProgress(
    externalEnrollmentId: string
  ): Promise<ProgressData | null> {
    this.log('info', 'Fetching NDS progress', { externalEnrollmentId });

    try {
      const response = await this.httpClient.get<{
        percentComplete: number;
        status: string;
        completionDate?: string;
        lastAccessDate?: string;
        sectionsCompleted: number;
        totalSections: number;
      }>(`/api/enrollments/${externalEnrollmentId}/status`);

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
        lessonsCompleted: response.data.sectionsCompleted,
        totalLessons: response.data.totalSections,
      };
    } catch (error) { /* Error handled silently */ 
      if (error instanceof PartnerAPIError && error.statusCode === 404) {
        return null;
      }
      this.log('error', 'Failed to fetch NDS progress', {
        error: 'Operation failed',
      });
      throw error;
    }
  }

  async getCertificate(
    externalEnrollmentId: string
  ): Promise<CertificateData | null> {
    this.log('info', 'Fetching NDS certificate', { externalEnrollmentId });

    try {
      const response = await this.httpClient.get<{
        certificateId: string;
        certificateNumber: string;
        issuedDate: string;
        expirationDate: string;
        downloadUrl: string;
      }>(`/api/enrollments/${externalEnrollmentId}/certificate`);

      return {
        certificateId: response.data.certificateId,
        certificateNumber: response.data.certificateNumber,
        issuedDate: new Date(response.data.issuedDate),
        expirationDate: new Date(response.data.expirationDate),
        downloadUrl: response.data.downloadUrl,
      };
    } catch (error) { /* Error handled silently */ 
      if (error instanceof PartnerAPIError && error.statusCode === 404) {
        return null;
      }
      this.log('error', 'Failed to fetch NDS certificate', {
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
    this.log('info', 'Generating NDS SSO launch URL', params);

    try {
      const response = await this.httpClient.post<{
        launchUrl: string;
        expiresAt: string;
      }>('/api/sso/launch', {
        participantId: params.accountExternalId,
        enrollmentId: params.externalEnrollmentId,
        returnUrl: params.returnTo,
      });

      return response.data.launchUrl;
    } catch (error) { /* Error handled silently */ 
      this.log('error', 'Failed to generate NDS SSO URL', {
        error: 'Operation failed',
      });
      throw error;
    }
  }
}
