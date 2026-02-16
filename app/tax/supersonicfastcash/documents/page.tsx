'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';

interface UploadedFile {
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  path?: string;
}



export default function DocumentUploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploading(true);

    for (const file of selectedFiles) {
      // Add file to list with uploading status
      const newFile: UploadedFile = {
        name: file.name,
        size: file.size,
        status: 'uploading',
      };
      setFiles((prev) => [...prev, newFile]);

      try {
        // Get signed upload URL
        const urlResponse = await fetch('/api/tax/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            contactInfo,
          }),
        });

        if (!urlResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { signedUrl, path } = await urlResponse.json();

        // Upload file to Supabase Storage
        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        // Update file status to success
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.status === 'uploading'
              ? { ...f, status: 'success', path }
              : f
          )
        );
      } catch (error) { /* Error handled silently */ 
        // Update file status to error
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name && f.status === 'uploading'
              ? { ...f, status: 'error' }
              : f
          )
        );
      }
    }

    setUploading(false);
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Documents" }]} />
      </div>
<div className="mb-6">
        <Link
          href="/tax"
          aria-label="Link"
          className="text-sm text-black hover:text-black"
        >
          ← Back to Tax Services
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-3">Upload Tax Documents</h1>
      <p className="text-lg text-black mb-8">
        Securely upload your tax documents for SupersonicFastCash preparation
        services.
      </p>

      {/* Contact Information */}
      <section className="rounded-2xl border bg-white p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Your Information</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={contactInfo.name}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={contactInfo.email}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="your.email@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={contactInfo.phone}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="Get Help Online"
            />
          </div>
        </div>
      </section>

      {/* Upload Area */}
      <section className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center mb-6">
        <Upload className="w-12 h-12 text-black mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Upload Your Documents</h2>
        <p className="text-black mb-6">
          Drag and drop files here, or click to browse
        </p>
        <label className="inline-block px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition cursor-pointer">
          Choose Files
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            disabled={
              !contactInfo.name || !contactInfo.email || !contactInfo.phone
            }
          />
        </label>
        <p className="text-xs text-black mt-4">
          Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB per file)
        </p>
        {(!contactInfo.name || !contactInfo.email || !contactInfo.phone) && (
          <p className="text-sm text-brand-orange-600 mt-2">
            Please fill in your contact information above before uploading
          </p>
        )}
      </section>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <section className="rounded-2xl border bg-white p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            Uploaded Files ({files.length})
          </h2>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="w-5 h-5 text-black flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-black">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.status === 'uploading' && (
                    <div className="text-sm text-black">Uploading...</div>
                  )}
                  {file.status === 'success' && (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-brand-orange-600" />
                  )}
                  <button
                    onClick={() => removeFile(file.name)}
                    className="p-1 hover:bg-gray-100 rounded"
                    disabled={file.status === 'uploading'}
                  >
                    <X className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Document Checklist */}
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold mb-4">Document Checklist</h2>
        <p className="text-black mb-4">
          Please upload the following documents for your tax preparation:
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Required Documents</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-600">•</span>
                <span>Government-issued photo ID</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-600">•</span>
                <span>Social Security cards (all persons on return)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-600">•</span>
                <span>W-2 forms from all employers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-600">•</span>
                <span>1099 forms (if applicable)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue-600">•</span>
                <span>Bank account information for direct deposit</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">
              Additional Documents (if applicable)
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span>Form 1098 (mortgage interest)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span>Form 1098-T (education expenses)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span>Childcare provider information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span>Business income/expense records</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-black">•</span>
                <span>Last year's tax return</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Security Notice */}
      <section className="mt-6 rounded-2xl bg-brand-blue-50 border-l-4 border-brand-blue-600 p-6">
        <h3 className="font-semibold text-black mb-2">Secure Upload</h3>
        <p className="text-sm text-black">
          Your documents are encrypted during upload and stored securely. We use
          bank-level security to protect your sensitive information. Files are
          only accessible to authorized tax preparers.
        </p>
      </section>

      {/* Next Steps */}
      <section className="mt-6 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-bold mb-4">What Happens Next?</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <div className="font-semibold">We Review Your Documents</div>
              <div className="text-sm text-black">
                Our team will review your uploaded documents within 24 hours
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <div className="font-semibold">We Contact You</div>
              <div className="text-sm text-black">
                We'll call or email if we need any additional information
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <div className="font-semibold">We Prepare Your Return</div>
              <div className="text-sm text-black">
                Your tax return is prepared by our certified professionals
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <div className="font-semibold">Review & E-File</div>
              <div className="text-sm text-black">
                You review and approve before we e-file with the IRS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Scheduling */}
      <section className="mt-6 text-center">
        <p className="text-black mb-4">
          Questions about uploading documents?
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="/support"
            className="px-6 py-3 rounded-lg bg-brand-blue-600 text-white font-semibold hover:bg-brand-blue-700 transition"
          >
            Call support center
          </a>
          <Link
            href="/tax/book-appointment"
            className="px-6 py-3 rounded-lg border-2 border-brand-blue-600 text-brand-blue-600 font-semibold hover:bg-gray-50 transition"
          >
            Book Appointment Online
          </Link>
        </div>
      </section>
    </div>
  );
}
