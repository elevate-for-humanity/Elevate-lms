'use client';

import { useState } from 'react';
import { Upload, Loader2, Database, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

type ImportType = 'students' | 'courses' | 'programs' | 'certificates' | 'attendance';

export default function DataImportClient() {
  const [importType, setImportType] = useState<ImportType>('students');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const importTypes: { value: ImportType; label: string; description: string }[] = [
    { value: 'students', label: 'Students', description: 'Import student profiles and enrollments' },
    { value: 'courses', label: 'Courses', description: 'Import course content and modules' },
    { value: 'programs', label: 'Programs', description: 'Import program structure and requirements' },
    { value: 'certificates', label: 'Certificates', description: 'Import certificate templates and records' },
    { value: 'attendance', label: 'Attendance', description: 'Import attendance records' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const startImport = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);

      const res = await fetch('/api/admin/data-import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ 
          success: data.success || 0, 
          failed: data.failed || 0, 
          errors: data.errors || [] 
        });
        setFile(null);
      } else {
        setResult({ success: 0, failed: 1, errors: [data.error || 'Import failed'] });
      }
    } catch (err) {
      setResult({ success: 0, failed: 1, errors: ['Network error occurred'] });
    }

    setUploading(false);
  };

  return (
    <div className="space-y-6">
      {result && (
        <div className={`rounded-lg p-4 border ${result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.failed === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
            <span className="font-medium">Import {result.failed === 0 ? 'Successful' : 'Completed with Errors'}</span>
          </div>
          <p className="text-sm text-slate-600">
            {result.success} records imported, {result.failed} failed
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-600 space-y-1">
              {result.errors.slice(0, 10).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {result.errors.length > 10 && (
                <li>...and {result.errors.length - 10} more errors</li>
              )}
            </ul>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">Import Type</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {importTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setImportType(type.value)}
              className={`p-4 rounded-lg border-2 text-left transition ${
                importType === type.value
                  ? 'border-brand-blue-600 bg-brand-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Database className={`w-5 h-5 ${importType === type.value ? 'text-brand-blue-600' : 'text-slate-400'}`} />
                <span className="font-medium text-slate-900">{type.label}</span>
              </div>
              <p className="text-sm text-slate-500">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
        <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 mb-2">Select a CSV or Excel file to import</p>
        <p className="text-sm text-slate-400 mb-4">
          Required columns depend on import type
        </p>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          id="data-import"
        />
        <label
          htmlFor="data-import"
          className="inline-block px-4 py-2 bg-brand-blue-600 text-white rounded-lg cursor-pointer hover:bg-brand-blue-700"
        >
          Select File
        </label>
      </div>

      {file && (
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-slate-400" />
            <div>
              <p className="font-medium text-slate-700">{file.name}</p>
              <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            onClick={startImport}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Importing...' : 'Start Import'}
          </button>
        </div>
      )}
    </div>
  );
}
