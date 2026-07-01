'use client';

import { useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, CheckCircle, ArrowLeft, FileText, Loader2, ExternalLink } from 'lucide-react';

export default function UploadCertificatePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.');
      return;
    }
    setFile(f);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Resolve program slug from courseId — use the generic program slug
      // The complete API resolves program from the external course's program_id
      const res = await fetch(
        `/api/external-pathways/${courseId}/complete`,
        { method: 'POST', body: formData },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Upload failed (${res.status})`);
      }

      setDone(true);
    } catch (err: any) {
      setError(err.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-brand-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-brand-green-600" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Certificate Submitted</h1>
          <p className="text-slate-600 text-sm mb-6">
            Your certificate has been submitted for review. An Elevate staff member will verify and
            approve it within 1–2 business days.
          </p>
          <Link
            href="/lms/dashboard"
            className="inline-flex items-center gap-2 bg-brand-blue-700 hover:bg-brand-blue-800 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        {/* Back */}
        <Link
          href="/lms/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h1 className="text-lg font-extrabold text-slate-900">Upload Completion Certificate</h1>
            <p className="text-sm text-slate-500 mt-1">
              Complete the course on the provider&apos;s platform, then upload your certificate here
              for Elevate to verify.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Instructions */}
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 text-sm text-brand-blue-800">
              <p className="font-semibold mb-1">How it works</p>
              <ol className="list-decimal list-inside space-y-1 text-brand-blue-700">
                <li>Complete the course on the provider&apos;s platform</li>
                <li>Download your certificate (PDF or image)</li>
                <li>Upload it here — Elevate will verify within 1–2 business days</li>
              </ol>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-brand-blue-400 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-6 h-6 text-brand-blue-600" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(0)} KB · Click to change
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Drop your certificate here or click to browse
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — max 10 MB</p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="w-full flex items-center justify-center gap-2 bg-brand-blue-700 hover:bg-brand-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3.5 rounded-xl transition-colors text-sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Submit Certificate
                </>
              )}
            </button>

            <p className="text-xs text-slate-400 text-center">
              Elevate does not copy or host external course content. We only verify your completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
