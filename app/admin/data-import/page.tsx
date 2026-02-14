'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  FileSpreadsheet,
  Users,
  BookOpen,
  GraduationCap,
  Building2,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  X,
} from 'lucide-react';

type ImportType = 'students' | 'courses' | 'enrollments' | 'employers';

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

const importTypes = [
  {
    id: 'students' as ImportType,
    name: 'Students / Participants',
    icon: Users,
    description: 'Import student records with email, name, phone',
    template: 'students-template.csv',
  },
  {
    id: 'courses' as ImportType,
    name: 'Courses / Programs',
    icon: BookOpen,
    description: 'Import courses with name, code, duration',
    template: 'courses-template.csv',
  },
  {
    id: 'enrollments' as ImportType,
    name: 'Enrollments',
    icon: GraduationCap,
    description: 'Link students to courses with status',
    template: 'enrollments-template.csv',
  },
  {
    id: 'employers' as ImportType,
    name: 'Employers',
    icon: Building2,
    description: 'Import employer/company records',
    template: 'employers-template.csv',
  },
];

function parseCSVPreview(content: string): PreviewData {
  const lines = content.trim().split('\n');
  if (lines.length < 1) return { headers: [], rows: [], totalRows: 0 };

  const parseRow = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));
    return values;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1, 6).filter(l => l.trim()).map(parseRow);
  const totalRows = lines.filter(l => l.trim()).length - 1;

  return { headers, rows, totalRows };
}

export default function DataImportPage() {
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Parse preview
      const content = await selectedFile.text();
      const previewData = parseCSVPreview(content);
      setPreview(previewData);
      setShowPreview(true);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    const content = await selectedFile.text();
    const previewData = parseCSVPreview(content);
    setPreview(previewData);
    setShowPreview(true);
  };

  const handleUpload = async () => {
    if (!file || !selectedType) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', selectedType);

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: ['Upload failed. Please try again.'],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = (template: string) => {
    // Generate CSV template
    const templates: Record<string, string> = {
      'students-template.csv': 'email,first_name,last_name,phone,external_id\njohn@example.com,John,Doe,555-123-4567,EMP001\njane@example.com,Jane,Smith,555-987-6543,EMP002',
      'courses-template.csv': 'name,code,description,duration_weeks,is_active\nCNA Training,CNA101,Certified Nursing Assistant program,8,true\nWelding Basics,WELD101,Introduction to welding,12,true',
      'enrollments-template.csv': 'student_email,course_code,status,enrolled_at\njohn@example.com,CNA101,active,2024-01-15\njane@example.com,WELD101,completed,2024-02-01',
      'employers-template.csv': 'company_name,contact_name,contact_email,phone,address\nAcme Corp,Bob Wilson,bob@acme.com,555-111-2222,123 Main St',
    };

    const content = templates[template] || '';
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Preview Modal */}
      {showPreview && preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-brand-blue-600" />
                <h3 className="font-bold text-gray-900">Preview Import Data</h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[50vh]">
              <p className="text-sm text-gray-600 mb-3">
                Showing first {preview.rows.length} of {preview.totalRows} records
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      {preview.headers.map((header, idx) => (
                        <th key={idx} className="px-3 py-2 text-left font-medium text-gray-700 border">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-3 py-2 border text-gray-600">
                            {cell || <span className="text-gray-400 italic">empty</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                <strong>{preview.totalRows}</strong> records will be imported
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setFile(null);
                    setPreview(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    handleUpload();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Confirm Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Data Import' }]} />
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-black text-gray-900">Data Import</h1>
          <p className="text-gray-600 mt-1">
            Import students, courses, enrollments, and employers from CSV files
          </p>
        </div>

        {/* Import Type Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            1. Select Import Type
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {importTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id);
                    setFile(null);
                    setResult(null);
                    setPreview(null);
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-brand-blue-500 bg-brand-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-blue-100' : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{type.name}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadTemplate(type.template);
                        }}
                        className="mt-2 text-sm text-brand-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download template
                      </button>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* File Upload */}
        {selectedType && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              2. Upload CSV File
            </h2>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-brand-blue-500 bg-brand-blue-50'
                  : file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="ml-4 text-red-600 hover:underline text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop your CSV file here, or
                  </p>
                  <label className="inline-block">
                    <span className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-brand-blue-700">
                      Browse Files
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>

            {file && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Import Data
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`bg-white rounded-xl shadow-sm p-6 mb-6 border-l-4 ${
            result.success ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div>
                <h3 className="font-bold text-gray-900">
                  {result.success ? 'Import Complete' : 'Import Failed'}
                </h3>
                <p className="text-gray-600 mt-1">
                  {result.imported} records imported
                  {result.failed > 0 && `, ${result.failed} failed`}
                </p>
                {result.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {result.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>...and {result.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* API Import Option */}
        <div className="bg-slate-900 rounded-xl p-6 text-white">
          <h2 className="text-lg font-bold mb-2">Need to import programmatically?</h2>
          <p className="text-slate-300 mb-4">
            Use our REST API for automated imports, ongoing sync, or large migrations.
          </p>
          <Link
            href="/admin/api-keys"
            className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-slate-100"
          >
            Manage API Keys
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
