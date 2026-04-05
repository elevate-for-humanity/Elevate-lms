"use client";
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Download, Clock } from 'lucide-react';
export const dynamic = 'force-dynamic';



export default async function HoursExportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Set default to current week
  useState(() => {
    const today = new Date();
    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);
    setStartDate(weekStart.toISOString().split('T')[0]);
    setEndDate(weekEnd.toISOString().split('T')[0]);
  });

  const handleExport = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        format: 'csv',
        start_date: startDate,
        end_date: endDate,
      });

      const response = await fetch(`/api/admin/export/weekly-hours?${params}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly_hours_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError((err as Error).message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const setCurrentWeek = () => {
    const today = new Date();
    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);
    setStartDate(weekStart.toISOString().split('T')[0]);
    setEndDate(weekEnd.toISOString().split('T')[0]);
  };

  const setLastWeek = () => {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);
    setStartDate(weekStart.toISOString().split('T')[0]);
    setEndDate(weekEnd.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-white py-8">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Hours Export" }]} />
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-brand-blue-600" />
            <h1 className="text-3xl font-bold text-black">
              Weekly Hours Export
            </h1>
          </div>
          <p className="text-black">
            Export apprenticeship hours for WorkOne/DWD reporting
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-brand-blue-900 mb-2">
            WorkOne/DWD Compliance
          </h3>
          <p className="text-sm text-brand-blue-800">
            This export generates a CSV file formatted for WorkOne and Indiana
            Department of Workforce Development (DWD) reporting requirements.
            The file includes all apprenticeship hours for the selected date
            range with approval status.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Export Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-black mb-6">
            Select Date Range
          </h2>

          {/* Quick Select Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={setCurrentWeek}
              className="px-4 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-md hover:bg-brand-blue-200 font-medium"
            >
              Current Week
            </button>
            <button
              onClick={setLastWeek}
              className="px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200 font-medium"
            >
              Last Week
            </button>
          </div>

          {/* Date Inputs */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Week Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Week End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-gray-50 rounded-md p-4 mb-6">
            <h3 className="text-sm font-semibold text-black mb-2">
              Export will include:
            </h3>
            <ul className="text-sm text-black space-y-1">
              <li>• Student name and email</li>
              <li>• Shop name and license number</li>
              <li>• Date and hours worked</li>
              <li>• Work description</li>
              <li>• Approval status and approver</li>
              <li>• Summary totals (total, approved, pending hours)</li>
            </ul>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={loading || !startDate || !endDate}
              className="flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-md hover:bg-brand-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {loading ? 'Generating...' : 'Export to CSV'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            How to Use This Export
          </h2>
          <ol className="space-y-3 text-sm text-black">
            <li className="flex gap-2">
              <span className="font-semibold text-brand-blue-600">1.</span>
              <span>
                Select the week you want to report (typically the previous week)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-brand-blue-600">2.</span>
              <span>Click "Export to CSV" to download the file</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-brand-blue-600">3.</span>
              <span>Open the CSV file in Excel or Google Sheets</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-brand-blue-600">4.</span>
              <span>Review the data for accuracy</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-brand-blue-600">5.</span>
              <span>
                Submit to WorkOne/DWD according to their reporting schedule
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  return new Date(start.setDate(start.getDate() + 6));
}
