"use client";

import React from 'react';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, X, Check, Loader2 } from 'lucide-react';

interface DataExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'students' | 'courses' | 'enrollments' | 'assignments' | 'grades';
  filters?: Record<string, any>;
}

export default function DataExportDialog({
  isOpen,
  onClose,
  exportType,
  filters = {},
}: DataExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen) return null; return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      const params = new URLSearchParams({
        type: exportType,
        format,
        filters: JSON.stringify(filters),
      });

      const response = await fetch(`/api/export?${params}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `export.${format}`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportComplete(true);
      setTimeout(() => {
        onClose();
        setExportComplete(false);
      }, 2000);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportTypeLabels = {
    students: 'Students',
    courses: 'Courses',
    enrollments: 'Enrollments',
    assignments: 'Assignments',
    grades: 'Grades',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black">
                Export Data
              </h3>
              <p className="text-sm text-gray-500">
                {exportTypeLabels[exportType]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors"
            disabled={isExporting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('csv')}
                disabled={isExporting}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  format === 'csv'
                    ? 'border-brand-blue-600 bg-brand-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FileSpreadsheet className={`w-5 h-5 ${
                  format === 'csv' ? 'text-brand-blue-600' : 'text-gray-400'
                }`} />
                <div className="text-left">
                  <div className={`font-medium ${
                    format === 'csv' ? 'text-brand-blue-900' : 'text-black'
                  }`}>
                    CSV
                  </div>
                  <div className="text-xs text-gray-500">
                    Excel compatible
                  </div>
                </div>
              </button>

              <button
                onClick={() => setFormat('pdf')}
                disabled={isExporting}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  format === 'pdf'
                    ? 'border-brand-blue-600 bg-brand-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FileText className={`w-5 h-5 ${
                  format === 'pdf' ? 'text-brand-blue-600' : 'text-gray-400'
                }`} />
                <div className="text-left">
                  <div className={`font-medium ${
                    format === 'pdf' ? 'text-brand-blue-900' : 'text-black'
                  }`}>
                    PDF
                  </div>
                  <div className="text-xs text-gray-500">
                    Print ready
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-brand-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-brand-blue-800">
                <p className="font-medium mb-1">Export includes:</p>
                <ul className="list-disc list-inside space-y-1 text-brand-blue-700">
                  <li>All visible columns</li>
                  <li>Applied filters</li>
                  <li>Current sort order</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {Object.keys(filters).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-black mb-2">
                Active Filters
              </h4>
              <div className="space-y-1">
                {Object.entries(filters).map(([key, value]) => (
                  <div key={key} className="text-sm text-black">
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2 text-white bg-brand-blue-600 rounded-lg hover:bg-brand-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : exportComplete ? (
              <>
                <Check className="w-4 h-4" />
                Complete!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Batch Export Dialog
interface BatchExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatchExportDialog({ isOpen, onClose }: BatchExportDialogProps) {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [format, setFormat] = useState<'csv' | 'pdf' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null; return null;

  const tables = [
    { id: 'students', label: 'Students', description: 'All student records' },
    { id: 'courses', label: 'Courses', description: 'Course catalog' },
    { id: 'enrollments', label: 'Enrollments', description: 'Student enrollments' },
    { id: 'assignments', label: 'Assignments', description: 'All assignments' },
    { id: 'grades', label: 'Grades', description: 'Student grades' },
  ];

  const toggleTable = (tableId: string) => {
    setSelectedTables(prev =>
      prev.includes(tableId)
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      alert('Please select at least one table to export');
      return;
    }

    setIsExporting(true);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tables: selectedTables,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error('Batch export failed');
      }

      const result = await response.json();

      if (format === 'json') {
        // Download JSON file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `batch_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      alert('Batch export completed successfully!');
      onClose();
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black">
                Batch Export
              </h3>
              <p className="text-sm text-gray-500">
                Export multiple tables at once
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors"
            disabled={isExporting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Table Selection */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">
              Select Tables
            </label>
            <div className="space-y-2">
              {tables.map(table => (
                <label
                  key={table.id}
                  className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(table.id)}
                    onChange={() => toggleTable(table.id)}
                    disabled={isExporting}
                    className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-black">{table.label}</div>
                    <div className="text-sm text-gray-500">{table.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-black mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['csv', 'pdf', 'json'].map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt as string)}
                  disabled={isExporting}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    format === fmt
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-gray-300 text-black'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-black">
            {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || selectedTables.length === 0}
              className="flex items-center gap-2 px-6 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
