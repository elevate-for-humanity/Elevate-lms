import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { DocumentUploadForm } from '@/components/documents/DocumentUploadForm';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Upload Document | Employer Portal',
  description: 'Upload a new document',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employer/documents/upload',
  },
};

// Employer document types — document_requirements table is program-scoped (no role column).
const EMPLOYER_REQUIREMENTS = [
  {
    id: 'coi_general_liability',
    document_type: 'coi_general_liability',
    description: 'Certificate of Insurance — General Liability',
    instructions: 'Upload your current general liability insurance certificate.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
  },
  {
    id: 'coi_workers_comp',
    document_type: 'coi_workers_comp',
    description: "Certificate of Insurance — Workers' Compensation",
    instructions: "Upload your current workers' compensation insurance certificate.",
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
  },
  {
    id: 'business_license',
    document_type: 'business_license',
    description: 'Business License',
    instructions: 'Upload your current business license or registration.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
  },
  {
    id: 'ein_verification',
    document_type: 'ein_verification',
    description: 'EIN Verification (IRS Letter 147C or SS-4)',
    instructions: 'Upload your IRS EIN confirmation letter.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
  },
  {
    id: 'employer_mou',
    document_type: 'employer_mou',
    description: 'Signed Memorandum of Understanding',
    instructions: `Upload the signed MOU between your company and ${PLATFORM_DEFAULTS.orgName}.`,
    accepted_formats: ['pdf'],
    max_file_size: 10485760,
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
    id: 'worksite_verification',
    document_type: 'worksite_verification',
    description: 'Worksite Verification',
    instructions: 'Upload documentation verifying your approved apprenticeship worksite.',
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size: 10485760,
  },
];

export default async function UploadDocumentPage() {
  await requireRole(['employer', 'admin']);

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b py-8">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-black mb-2">Upload Document</h1>
          <p className="text-lg text-black">Upload a required document to complete your profile</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <DocumentUploadForm requirements={EMPLOYER_REQUIREMENTS} />
      </div>
    </div>
  );
}
