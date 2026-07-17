'use client';

import { useState } from 'react';
import { Upload, Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface CurriculumUploadClientProps {
  programId?: string;
}

export default function CurriculumUploadClient({ programId }: CurriculumUploadClientProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setResult(null);
    }
  };

  const uploadCurriculum = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('curriculum', selectedFile);
      if (programId) formData.append('programId', programId);

      const res = await fetch('/api/admin/curriculum/upload', {
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
        setSelectedFile(null);
      } else {
        setResult({ success: 0, failed: 1, errors: [data.error || 'Upload failed'] });
      }
    } catch (err) {
      setResult({ success: 0, failed: 1, errors: ['Network error occurred'] });
    }

    setUploading(false);
  };

  return (
    <div className="space-y-6">
      {result && (
        <div className={`rounded-lg p-4 ${result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} border`}>
          <div className="flex items-center gap-2 mb-2">
            {result.failed === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
            <span className="font-medium">
              {result.failed === 0 ? 'Curriculum imported successfully!' : 'Import completed with errors'}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            {result.success} items imported, {result.failed} failed
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-600 space-y-1">
              {result.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 mb-2">Upload your curriculum file (CSV, XLSX, or JSON)</p>
        <p className="text-sm text-slate-400 mb-4">
          Expected format: lesson_title, description, duration_minutes, order
        </p>
        <input
          type="file"
          accept=".csv,.xlsx,.json"
          onChange={handleFileSelect}
          className="hidden"
          id="curriculum-upload"
        />
        <label
          htmlFor="curriculum-upload"
          className="inline-block px-4 py-2 bg-brand-blue-600 text-white rounded-lg cursor-pointer hover:bg-brand-blue-700"
        >
          Select File
        </label>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-slate-400" />
            <div>
              <p className="font-medium text-slate-700">{selectedFile.name}</p>
              <p className="text-sm text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            onClick={uploadCurriculum}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Importing...' : 'Import Curriculum'}
          </button>
        </div>
      )}
    </div>
  );
}
