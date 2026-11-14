import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

/** Document types accepted by POST /api/program-holder/documents/upload */
export const PROGRAM_HOLDER_UPLOAD_DOCUMENT_TYPES = [
  'business_license',
  'shop_license',
  'ein_verification',
  'employer_mou',
  'supervisor_designation',
  'ipla_packet',
  'syllabus',
  'license',
  'insurance',
  'accreditation',
  'instructor_credentials',
  'facility_photos',
  'mou',
  'hvac_license',
  'w9',
  'other',
] as const;

export type ProgramHolderUploadDocumentType =
  (typeof PROGRAM_HOLDER_UPLOAD_DOCUMENT_TYPES)[number];

export function isProgramHolderUploadDocumentType(
  value: string,
): value is ProgramHolderUploadDocumentType {
  return (PROGRAM_HOLDER_UPLOAD_DOCUMENT_TYPES as readonly string[]).includes(value);
}

export interface ProgramHolderDocumentRequirement {
  id: string;
  document_type: ProgramHolderUploadDocumentType;
  description: string;
  instructions: string;
  accepted_formats: string[];
  max_file_size: number;
  is_required?: boolean;
}

/** Static checklist — document_requirements has no program_holder role column in live schema. */
export const PROGRAM_HOLDER_DOCUMENT_REQUIREMENTS: ProgramHolderDocumentRequirement[] = [
  {
    id: 'business_license',
    document_type: 'business_license',
    description: 'Business License',
    instructions: 'Upload your current business license or registration.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
    is_required: true,
  },
  {
    id: 'shop_license',
    document_type: 'shop_license',
    description: 'Shop / Facility License',
    instructions: 'Upload your current shop or facility operating license.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
    is_required: true,
  },
  {
    id: 'ein_verification',
    document_type: 'ein_verification',
    description: 'EIN Verification (IRS Letter 147C or SS-4)',
    instructions: 'Upload your IRS EIN confirmation letter.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
    is_required: true,
  },
  {
    id: 'employer_mou',
    document_type: 'employer_mou',
    description: 'Signed Memorandum of Understanding',
    instructions: `Upload the signed MOU between your program and ${PLATFORM_DEFAULTS.orgName}.`,
    accepted_formats: ['pdf'],
    max_file_size: 10485760,
    is_required: true,
  },
  {
    id: 'supervisor_designation',
    document_type: 'supervisor_designation',
    description: 'Journeyworker / Supervisor Designation',
    instructions: 'Upload documentation designating your qualified journeyworker supervisor.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
  },
  {
    id: 'ipla_packet',
    document_type: 'ipla_packet',
    description: 'IPLA Licensing Packet',
    instructions: 'Upload your Indiana Professional Licensing Agency packet.',
    accepted_formats: ['pdf'],
    max_file_size: 10485760,
  },
];

export function programHolderDocumentStatus(row: {
  status?: string | null;
  approved?: boolean | null;
}): 'pending' | 'approved' | 'rejected' {
  if (row.status === 'approved' || row.status === 'rejected' || row.status === 'pending') {
    return row.status;
  }
  if (row.approved === true) return 'approved';
  if (row.approved === false) return 'rejected';
  return 'pending';
}
