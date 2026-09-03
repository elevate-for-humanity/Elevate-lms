// Types for the certification authorization pipeline.
//
// Covers both scenarios:
//   A) External exam only (ICAADA, CompTIA, Indiana BMV)
//   B) External course + exam (CareerSafe, OSHA 10)
//
// The `delivery` field on credential_registry drives which email template fires:
//   internal → Elevate proctors on-site, no external send
//   external → exam voucher + scheduling link
//   hybrid   → external platform link (CareerSafe, OSHA online)

export type CertRequestStatus =
  | 'pending_completion'
  | 'awaiting_payment'
  | 'payment_failed'
  | 'exam_authorized'
  | 'exam_forwarded'
  | 'awaiting_upload'
  | 'upload_pending'
  | 'upload_rejected'
  | 'certificate_issued';

export type UploadType = 'prerequisite' | 'exam_result';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
export type CredentialDelivery = 'internal' | 'external' | 'hybrid';

export interface ReadinessResult {
  eligible: boolean;
  missing: string[];
  progress: {
    lessonsComplete: number;
    lessonsTotal: number;
    quizzesPassed: number;
    quizzesTotal: number;
    practicalComplete: boolean;
  };
}

export interface CertificationRequest {
  id: string;
  userId: string;
  programId: string;
  credentialId: string;
  status: CertRequestStatus;
  providerId: string | null;
  providerName: string | null;
  authorizationCode: string | null;
  authorizedAt: string | null;
  authorizationExpiresAt: string | null;
  forwardedAt: string | null;
  examFeePaymentId: string | null;
  examResultUploadId: string | null;
  certificateId: string | null;
  certificateIssuedAt: string | null;
  createdAt: string;
}

export interface InitiateResult {
  requestId: string;
  status: CertRequestStatus;
  paymentIntentId?: string;
}
