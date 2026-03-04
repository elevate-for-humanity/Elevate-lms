'use client';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState, useCallback } from 'react';
import { 
  Upload, FileSpreadsheet, Users, BookOpen, Building2, 
  GraduationCap, AlertCircle, X, Download,
  ArrowRight, Loader2, FileText, Table
} from 'lucide-react';

type ImportType = 'students' | 'courses' | 'programs' | 'employers' | 'enrollments';

interface ImportTab {
  id: ImportType;
  label: string;
  icon: React.ElementType;
  description: string;
  sampleFields: string[];
  requiredFields: string[];
}

const IMPORT_TABS: ImportTab[] = [
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    description: 'Import student records with contact info and demographics',
    sampleFields: ['email', 'first_name', 'last_name', 'phone', 'date_of_birth', 'address', 'city', 'state', 'zip'],
    requiredFields: ['email', 'first_name', 'last_name'],
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: BookOpen,
    description: 'Import course catalog with descriptions and pricing',
    sampleFields: ['title', 'description', 'duration_hours', 'price', 'category', 'level', 'instructor'],
    requiredFields: ['title'],
  },
  {
    id: 'programs',
    label: 'Programs',
    icon: GraduationCap,
    description: 'Import training programs and certifications',
    sampleFields: ['name', 'description', 'duration_weeks', 'credential_type', 'industry', 'funding_eligible'],
    requiredFields: ['name'],
  },
  {
    id: 'employers',
    label: 'Employers',
    icon: Building2,
    description: 'Import employer partners and contacts',
    sampleFields: ['company_name', 'contact_name', 'contact_email', 'phone', 'industry', 'address'],
    requiredFields: ['company_name', 'contact_email'],
  },
  {
    id: 'enrollments',
    label: 'Enrollments',
    icon: FileSpreadsheet,
    description: 'Import student enrollments into courses/programs',
    sampleFields: ['student_email', 'course_id', 'program_id', 'enrollment_date', 'status'],
    requiredFields: ['student_email'],
  },
];

interface ParsedRow {
  [key: string]: string;
}

interface ImportPreview {
  headers: string[];
  rows: ParsedRow[];
  totalRows: number;
  errors: string[];
  warnings: string[];
}

