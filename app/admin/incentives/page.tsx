'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, TrendingUp, Users, Award, Download } from 'lucide-react';

type Incentive = {
  id: string;
  employer_name: string;
  student_name: string;
  program_type: 'WEX' | 'OJT';
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'denied';
  start_date: string;
  end_date: string;
  hours_completed: number;
  hours_required: number;
  created_at: string;
};

export default function IncentivesPage() {
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'WEX' | 'OJT'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadIncentives();
  }, []);

  const loadIncentives = async () => {
    try {
      const response = await fetch('/api/admin/incentives');
      if (response.ok) {
        const data = await response.json();
        setIncentives(data.incentives || []);
      }
    } catch (err) {
      // Error: $1
    } finally {
      setLoading(false);
    }
  };

  const filteredIncentives = incentives.filter((inc) => {
    const typeMatch = filter === 'all' || inc.program_type === filter;
    const statusMatch = statusFilter === 'all' || inc.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const stats = {
    total: incentives.length,
    wex: incentives.filter((i) => i.program_type === 'WEX').length,
    ojt: incentives.filter((i) => i.program_type === 'OJT').length,
    totalAmount: incentives.reduce((sum, i) => sum + i.amount, 0),
    pending: incentives.filter((i) => i.status === 'pending').length,
    approved: incentives.filter((i) => i.status === 'approved').length,
    paid: incentives.filter((i) => i.status === 'paid').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Incentives" }]} />
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Incentives" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="text-brand-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8 text-brand-blue-600" />
                <h1 className="text-3xl font-bold text-black">
                  Employer Incentives
                </h1>
              </div>
              <p className="text-black">
                Track WEX and OJT employer incentive programs
              </p>
            </div>
            <Link
              href="/admin/incentives/create"
              className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 font-medium"
            >
              + New Incentive
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-brand-blue-600" />
              <h3 className="text-sm font-medium text-black">
                Total Programs
              </h3>
            </div>
            <p className="text-3xl font-bold text-brand-blue-600">
              {stats.total}
            </p>
            <p className="text-xs text-black mt-1">
              {stats.wex} WEX • {stats.ojt} OJT
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-brand-green-600" />
              <h3 className="text-sm font-medium text-black">
                Total Amount
              </h3>
            </div>
            <p className="text-3xl font-bold text-brand-green-600">
              ${stats.totalAmount.toLocaleString()}
            </p>
            <p className="text-xs text-black mt-1">Across all programs</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-brand-orange-600" />
              <h3 className="text-sm font-medium text-black">Pending</h3>
            </div>
            <p className="text-3xl font-bold text-brand-orange-600">
              {stats.pending}
            </p>
            <p className="text-xs text-black mt-1">Awaiting approval</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-600" />
              <h3 className="text-sm font-medium text-black">Paid Out</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.paid}</p>
            <p className="text-xs text-black mt-1">Completed programs</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Program Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Types</option>
                <option value="WEX">WEX (Work Experience)</option>
                <option value="OJT">OJT (On-the-Job Training)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="denied">Denied</option>
              </select>
            </div>
            <div className="ml-auto flex items-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-black rounded-md hover:bg-gray-200" aria-label="Action button">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Incentives List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredIncentives.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-black text-lg">
                No incentive programs found
              </p>
              <p className="text-black text-sm mt-2">
                Create a new incentive program to get started
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Employer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIncentives.map((incentive) => (
                  <tr key={incentive.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black">
                        {incentive.employer_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">
                        {incentive.student_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-2 text-xs rounded ${
                          incentive.program_type === 'WEX'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {incentive.program_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black">
                        ${incentive.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">
                        {incentive.hours_completed} / {incentive.hours_required}{' '}
                        hrs
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-brand-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(incentive.hours_completed / incentive.hours_required) * 100}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-2 text-xs rounded ${
                          incentive.status === 'paid'
                            ? 'bg-brand-green-100 text-green-800'
                            : incentive.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : incentive.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {incentive.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/incentives/${incentive.id}`}
                        className="text-brand-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            About WEX and OJT Programs
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>WEX (Work Experience):</strong> Provides wage subsidies to
              employers who hire and train eligible participants. Typically
              covers 50% of wages for a limited period.
            </p>
            <p>
              <strong>OJT (On-the-Job Training):</strong> Reimburses employers
              for the cost of training new employees. Usually covers up to 50%
              of wages during the training period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
