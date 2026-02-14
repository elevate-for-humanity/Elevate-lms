'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Download, Filter, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function PayrollHistoryPage() {
  const [year, setYear] = useState('2026');

  const payHistory = [
    { id: '1', period: 'Jan 1-15, 2026', grossPay: 2450.00, netPay: 1876.50, hours: 80, date: 'Jan 17, 2026' },
    { id: '2', period: 'Dec 16-31, 2025', grossPay: 2450.00, netPay: 1876.50, hours: 80, date: 'Jan 3, 2026' },
    { id: '3', period: 'Dec 1-15, 2025', grossPay: 2450.00, netPay: 1876.50, hours: 80, date: 'Dec 17, 2025' },
    { id: '4', period: 'Nov 16-30, 2025', grossPay: 2450.00, netPay: 1876.50, hours: 80, date: 'Dec 3, 2025' },
    { id: '5', period: 'Nov 1-15, 2025', grossPay: 2450.00, netPay: 1876.50, hours: 80, date: 'Nov 17, 2025' },
    { id: '6', period: 'Oct 16-31, 2025', grossPay: 2450.00, netPay: 1876.50, hours: 80, date: 'Nov 3, 2025' },
  ];

  const ytdTotals = {
    grossPay: 14700.00,
    netPay: 11259.00,
    hours: 480,
    taxes: 3441.00,
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Employee', href: '/employee' }, { label: 'Payroll', href: '/employee/payroll' }, { label: 'History' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/employee/payroll" className="inline-flex items-center text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Payroll
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payroll History</h1>
          <div className="flex items-center gap-4">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </button>
          </div>
        </div>

        {/* YTD Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Year-to-Date Summary</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-brand-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Gross Pay</p>
              <p className="text-2xl font-bold text-gray-900">${ytdTotals.grossPay.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Net Pay</p>
              <p className="text-2xl font-bold text-gray-900">${ytdTotals.netPay.toLocaleString()}</p>
            </div>
            <div className="bg-brand-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{ytdTotals.hours}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Taxes</p>
              <p className="text-2xl font-bold text-gray-900">${ytdTotals.taxes.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Pay History Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pay Period</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pay Date</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Hours</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Gross Pay</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Net Pay</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payHistory.map((pay) => (
                <tr key={pay.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">{pay.period}</td>
                  <td className="px-6 py-4 text-gray-600">{pay.date}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{pay.hours}</td>
                  <td className="px-6 py-4 text-right text-gray-600">${pay.grossPay.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">${pay.netPay.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-brand-blue-600 hover:text-brand-blue-700">
                      <Download className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
