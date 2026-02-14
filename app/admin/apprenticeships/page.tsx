
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminApprenticeships() {
  const supabase = createClient();
  const [apprenticeships, setApprenticeships] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    // Load all apprenticeships with student and program info
    let query = supabase
      .from('apprenticeship_enrollments')
      .select(
        `
        *,
        student:profiles!apprenticeship_enrollments_student_id_fkey(full_name, email),
        program:programs(name, slug)
      `
      )
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data: apprenticeshipData } = await query;
    setApprenticeships(apprenticeshipData || []);

    // Load pending hour approvals
    const { data: pendingData } = await supabase
      .from('ojt_hours_log')
      .select(
        `
        *,
        student:profiles!ojt_hours_log_student_id_fkey(full_name),
        apprenticeship:apprenticeship_enrollments(employer_name)
      `
      )
      .eq('approved', false)
      .order('work_date', { ascending: false })
      .limit(20);

    setPendingApprovals(pendingData || []);
    setLoading(false);
  }

  async function approveHours(logId: string) {
    const { error } = await supabase
      .from('ojt_hours_log')
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
        approved_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', logId);

    if (!error) {
      await loadData();
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Apprenticeships" }]} />
      </div>
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] lg:h-[700px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/efh/sections/classroom.jpg"
          alt="Apprenticeships"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-2xl">
            Apprenticeships
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100 drop-shadow-lg">
            Transform your career with free training and industry certifications
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/programs"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Apprenticeship Management</h1>
          <p className="text-black mt-2">
            Monitor and manage all apprenticeships
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-black">Total Apprentices</p>
            <p className="text-3xl font-bold">{apprenticeships.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-black">Active</p>
            <p className="text-3xl font-bold text-brand-green-600">
              {apprenticeships.filter((a) => a.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-black">Pending Approvals</p>
            <p className="text-3xl font-bold text-brand-orange-600">
              {pendingApprovals.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-black">Completed</p>
            <p className="text-3xl font-bold text-brand-blue-600">
              {apprenticeships.filter((a) => a.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Pending Hour Approvals</h2>
            </div>
            <div className="divide-y">
              {pendingApprovals.map((log) => (
                <div
                  key={log.id}
                  className="p-6 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{log.student?.full_name}</p>
                    <p className="text-sm text-black">
                      {log.apprenticeship?.employer_name}
                    </p>
                    <p className="text-sm text-black">
                      {new Date(log.work_date).toLocaleDateString()} -{' '}
                      {log.total_hours?.toFixed(1)} hours
                    </p>
                    {log.student_notes && (
                      <p className="text-sm text-black mt-2">
                        Notes: {log.student_notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => approveHours(log.id)}
                    className="bg-brand-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {['all', 'active', 'completed', 'suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-3 font-semibold capitalize ${
                  filter === status
                    ? 'border-b-2 border-brand-blue-600 text-brand-blue-600'
                    : 'text-black hover:text-black'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Apprenticeships List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">All Apprenticeships</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Employer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Hours
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
              <tbody className="divide-y">
                {apprenticeships.map((apprenticeship) => {
                  const progress =
                    (apprenticeship.total_hours_completed /
                      apprenticeship.total_hours_required) *
                    100;
                  return (
                    <tr key={apprenticeship.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">
                            {apprenticeship.student?.full_name}
                          </p>
                          <p className="text-sm text-black">
                            {apprenticeship.student?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">
                          {apprenticeship.program?.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">
                            {apprenticeship.employer_name}
                          </p>
                          <p className="text-sm text-black">
                            {apprenticeship.supervisor_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold">
                          {apprenticeship.total_hours_completed.toFixed(1)}
                        </p>
                        <p className="text-sm text-black">
                          / {apprenticeship.total_hours_required}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-brand-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-black mt-1">
                          {progress.toFixed(0)}%
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-2 rounded-full text-xs font-semibold ${
                            apprenticeship.status === 'active'
                              ? 'bg-brand-green-100 text-green-800'
                              : apprenticeship.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-black'
                          }`}
                        >
                          {apprenticeship.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/apprenticeships/${apprenticeship.id}`}
                          className="text-brand-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Storytelling Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                    Your Journey Starts Here
                  </h2>
                  <p className="text-lg text-black mb-6 leading-relaxed">
                    Every great career begins with a single step. Whether you're
                    looking to change careers, upgrade your skills, or enter the
                    workforce for the first time, we're here to help you
                    succeed. Our programs are Funded, government-funded, and
                    designed to get you hired fast.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Funded training - no tuition, no hidden costs
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Industry-recognized certifications that employers value
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Job placement assistance and career support
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-black">
                        Flexible scheduling for working adults
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/efh/sections/coaching.jpg"
                    alt="Students learning"
                    fill
                    className="object-cover"
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16    text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Ready to Improve Your Career?
              </h2>
              <p className="text-base md:text-lg mb-8 text-brand-blue-100">
                Explore training programs and earn industry certifications through Elevate for
                free training programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                  Apply Now - It's Free
                </Link>
                <Link
                  href="/programs"
                  className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                  Browse All Programs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
