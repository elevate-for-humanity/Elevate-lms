'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DollarSign, Calendar, Download, FileText, Clock, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function PayrollPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const payStubs = [
    { id: '1', period: 'Jan 1-15, 2026', grossPay: 2450.00, netPay: 1876.50, status: 'Paid', date: 'Jan 17, 2026' },
    { id: '2', period: 'Dec 16-31, 2025', grossPay: 2450.00, netPay: 1876.50, status: 'Paid', date: 'Jan 3, 2026' },
    { id: '3', period: 'Dec 1-15, 2025', grossPay: 2450.00, netPay: 1876.50, status: 'Paid', date: 'Dec 17, 2025' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Employee', href: '/employee' }, { label: 'Payroll' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
            <p className="text-gray-600">View your pay stubs and earnings</p>
          </div>
          <Link href="/employee/payroll/history" className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            View History
          </Link>
        </div>

        {/* Current Pay Period */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Current Pay Period</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-brand-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Pay Period</p>
              <p className="text-lg font-bold text-gray-900">Jan 16-31, 2026</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Hours Worked</p>
              <p className="text-lg font-bold text-gray-900">72 hours</p>
            </div>
            <div className="bg-brand-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Estimated Gross</p>
              <p className="text-lg font-bold text-gray-900">$2,450.00</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Pay Date</p>
              <p className="text-lg font-bold text-gray-900">Feb 1, 2026</p>
            </div>
          </div>
        </div>

        {/* Recent Pay Stubs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-900">Recent Pay Stubs</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {payStubs.map((stub) => (
              <div key={stub.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{stub.period}</p>
                    <p className="text-sm text-gray-600">Paid on {stub.date}</p>
                  </div>
                </div>
                <div className="text-right mr-6">
                  <p className="text-sm text-gray-600">Gross: ${stub.grossPay.toFixed(2)}</p>
                  <p className="font-bold text-gray-900">Net: ${stub.netPay.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {stub.status}
                  </span>
                  <button className="p-2 text-gray-400 hover:text-brand-blue-600 transition">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax Documents */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tax Documents</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-brand-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">W-2 (2025)</p>
                  <p className="text-sm text-gray-600">Available Jan 31, 2026</p>
                </div>
              </div>
              <button className="text-gray-400" disabled>
                <Download className="w-5 h-5" />
              </button>
            </div>
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-brand-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">W-4</p>
                  <p className="text-sm text-gray-600">Update withholdings</p>
                </div>
              </div>
              <Link href="/employee/documents" className="text-brand-blue-600 hover:text-brand-blue-700">
                Edit
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
