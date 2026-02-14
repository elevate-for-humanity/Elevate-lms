'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function TimeOffPage() {
  const balances = [
    { type: 'Vacation', available: 80, used: 16, pending: 8, total: 96 },
    { type: 'Sick Leave', available: 40, used: 8, pending: 0, total: 48 },
    { type: 'Personal', available: 16, used: 0, pending: 0, total: 16 },
  ];

  const requests = [
    { id: '1', type: 'Vacation', startDate: 'Feb 15, 2026', endDate: 'Feb 19, 2026', hours: 32, status: 'Pending' },
    { id: '2', type: 'Sick Leave', startDate: 'Jan 10, 2026', endDate: 'Jan 10, 2026', hours: 8, status: 'Approved' },
    { id: '3', type: 'Vacation', startDate: 'Dec 23, 2025', endDate: 'Dec 27, 2025', hours: 40, status: 'Approved' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded flex items-center"><CheckCircle className="w-3 h-3 mr-1" />{status}</span>;
      case 'Pending':
        return <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{status}</span>;
      case 'Denied':
        return <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded flex items-center"><XCircle className="w-3 h-3 mr-1" />{status}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Employee', href: '/employee' }, { label: 'Time Off' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Time Off</h1>
            <p className="text-gray-600">Manage your leave requests and balances</p>
          </div>
          <Link href="/employee/time-off/request" className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Request Time Off
          </Link>
        </div>

        {/* Balances */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {balances.map((balance, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{balance.type}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Available</span>
                  <span className="font-bold text-green-600">{balance.available} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Used</span>
                  <span className="text-gray-900">{balance.used} hrs</span>
                </div>
                {balance.pending > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending</span>
                    <span className="text-yellow-600">{balance.pending} hrs</span>
                  </div>
                )}
                <div className="pt-3 border-t">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-brand-blue-600 h-2 rounded-full"
                      style={{ width: `${((balance.used + balance.pending) / balance.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{balance.used + balance.pending} of {balance.total} hours used</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div key={request.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <Calendar className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{request.type}</p>
                    <p className="text-sm text-gray-600">{request.startDate} - {request.endDate}</p>
                  </div>
                </div>
                <div className="text-right mr-6">
                  <p className="font-bold text-gray-900">{request.hours} hours</p>
                </div>
                {getStatusBadge(request.status)}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Preview */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Time Off</h2>
          <div className="bg-brand-blue-50 rounded-lg p-4 flex items-center">
            <Calendar className="w-8 h-8 text-brand-blue-600 mr-4" />
            <div>
              <p className="font-medium text-gray-900">Vacation: Feb 15-19, 2026</p>
              <p className="text-sm text-gray-600">32 hours • Pending approval</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
