'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';

const DOCUMENT_TYPES = [
  {
    key: 'government_id',
    label: 'Government-Issued ID',
    description: "Driver's license, passport, or state ID",
  },
  {
    key: 'instructor_certification',
    label: 'Instructor Certification',
    description: 'Teaching certificate or professional credential',
  },
  {
    key: 'instructor_license',
    label: 'Professional License',
    description: 'State or industry license relevant to your program',
  },
  {
    key: 'background_check',
    label: 'Background Check Authorization',
    description: 'Signed authorization form for background screening',
  },
] as const;

type DocType = (typeof DOCUMENT_TYPES)[number]['key'];

interface ExistingDoc {
  id: string;
  document_type: string;
  file_name: string;
  created_at: string;
  status: string;
}

interface Props {
  userId: string;
  existingDocs: ExistingDoc[];
  focusType: string | null;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  approved: <CheckCircle className="w-4 h-4 text-emerald-600" />,
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  rejected: <XCircle className="w-4 h-4 text-red-500" />,
};

export default function InstructorDocumentsClient({ userId, existingDocs, focusType }: Props) {
  const [docs, setDocs] = useState<ExistingDoc[]>(existingDocs);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getDoc = (type: string) => docs.find((d) => d.document_type === type);

  const handleUpload = async (type: DocType, file: File) => {
    setUploading(type);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${userId}/${type}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data, error: dbError } = await supabase
        .from('documents')
        .upsert(
          {
            user_id: userId,
            document_type: type,
            file_name: file.name,
            storage_path: path,
            status: 'pending',
          },
          { onConflict: 'user_id,document_type' },
        )
        .select('id, document_type, file_name, created_at, status')
        .single();
      if (dbError) throw dbError;

      setDocs((prev) => {
        const filtered = prev.filter((d) => d.document_type !== type);
        return data ? [...filtered, data] : filtered;
      });
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {DOCUMENT_TYPES.map((dt) => {
        const existing = getDoc(dt.key);
        const isUploading = uploading === dt.key;
        const isFocus = focusType === dt.key;

        return (
          <div
            key={dt.key}
            id={dt.key}
            className={`rounded-xl border bg-white p-5 transition-shadow ${isFocus ? 'ring-2 ring-brand-blue-500 border-brand-blue-300' : 'border-slate-200'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <p className="text-sm font-semibold text-slate-900">{dt.label}</p>
                  {existing && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      {STATUS_ICON[existing.status] ?? <Clock className="w-4 h-4 text-slate-400" />}
                      {existing.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 ml-6">{dt.description}</p>
                {existing && (
                  <p className="text-xs text-slate-400 mt-1 ml-6 truncate">{existing.file_name}</p>
                )}
              </div>

              <div className="shrink-0">
                <input
                  ref={(el) => {
                    fileRefs.current[dt.key] = el;
                  }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(dt.key, file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileRefs.current[dt.key]?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? 'Uploading…' : existing ? 'Replace' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-slate-400 pt-2">
        Accepted formats: PDF, JPG, PNG, DOC, DOCX · Max 10 MB per file · Files are reviewed within
        2 business days.
      </p>
    </div>
  );
}
