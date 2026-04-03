'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { logger } from '@/lib/logger';
import { createBrowserClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  Trash2,
  Download,
CheckCircle, } from 'lucide-react';

interface ExtractedData {
  documentType:
    | 'w2'
    | '1099-misc'
    | '1099-nec'
    | '1099-int'
    | '1099-div'
    | 'receipt'
    | 'other';
  data: {
    // W-2 Fields
    employer?: string;
    ein?: string;
    wages?: number;
    federalWithholding?: number;
    stateWithholding?: number;
    socialSecurityWages?: number;
    medicareWages?: number;

    // 1099 Fields
    payer?: string;
    payerEIN?: string;
    amount?: number;
    interestIncome?: number;
    dividendIncome?: number;

    // Receipt Fields
    vendor?: string;
    date?: string;
    category?: string;
    deductionAmount?: number;
  };
  confidence: number;
  rawText?: string;
}

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  extractedData?: ExtractedData;
  error?: string;
}



export default function SmartUploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? '');
        setUserPhone(data.user.user_metadata?.phone ?? '');
      }
    });
  }, []);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;

    const acceptedFiles = Array.from(fileList).filter((file) => {
      const isValidType =
        file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading',
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Process each file
    for (const uploadedFile of newFiles) {
      await processFile(uploadedFile);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      // Update status to processing
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: 'processing' } : f
        )
      );

      // Create FormData for API call
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      formData.append(
        'documentType',
        detectDocumentType(uploadedFile.file.name)
      );
      formData.append('email', userEmail);
      formData.append('phone', userPhone);

      // Call OCR extraction API
      const response = await fetch('/api/supersonic-fast-cash/ocr-extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('OCR extraction failed');
      }

      const result = await response.json();

      // Update file with extracted data
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: 'completed',
                extractedData: {
                  documentType: result.extractedData.documentType,
                  data: result.extractedData,
                  confidence: result.confidence,
                  rawText: '',
                },
              }
            : f
        )
      );
    } catch (error) {
      logger.error('Processing error:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: 'error',
                error:
                  'An error occurred',
              }
            : f
        )
      );
    }
  };

  const detectDocumentType = (
    filename: string
  ): 'w2' | '1099' | 'receipt' | 'other' => {
    const lower = filename.toLowerCase();
    if (lower.includes('w2') || lower.includes('w-2')) return 'w2';
    if (lower.includes('1099')) return '1099';
    if (lower.includes('receipt')) return 'receipt';
    return 'other';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Smart Upload" }]} />
      </div>
<div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-blue-100 text-brand-blue-700 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">AI-Powered OCR</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Smart Document Upload
          </h1>
          <p className="text-xl text-black max-w-2xl mx-auto">
            Upload your W-2s, 1099s, and receipts. We'll automatically extract
            all the data for you using SupersonicFastCash OCR.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          className={`border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
            isDragActive
              ? 'border-brand-green-500 bg-brand-green-50'
              : 'border-gray-300 hover:border-brand-green-400 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mb-6">
              <Upload className="w-10 h-10 text-brand-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {isDragActive ? 'Drop files here' : 'Upload Tax Documents'}
            </h3>
            <p className="text-black mb-6">
              Drag & drop or click to browse. We support W-2s, 1099s, receipts,
              and more.
            </p>
            <div className="flex items-center gap-4 text-sm text-black">
              <div className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                <span>JPG, PNG, HEIC</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>PDF</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-black flex-shrink-0">•</span>
                <span>Max 10MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 my-12">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Sparkles className="w-10 h-10 text-brand-blue-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Auto Data Extraction</h3>
            <p className="text-sm text-black">
              SupersonicFastCash OCR automatically reads and extracts all data from
              your documents
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <span className="text-black flex-shrink-0">•</span>
            <h3 className="font-bold text-lg mb-2">95%+ Accuracy</h3>
            <p className="text-sm text-black">
              Industry-leading OCR technology ensures accurate data extraction
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <Loader2 className="w-10 h-10 text-brand-blue-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Instant Processing</h3>
            <p className="text-sm text-black">
              Get results in seconds. No manual data entry required
            </p>
          </div>
        </div>

        {/* Uploaded Files */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Uploaded Documents</h2>

            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100"
              >
                <div className="flex items-start gap-6">
                  {/* Preview */}
                  <div className="relative w-32 h-32 bg-white rounded-lg overflow-hidden flex-shrink-0">
                    {file.file.type.startsWith('image/') ? (
                      <Image
                        src={file.preview}
                        alt={file.file.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-12 h-12 text-black" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg mb-1">
                          {file.file.name}
                        </h3>
                        <p className="text-sm text-black">
                          {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {file.status === 'uploading' && (
                          <span className="flex items-center gap-2 px-3 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-full text-sm font-semibold">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading
                          </span>
                        )}
                        {file.status === 'processing' && (
                          <span className="flex items-center gap-2 px-3 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-full text-sm font-semibold">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            Extracting Data
                          </span>
                        )}
                        {file.status === 'completed' && (
                          <span className="flex items-center gap-2 px-3 py-2 bg-brand-green-100 text-brand-green-700 rounded-full text-sm font-semibold">
                            <span className="text-black flex-shrink-0">•</span>
                            Completed
                          </span>
                        )}
                        {file.status === 'error' && (
                          <span className="flex items-center gap-2 px-3 py-2 bg-brand-red-100 text-brand-red-700 rounded-full text-sm font-semibold">
                            <AlertCircle className="w-4 h-4" />
                            Error
                          </span>
                        )}
                        <button
                          onClick={() => removeFile(file.id)}
                          className="p-2 hover:bg-white rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4 text-black" />
                        </button>
                      </div>
                    </div>

                    {/* Extracted Data */}
                    {file.extractedData && (
                      <div className="bg-brand-green-50 rounded-xl p-6 border-2 border-brand-green-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-lg">
                            Extracted Data (
                            {file.extractedData.documentType.toUpperCase()})
                          </h4>
                          <span className="text-sm text-brand-green-700 font-semibold">
                            {(file.extractedData.confidence * 100).toFixed(0)}%
                            Confidence
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {file.extractedData.data.employer && (
                            <div>
                              <label className="text-xs font-medium text-black">
                                Employer
                              </label>
                              <p className="font-semibold">
                                {file.extractedData.data.employer}
                              </p>
                            </div>
                          )}
                          {file.extractedData.data.ein && (
                            <div>
                              <label className="text-xs font-medium text-black">
                                EIN
                              </label>
                              <p className="font-semibold">
                                {file.extractedData.data.ein}
                              </p>
                            </div>
                          )}
                          {file.extractedData.data.wages && (
                            <div>
                              <label className="text-xs font-medium text-black">
                                Wages (Box 1)
                              </label>
                              <p className="font-semibold text-brand-green-700 text-lg">
                                {formatCurrency(file.extractedData.data.wages)}
                              </p>
                            </div>
                          )}
                          {file.extractedData.data.federalWithholding && (
                            <div>
                              <label className="text-xs font-medium text-black">
                                Federal Withholding (Box 2)
                              </label>
                              <p className="font-semibold text-brand-green-700 text-lg">
                                {formatCurrency(
                                  file.extractedData.data.federalWithholding
                                )}
                              </p>
                            </div>
                          )}
                          {file.extractedData.data.socialSecurityWages && (
                            <div>
                              <label className="text-xs font-medium text-black">
                                Social Security Wages (Box 3)
                              </label>
                              <p className="font-semibold">
                                {formatCurrency(
                                  file.extractedData.data.socialSecurityWages
                                )}
                              </p>
                            </div>
                          )}
                          {file.extractedData.data.medicareWages && (
                            <div>
                              <label className="text-xs font-medium text-black">
                                Medicare Wages (Box 5)
                              </label>
                              <p className="font-semibold">
                                {formatCurrency(
                                  file.extractedData.data.medicareWages
                                )}
                              </p>
                            </div>
                          )}
                          {file.extractedData.data.stateWithholding && (
                            <div>
                              <label className="text-xs font-medium text-black">
                                State Withholding (Box 17)
                              </label>
                              <p className="font-semibold">
                                {formatCurrency(
                                  file.extractedData.data.stateWithholding
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-brand-green-200">
                          <p className="text-sm text-brand-green-700 font-semibold">
                            • Data automatically added to your tax return
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {file.error && (
                      <div className="bg-brand-red-50 rounded-xl p-4 border-2 border-brand-red-200">
                        <div className="flex gap-2">
                          <AlertCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
                          <p className="text-sm text-brand-red-700">{file.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {files.some((f) => f.status === 'completed') && (
          <div className="mt-8 bg-slate-700 rounded-2xl shadow-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">
              Ready to File Your Return?
            </h3>
            <p className="text-white mb-6">
              All your data has been extracted and saved. Continue to complete
              your tax return.
            </p>
            <a
              href="/supersonic-fast-cash/diy/interview"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-green-600 rounded-xl font-bold hover:bg-brand-green-50 transition"
            >
              Continue to Tax Interview →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
