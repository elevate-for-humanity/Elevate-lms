'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, X, Loader2 } from 'lucide-react';

interface UploadedDocument {
  id: string;
  document_type: string;
  file_name: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface DocumentRequirement {
  type: string;
  label: string;
  description: string;
  required: boolean;
}

interface Props {
  requirements: DocumentRequirement[];
  uploadedDocuments: UploadedDocument[];
  onUpload: (documentType: string, file: File) => Promise<void>;
  onRemove?: (documentId: string) => Promise<void>;
}

export default function EnrollmentDocumentStep({
  requirements,
  uploadedDocuments,
  onUpload,
  onRemove,
}: Props) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const getUploadedDoc = (type: string) =>
    uploadedDocuments.find((d) => d.document_type === type);

  const handleFileSelect = useCallback(
    async (documentType: string, file: File) => {
      // Validate file
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
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
        await onUpload(documentType, file);
      } catch (err: any) {
        setError('Failed to upload document');
      } finally {
        setUploading(null);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (documentType: string, e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(documentType, file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (documentType: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(documentType);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const requiredCount = requirements.filter((r) => r.required).length;
  const uploadedRequiredCount = requirements.filter(
    (r) => r.required && getUploadedDoc(r.type)
  ).length;
  const allRequiredUploaded = uploadedRequiredCount === requiredCount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Required Documents</h2>
        <p className="text-gray-600 text-sm">
          Upload the following documents to complete enrollment. Documents will be
          reviewed by staff before activation.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-brand-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-brand-red-600 hover:text-brand-red-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Progress indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Upload Progress
          </span>
          <span className="text-sm text-gray-600">
            {uploadedRequiredCount} of {requiredCount} required
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              allRequiredUploaded ? 'bg-brand-green-500' : 'bg-brand-orange-500'
            }`}
            style={{
              width: `${requiredCount > 0 ? (uploadedRequiredCount / requiredCount) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Document upload cards */}
      <div className="space-y-4">
        {requirements.map((req) => {
          const uploaded = getUploadedDoc(req.type);
          const isUploading = uploading === req.type;
          const isDragOver = dragOver === req.type;

          return (
            <div
              key={req.type}
              className={`border rounded-lg p-4 transition-colors ${
                uploaded
                  ? 'border-brand-green-200 bg-brand-green-50'
                  : isDragOver
                    ? 'border-brand-blue-500 bg-brand-blue-50'
                    : 'border-gray-200 bg-white'
              }`}
              onDrop={(e) => handleDrop(req.type, e)}
              onDragOver={(e) => handleDragOver(req.type, e)}
              onDragLeave={handleDragLeave}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    uploaded ? 'bg-brand-green-100' : 'bg-gray-100'
                  }`}
                >
                  {uploaded ? (
                    <span className="text-slate-500 flex-shrink-0">•</span>
                  ) : (
                    <FileText className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{req.label}</h3>
                    {req.required && (
                      <span className="text-xs bg-brand-orange-100 text-brand-orange-700 px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{req.description}</p>

                  {uploaded ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-brand-green-700 font-medium">
                          {uploaded.file_name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            uploaded.status === 'verified'
                              ? 'bg-brand-green-100 text-brand-green-700'
                              : uploaded.status === 'rejected'
                                ? 'bg-brand-red-100 text-brand-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {uploaded.status === 'verified'
                            ? 'Verified'
                            : uploaded.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending Review'}
                        </span>
                      </div>
                      {onRemove && uploaded.status !== 'verified' && (
                        <button
                          onClick={() => onRemove(uploaded.id)}
                          className="text-sm text-brand-red-600 hover:text-brand-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id={`file-${req.type}`}
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(req.type, file);
                        }}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor={`file-${req.type}`}
                        className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                          isUploading
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
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
                            Choose File
                          </>
                        )}
                      </label>
                      <span className="ml-3 text-xs text-gray-500">
                        PDF, JPG, PNG (max 10MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allRequiredUploaded && (
        <div className="p-4 bg-brand-green-50 border border-brand-green-200 rounded-lg flex items-center gap-3">
          <span className="text-slate-500 flex-shrink-0">•</span>
          <div>
            <p className="font-medium text-brand-green-900">
              All required documents uploaded
            </p>
            <p className="text-sm text-brand-green-700">
              Documents will be reviewed by staff. You can proceed with enrollment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