export default function AdminImportPage() {
  const [activeTab, setActiveTab] = useState<ImportType>('students');
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const activeTabData = IMPORT_TABS.find(t => t.id === activeTab)!;

  const parseCSV = (text: string): ImportPreview => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      return { headers: [], rows: [], totalRows: 0, errors: ['File is empty'], warnings: [] };
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    // Check required fields
    const errors: string[] = [];
    const warnings: string[] = [];
    
    activeTabData.requiredFields.forEach(field => {
      if (!headers.includes(field)) {
        errors.push(`Missing required column: ${field}`);
      }
    });

    // Parse rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < Math.min(lines.length, 101); i++) { // Preview first 100 rows
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      const row: ParsedRow = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row);
    }

    if (lines.length > 101) {
      warnings.push(`Showing first 100 of ${lines.length - 1} rows`);
    }

    return {
      headers,
      rows,
      totalRows: lines.length - 1,
      errors,
      warnings,
    };
  };

  const handleFile = useCallback((file: File) => {
    setFile(file);
    setImportResult(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
    };
    reader.readAsText(file);
  }, [activeTab]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file || !preview || preview.errors.length > 0) return;

    setImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', activeTab);

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      
      if (res.ok) {
        setImportResult({
          success: result.imported || 0,
          failed: result.failed || 0,
          errors: result.errors || [],
        });
      } else {
        setImportResult({
          success: 0,
          failed: preview.totalRows,
          errors: [result.error || 'Import failed'],
        });
      }
    } catch (error) {
      setImportResult({
        success: 0,
        failed: preview.totalRows,
        errors: ['Network error - please try again'],
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    const headers = activeTabData.sampleFields.join(',');
    const sampleRow = activeTabData.sampleFields.map(f => `sample_${f}`).join(',');
    const csv = `${headers}\n${sampleRow}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_import_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetImport = () => {
    setFile(null);
    setPreview(null);
    setImportResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-import-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Import' }]} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
              <p className="text-gray-600 mt-1">Import data from CSV files into your LMS</p>
            </div>
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Import Type Tabs */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="border-b">
            <nav className="flex overflow-x-auto">
              {IMPORT_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      resetImport();
                    }}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-brand-blue-600 text-brand-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-4">{activeTabData.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-sm text-gray-500">Required fields:</span>
              {activeTabData.requiredFields.map(field => (
                <span key={field} className="px-2 py-1 bg-brand-red-50 text-brand-red-700 text-xs font-medium rounded">
                  {field}
                </span>
              ))}
              <span className="text-sm text-gray-500 ml-2">Optional:</span>
              {activeTabData.sampleFields.filter(f => !activeTabData.requiredFields.includes(f)).map(field => (
                <span key={field} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {field}
                </span>
              ))}
            </div>

            {/* Upload Area */}
            {!file && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-brand-blue-500 bg-brand-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-brand-blue-500' : 'text-gray-400'}`} />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragging ? 'Drop your CSV file here' : 'Drag and drop your CSV file'}
                </p>
                <p className="text-gray-500 mb-4">or</p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 cursor-pointer transition-colors">
                  <FileSpreadsheet className="w-5 h-5" />
                  Browse Files
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-400 mt-4">Supports CSV files up to 10MB</p>
              </div>
            )}

            {/* File Selected */}
            {file && !importResult && (
              <div className="space-y-6">
                {/* File Info */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-brand-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB • {preview?.totalRows || 0} rows
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetImport}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Errors */}
                {preview?.errors && preview.errors.length > 0 && (
                  <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-brand-red-800">Validation Errors</p>
                        <ul className="mt-1 text-sm text-brand-red-700 list-disc list-inside">
                          {preview.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {preview?.warnings && preview.warnings.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Warnings</p>
                        <ul className="mt-1 text-sm text-yellow-700">
                          {preview.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                {preview && preview.rows.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <Table className="w-5 h-5" />
                        Data Preview
                      </h3>
                      <span className="text-sm text-gray-500">
                        Showing {preview.rows.length} of {preview.totalRows} rows
                      </span>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {preview.headers.map((header) => (
                                <th
                                  key={header}
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                  {activeTabData.requiredFields.includes(header) && (
                                    <span className="text-brand-red-500 ml-1">*</span>
                                  )}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {preview.rows.slice(0, 10).map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-gray-50">
                                {preview.headers.map((header) => (
                                  <td key={header} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                    {row[header] || <span className="text-gray-300">—</span>}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Import Button */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={resetImport}
                    className="px-6 py-3 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || (preview?.errors?.length || 0) > 0}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        Import {preview?.totalRows || 0} Records
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className="space-y-6">
                <div className={`p-6 rounded-xl ${
                  importResult.failed === 0 ? 'bg-brand-green-50' : 'bg-yellow-50'
                }`}>
                  <div className="flex items-start gap-4">
                    {importResult.failed === 0 ? (
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    ) : (
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    )}
                    <div>
                      <h3 className={`text-lg font-bold ${
                        importResult.failed === 0 ? 'text-brand-green-800' : 'text-yellow-800'
                      }`}>
                        Import Complete
                      </h3>
                      <div className="mt-2 flex gap-6">
                        <div>
                          <span className="text-2xl font-bold text-brand-green-600">{importResult.success}</span>
                          <span className="text-gray-600 ml-2">records imported</span>
                        </div>
                        {importResult.failed > 0 && (
                          <div>
                            <span className="text-2xl font-bold text-brand-red-600">{importResult.failed}</span>
                            <span className="text-gray-600 ml-2">failed</span>
                          </div>
                        )}
                      </div>
                      {importResult.errors.length > 0 && (
                        <ul className="mt-4 text-sm text-brand-red-700 list-disc list-inside">
                          {importResult.errors.slice(0, 5).map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li>...and {importResult.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={resetImport}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700"
                  >
                    <Upload className="w-5 h-5" />
                    Import More Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold text-gray-900 mb-4">Import Tips</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">File Format</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Use CSV format with comma separators</li>
                <li>• First row must be column headers</li>
                <li>• UTF-8 encoding recommended</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Data Quality</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Ensure required fields are filled</li>
                <li>• Use consistent date formats (YYYY-MM-DD)</li>
                <li>• Remove duplicate entries</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Large Files</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Files up to 10MB supported</li>
                <li>• Split larger files into batches</li>
                <li>• Import may take a few minutes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
