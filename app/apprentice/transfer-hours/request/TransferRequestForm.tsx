'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface ExistingDocument {
  id: string;
  document_type: string;
  file_name: string;
  status: string;
}

interface Props {
  apprenticeId: string;
  programName: string;
  maxTransferHours: number;
  existingDocuments: ExistingDocument[];
}

const TRANSFER_DOCUMENT_TYPES = [
  {
    type: 'school_transcript',
    label: 'School Transcript',
    description: 'Official transcript from barber/cosmetology school',
  },
  {
    type: 'certificate',
    label: 'Training Certificate',
    description: 'Certificate of completion from previous training program',
  },
  {
    type: 'out_of_state_license',
    label: 'Out-of-State License',
    description: 'Valid barber/cosmetology license from another state',
  },
  {
    type: 'employment_verification',
    label: 'Employment Verification',
    description: 'Letter from previous employer verifying work experience',
  },
];

export default function TransferRequestForm({
  apprenticeId,
  programName,
  maxTransferHours,
  existingDocuments,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] =
    useState<ExistingDocument[]>(existingDocuments);

  const [formData, setFormData] = useState({
    source: '',
    hoursRequested: '',
    description: '',
    previousEmployer: '',
    employmentDates: '',
  });

  const handleDocumentUpload = async (
    documentType: string,
    file: File
  ) => {
    // Validate file
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF and image files are allowed');
      return;
    }

    setError(null);
    setUploading(documentType);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('documentType', documentType);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload document');
      }

      const data = await response.json();
      setUploadedDocs((prev) => [
        ...prev,
        {
          id: data.document.id,
          document_type: documentType,
          file_name: file.name,
          status: 'pending',
        },
      ]);
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one document uploaded
    if (uploadedDocs.length === 0) {
      setError(
        'Please upload at least one supporting document before submitting'
      );
      return;
    }

    // Validate hours
    const hours = parseInt(formData.hoursRequested);
    if (isNaN(hours) || hours <= 0 || hours > maxTransferHours) {
      setError(`Hours must be between 1 and ${maxTransferHours}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/apprentice/transfer-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apprenticeId,
          source: formData.source,
          hoursRequested: hours,
          description: formData.description,
          previousEmployer: formData.previousEmployer,
          employmentDates: formData.employmentDates,
          documentIds: uploadedDocs.map((d) => d.id),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit transfer request');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/apprentice/transfer-hours');
      }, 2000);
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getUploadedDoc = (type: string) =>
    uploadedDocs.find((d) => d.document_type === type);

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-900 mb-2">
          Request Submitted!
        </h2>
        <p className="text-green-700 mb-4">
          Your transfer request has been submitted for review. You will be
          notified once it has been processed.
        </p>
        <p className="text-green-600 text-sm">Redirecting...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Transfer Details */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Transfer Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source of Hours *
            </label>
            <select
              value={formData.source}
              onChange={(e) =>
                setFormData({ ...formData, source: e.target.value })
              }
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            >
              <option value="">Select source...</option>
              <option value="barber_school">Barber School</option>
              <option value="cosmetology_school">Cosmetology School</option>
              <option value="out_of_state_license">Out-of-State License</option>
              <option value="previous_apprenticeship">
                Previous Apprenticeship
              </option>
              <option value="work_experience">Related Work Experience</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hours Requested *
            </label>
            <input
              type="number"
              value={formData.hoursRequested}
              onChange={(e) =>
                setFormData({ ...formData, hoursRequested: e.target.value })
              }
              required
              min="1"
              max={maxTransferHours}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder={`Maximum: ${maxTransferHours} hours`}
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum transferable: {maxTransferHours} hours (50% of program
              total)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Previous Employer/School Name
            </label>
            <input
              type="text"
              value={formData.previousEmployer}
              onChange={(e) =>
                setFormData({ ...formData, previousEmployer: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder="Name of school or employer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dates of Training/Employment
            </label>
            <input
              type="text"
              value={formData.employmentDates}
              onChange={(e) =>
                setFormData({ ...formData, employmentDates: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder="e.g., January 2022 - December 2023"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder="Describe your previous training or experience..."
            />
          </div>
        </div>
      </div>

      {/* Required Documents */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-2">Supporting Documents</h2>
        <p className="text-gray-600 text-sm mb-6">
          Upload at least one document to support your transfer request. All
          documents will be verified before approval.
        </p>

        <div className="space-y-4">
          {TRANSFER_DOCUMENT_TYPES.map((docType) => {
            const uploaded = getUploadedDoc(docType.type);
            const isUploading = uploading === docType.type;

            return (
              <div
                key={docType.type}
                className={`border rounded-lg p-4 ${
                  uploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      uploaded ? 'bg-green-100' : 'bg-gray-100'
                    }`}
                  >
                    {uploaded ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">
                      {docType.label}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {docType.description}
                    </p>

                    {uploaded ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-700 font-medium">
                          {uploaded.file_name}
                        </span>
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          Pending Review
                        </span>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id={`file-${docType.type}`}
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(docType.type, file);
                          }}
                          className="hidden"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor={`file-${docType.type}`}
                          className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                            isUploading
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {uploadedDocs.length === 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> At least one supporting document is
              required to submit a transfer request.
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <a
          href="/apprentice/transfer-hours"
          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={loading || uploadedDocs.length === 0}
          className="px-6 py-3 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Transfer Request'
          )}
        </button>
      </div>
    </form>
  );
}
