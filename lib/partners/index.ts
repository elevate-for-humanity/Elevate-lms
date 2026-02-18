// lib/partners/index.ts
import {
  BasePartnerAPI,
  PartnerAPIConfig,
  PartnerType,
  StudentData,
  PartnerAccount,
  CourseEnrollment,
  ProgressData,
  CertificateData,
} from "./base";

/**
 * TEMP STUB IMPLEMENTATION
 * ------------------------
 * These stubs let the automation system work end-to-end NOW.
 * You / a dev will later replace each stub with real API
 * calls using the vendor's documentation.
 */

class StubPartnerAPI extends BasePartnerAPI {
  async createAccount(student: StudentData): Promise<PartnerAccount> {
    // In production: call real partner API here
    const fakeId = `${this.partner}_${student.id}`;
    return {
      externalId: fakeId,
      username: student.email,
      loginUrl: "https://partner.elevateforhumanity.org/login",
      passwordPlaintext: undefined,
    };
  }

  async enrollInCourse(
    accountExternalId: string,
    courseExternalCode: string
  ): Promise<CourseEnrollment> {
    // In production: call real partner API here
    return {
      externalEnrollmentId: `${this.partner}_${accountExternalId}_${courseExternalCode}`,
      courseId: courseExternalCode,
      courseName: `Course ${courseExternalCode}`,
      accessUrl: "https://partner.elevateforhumanity.org/course/launch",
    };
  }

  async getProgress(
    externalEnrollmentId: string
  ): Promise<ProgressData | null> {
    // In production: call real partner API here
    // Stub: mark everything as "in progress"
    return {
      percentage: 50,
      completed: false,
      lastAccessed: new Date(),
      lessonsCompleted: 3,
      totalLessons: 6,
    };
  }

  async getCertificate(
    externalEnrollmentId: string
  ): Promise<CertificateData | null> {
    // In production: call real partner API here
    // Stub: no cert yet
    return null;
  }

  async getSsoLaunchUrl(params: {
    accountExternalId: string;
    externalEnrollmentId: string;
    returnTo?: string;
  }): Promise<string> {
    // In production: generate real SSO link
    return `https://partner.elevateforhumanity.org/sso/launch?enrollment=${encodeURIComponent(
      params.externalEnrollmentId
    )}`;
  }
}

export function getPartnerClient(partner: PartnerType): BasePartnerAPI {
  // Later: you can switch specific partners to real client classes
  // e.g. if (partner === "hsi") return new HsiApi(configFromEnv);
  const config: PartnerAPIConfig = {
    baseUrl: process.env.PARTNER_API_BASE_URL,
  };
  return new StubPartnerAPI(partner, config);
}

export * from "./base";
