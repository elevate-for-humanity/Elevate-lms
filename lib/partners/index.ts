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
 * Partner API Integration Layer
 * 
 * STATUS: Stub implementation — returns placeholder data.
 * 
 * Each partner (NDS, CareerSafe, etc.) will need a concrete
 * implementation that calls their vendor API. The stub allows
 * the enrollment/automation pipeline to function without
 * blocking on vendor integration timelines.
 * 
 * To connect a real partner:
 *   1. Create a class extending BasePartnerAPI
 *   2. Implement createAccount, enrollInCourse, getProgress, getCertificate, getSSOLink
 *   3. Add the partner type to getPartnerAPI()
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
