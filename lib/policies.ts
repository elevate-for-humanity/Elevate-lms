/**
 * Central policy registry for compliance references
 * All policies should be documented and linked from features
 */

export const POLICIES = {
  // Student Data & Privacy
  FERPA: {
    name: 'FERPA Privacy Policy',
    url: '/policies/ferpa',
    description: 'Family Educational Rights and Privacy Act compliance',
  },
  PRIVACY: {
    name: 'Privacy Policy',
    url: '/policies/privacy',
    description: 'How we collect, use, and protect your data',
  },
  TERMS: {
    name: 'Terms of Service',
    url: '/policies/terms',
    description: 'Terms and conditions for using our platform',
  },

  // Funding & Eligibility
  WIOA: {
    name: 'WIOA Eligibility Policy',
    url: '/policies/wioa',
    description: 'Workforce Innovation and Opportunity Act requirements',
  },
  WRG: {
    name: 'Workforce Ready Grant Policy',
    url: '/policies/wrg',
    description: 'Indiana Workforce Ready Grant eligibility and compliance',
  },
  JRI: {
    name: 'Job Ready Indy Policy',
    url: '/policies/jri',
    description: 'JRI funding eligibility and requirements',
  },
  FUNDING_VERIFICATION: {
    name: 'Funding Verification Policy',
    url: '/policies/funding-verification',
    description: 'Requirements for verifying student funding sources',
  },

  // Academic & Enrollment
  ADMISSIONS: {
    name: 'Admissions Policy',
    url: '/policies/admissions',
    description: 'Application and enrollment requirements',
  },
  ATTENDANCE: {
    name: 'Attendance Policy',
    url: '/policies/attendance',
    description: 'Attendance requirements and tracking',
  },
  ACADEMIC_INTEGRITY: {
    name: 'Academic Integrity Policy',
    url: '/policies/academic-integrity',
    description: 'Standards for honest academic work',
  },
  PROGRESS: {
    name: 'Academic Progress Policy',
    url: '/policies/progress',
    description: 'Requirements for satisfactory academic progress',
  },
  STUDENT_CODE: {
    name: 'Student Code of Conduct',
    url: '/policies/student-code',
    description: 'Expected behavior and conduct standards',
  },

  // Credentials & Certificates
  CREDENTIAL: {
    name: 'Credential Policy',
    url: '/policies/credentials',
    description: 'Certificate issuance and verification standards',
  },
  VERIFICATION: {
    name: 'Credential Verification Policy',
    url: '/policies/verification',
    description: 'How to verify issued credentials',
  },
  REVOCATION: {
    name: 'Credential Revocation Policy',
    url: '/policies/revocation',
    description: 'Circumstances and process for credential revocation',
  },

  // Community & Content
  COMMUNITY_GUIDELINES: {
    name: 'Community Guidelines',
    url: '/policies/community-guidelines',
    description: 'Standards for respectful community interaction',
  },
  CONTENT_POLICY: {
    name: 'Content Policy',
    url: '/policies/content',
    description: 'Acceptable content and posting standards',
  },
  MODERATION: {
    name: 'Moderation Policy',
    url: '/policies/moderation',
    description: 'How we moderate community content',
  },
  EDITORIAL: {
    name: 'Editorial Guidelines',
    url: '/policies/editorial',
    description: 'Standards for published content',
  },
  COPYRIGHT: {
    name: 'Copyright Policy',
    url: '/policies/copyright',
    description: 'Copyright and intellectual property rights',
  },

  // Technology & AI
  AI_USAGE: {
    name: 'AI Usage Policy',
    url: '/policies/ai-usage',
    description: 'Guidelines for AI tutor and AI-generated content',
  },
  ACCEPTABLE_USE: {
    name: 'Acceptable Use Policy',
    url: '/policies/acceptable-use',
    description: 'Acceptable use of platform technology',
  },
  DATA_RETENTION: {
    name: 'Data Retention Policy',
    url: '/policies/data-retention',
    description: 'How long we retain different types of data',
  },

  // Grants & Federal Compliance
  GRANT_APPLICATION: {
    name: 'Grant Application Policy',
    url: '/policies/grant-application',
    description: 'Process and requirements for grant applications',
  },
  FEDERAL_COMPLIANCE: {
    name: 'Federal Compliance Policy',
    url: '/policies/federal-compliance',
    description: 'Compliance with federal regulations and requirements',
  },
  SAM_GOV_ELIGIBILITY: {
    name: 'SAM.gov Eligibility Criteria',
    url: '/policies/sam-gov-eligibility',
    description: 'Eligibility requirements for federal opportunities',
  },

  // Response & Service
  RESPONSE_SLA: {
    name: 'Response Time Policy',
    url: '/policies/response-sla',
    description: 'Expected response times for inquiries',
  },
  PRIVACY_NOTICE: {
    name: 'Privacy Notice',
    url: '/policies/privacy-notice',
    description: 'Notice of data collection and use',
  },
} as const;

/**
 * Get policies for a specific feature
 */
export function getPoliciesForFeature(feature: string) {
  const policyMap: Record<string, (typeof POLICIES)[keyof typeof POLICIES][]> =
    {
      application: [
        POLICIES.WIOA,
        POLICIES.WRG,
        POLICIES.JRI,
        POLICIES.ADMISSIONS,
      ],
      registration: [
        POLICIES.FERPA,
        POLICIES.PRIVACY,
        POLICIES.TERMS,
        POLICIES.STUDENT_CODE,
      ],
      enrollment: [
        POLICIES.WIOA,
        POLICIES.WRG,
        POLICIES.FUNDING_VERIFICATION,
        POLICIES.ATTENDANCE,
      ],
      lesson: [
        POLICIES.ATTENDANCE,
        POLICIES.ACADEMIC_INTEGRITY,
        POLICIES.PROGRESS,
      ],
      certificate: [
        POLICIES.CREDENTIAL,
        POLICIES.VERIFICATION,
        POLICIES.REVOCATION,
      ],
      forum: [
        POLICIES.COMMUNITY_GUIDELINES,
        POLICIES.CONTENT_POLICY,
        POLICIES.MODERATION,
      ],
      ai_tutor: [POLICIES.AI_USAGE, POLICIES.PRIVACY, POLICIES.ACCEPTABLE_USE],
      contact: [
        POLICIES.PRIVACY_NOTICE,
        POLICIES.RESPONSE_SLA,
        POLICIES.DATA_RETENTION,
      ],
      sam_gov: [
        POLICIES.GRANT_APPLICATION,
        POLICIES.FEDERAL_COMPLIANCE,
        POLICIES.SAM_GOV_ELIGIBILITY,
      ],
      blog: [POLICIES.CONTENT_POLICY, POLICIES.EDITORIAL, POLICIES.COPYRIGHT],
    };

  return policyMap[feature] || [];
}
