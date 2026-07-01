'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function CertificateUploadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const certRequestId = params.id;

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Only PDF, JPEG, PNG, or WebP files are accepted.');
      e.target.value = '';
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError(
        `File must be under ${MAX_MB} MB. This file is ${(selected.size / 1024 / 1024).toFixed(1)} MB.`,
      );
      e.target.value = '';
      return;
    }
    setFile(selected);
  }

  function removeFile() {
    setFile(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Please select a file before submitting.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/certification/${certRequestId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Upload failed — please try again.');
      }

      setSuccess(true);
      setTimeout(() => router.push('/learner/dashboard'), 3000);
    } catch (err: any) {
      setError(err.message ?? 'An unexpected error occurred.');
    } finally {
      setUploading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-brand-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Certificate Uploaded</h1>
          <p className="text-slate-500 mb-6">
            Your exam result has been submitted. Elevate staff will review it and notify you once
            verified — typically within 1 business day.
          </p>
          <p className="text-sm text-slate-400">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href="/learner/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Upload Exam Certificate</h1>
            <p className="text-slate-500 text-sm">
              Upload a clear copy of your official exam result certificate (PDF or image). Elevate
              staff will review it within 1 business day.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File drop zone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Exam Certificate File <span className="text-brand-red-500">*</span>
              </label>

              {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-brand-blue-400 hover:bg-slate-50 transition group">
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-brand-blue-500 mb-3 transition" />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-brand-blue-600 transition">
                    Click to select a file
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    PDF, JPEG, PNG, or WebP — max {MAX_MB} MB
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Guidance */}
            <div className="bg-brand-blue-50 border border-brand-blue-100 rounded-xl p-4 text-sm text-brand-blue-800">
              <p className="font-semibold mb-1">Before uploading</p>
              <ul className="space-y-0.5 list-disc list-inside text-brand-blue-700">
                <li>Ensure the file shows your full name and exam result clearly</li>
                <li>Photos must be well-lit with no blurred text</li>
                <li>Accepted: official result letters, digital certificates, score reports</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Submit Certificate
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Questions? Call{' '}
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="text-slate-600 font-medium">
              {PLATFORM_DEFAULTS.supportPhone}
            </a>{' '}
            or email{' '}
            <a href="mailto:info@elevateforhumanity.org" className="text-slate-600 font-medium">
              info@elevateforhumanity.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
