'use client';

import { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, XCircle, Loader2, FileText, AlertTriangle } from 'lucide-react';

type ImportType = 'students' | 'courses' | 'enrollments' | 'employers';

const IMPORT_TYPES: {
  value: ImportType;
  label: string;
  desc: string;
  columns: string[];
}[] = [
  {
    value: 'students',
    label: 'Students',
    desc: 'Bulk-create student accounts',
    columns: ['email', 'full_name', 'phone', 'date_of_birth', 'address'],
  },
  {
    value: 'courses',
    label: 'Courses',
    desc: 'Import course catalog entries',
    columns: ['title', 'slug', 'description', 'duration_hours', 'category'],
  },
  {
    value: 'enrollments',
    label: 'Enrollments',
    desc: 'Enroll existing students into courses',
    columns: ['student_email', 'course_id', 'enrolled_at', 'status'],
  },
  {
    value: 'employers',
    label: 'Employers',
    desc: 'Import employer / partner organizations',
    columns: ['company_name', 'contact_email', 'contact_name', 'phone', 'address', 'industry'],
  },
];

interface ImportResult {
  imported: number;
  failed: number;
  errors: string[];
}

function buildCsvTemplate(columns: string[]): string {
  return columns.join(',') + '\n';
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataImportClient() {
  const [type, setType] = useState<ImportType>('students');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = IMPORT_TYPES.find(t => t.value === type)!;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
  };

  const submit = async () => {
    if (!file) { setError('Select a CSV file first'); return; }
    setLoading(true); setError(null); setResult(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);

      const res = await fetch('/api/admin/import', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResult(data);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Type selector */}
      <div className="grid sm:grid-cols-2 gap-3">
        {IMPORT_TYPES.map(t => (
          <button key={t.value} onClick={() => { setType(t.value); setResult(null); setError(null); setFile(null); }}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              type === t.value
                ? 'border-brand-blue-500 bg-brand-blue-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}>
            <p className={`text-sm font-semibold ${type === t.value ? 'text-brand-blue-700' : 'text-slate-700'}`}>
              {t.label}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Template download */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-700">CSV Template — {selected.label}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Required columns: <span className="font-mono">{selected.columns.join(', ')}</span>
          </p>
        </div>
        <button
          onClick={() => downloadCsv(buildCsvTemplate(selected.columns), `template_${type}.csv`)}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-blue-600 hover:text-brand-blue-800 border border-brand-blue-200 bg-white px-3 py-1.5 rounded-lg shrink-0 transition-colors">
          <Download className="w-3.5 h-3.5" /> Download Template
        </button>
      </div>

      {/* Upload */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-slate-800">Upload CSV</h2>

        <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
          file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-brand-blue-400 hover:bg-brand-blue-50/30'
        }`}>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="sr-only" />
          {file ? (
            <>
              <FileText className="w-8 h-8 text-green-500" />
              <p className="text-sm font-medium text-green-700">{file.name}</p>
              <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB — click to change</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400" />
              <p className="text-sm text-slate-600 font-medium">Click to select CSV file</p>
              <p className="text-xs text-slate-400">or drag and drop</p>
            </>
          )}
        </label>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {result && (
          <div className={`rounded-lg border px-4 py-3 space-y-2 ${
            result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="flex items-center gap-1.5 text-green-700">
                <CheckCircle className="w-4 h-4" /> {result.imported} imported
              </span>
              {result.failed > 0 && (
                <span className="flex items-center gap-1.5 text-red-700">
                  <XCircle className="w-4 h-4" /> {result.failed} failed
                </span>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul className="text-xs text-amber-800 space-y-0.5 max-h-32 overflow-y-auto">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            )}
          </div>
        )}

        <button onClick={submit} disabled={!file || loading}
          className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {loading ? 'Importing…' : `Import ${selected.label}`}
        </button>
      </div>
    </div>
  );
}
