
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminPayroll() {
  const router = useRouter();

  const supabase = createClient();
  const [apprenticeships, setApprenticeships] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: apprenticeshipData } = await supabase
      .from('apprenticeship_enrollments')
      .select(
        `
        *,
        student:profiles!apprenticeship_enrollments_student_id_fkey(full_name, email)
      `
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    setApprenticeships(apprenticeshipData || []);

    const { data: payrollData } = await supabase
      .from('apprentice_payroll')
      .select(
        `
        *,
        student:profiles!apprentice_payroll_student_id_fkey(full_name),
        apprenticeship:apprenticeship_enrollments(employer_name)
      `
      )
      .order('pay_period_end', { ascending: false })
      .limit(50);

    setPayrolls(payrollData || []);
    setLoading(false);
  }

  async function generatePayroll(apprenticeshipId: string) {
    setGenerating(true);

    // Calculate for last week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const { data, error }: any = await supabase.rpc('calculate_payroll', {
      p_apprenticeship_id: apprenticeshipId,
      p_period_start: startDate.toISOString().split('T')[0],
      p_period_end: endDate.toISOString().split('T')[0],
    });

    if (!error) {
      await loadData();

      // Send notification
      await fetch('/api/apprentice/email-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payroll_ready',
          apprenticeshipId,
          data: {
            periodStart: startDate.toLocaleDateString(),
            periodEnd: endDate.toLocaleDateString(),
            hours: 0, // Will be calculated
            grossPay: 0,
          },
        }),
      });
    }

    setGenerating(false);
  }

  async function markPaid(payrollId: string) {
    await supabase
      .from('apprentice_payroll')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payrollId);

    await loadData();
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Payroll" }]} />
      </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/heroes/training-provider-3.jpg"
          alt="Payroll"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-black mt-2">
            Track apprentice hours and payments
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Generate Payroll Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Generate Payroll</h2>
            <p className="text-sm text-black mt-1">
              Calculate pay for the last week
            </p>
          </div>
          <div className="divide-y">
            {apprenticeships.map((apprenticeship) => (
              <div
                key={apprenticeship.id}
                className="p-6 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">
                    {apprenticeship.student?.full_name}
                  </p>
                  <p className="text-sm text-black">
                    {apprenticeship.employer_name}
                  </p>
                  <p className="text-sm text-black">
                    Rate: ${apprenticeship.wage_current}/hr | Total Hours:{' '}
                    {apprenticeship.total_hours_completed.toFixed(1)}
                  </p>
                </div>
                <button
                  onClick={() => generatePayroll(apprenticeship.id)}
                  disabled={generating}
                  className="bg-brand-blue-600 text-white px-6 py-2 rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
                >
                  Generate Payroll
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payroll History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Payroll History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Employer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Gross Pay
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
                {payrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">
                      {payroll.student?.full_name}
                    </td>
                    <td className="px-6 py-4">
                      {payroll.apprenticeship?.employer_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(payroll.pay_period_start).toLocaleDateString()}{' '}
                      -{new Date(payroll.pay_period_end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {payroll.total_hours.toFixed(1)}
                    </td>
                    <td className="px-6 py-4">
                      ${payroll.hourly_rate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-green-600">
                      ${payroll.gross_pay.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-2 rounded-full text-xs font-semibold ${
                          payroll.status === 'paid'
                            ? 'bg-brand-green-100 text-brand-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {payroll.status === 'pending' && (
                        <button
                          onClick={() => markPaid(payroll.id)}
                          className="text-brand-blue-600 hover:text-brand-blue-800 font-medium"
                        >
                          Mark Paid
                        </button>
                      )}
                      {payroll.status === 'paid' && (
                        <span className="text-black">
                          • Paid{' '}
                          {new Date(payroll.paid_at).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Payroll Processing
                          </h2>
              <p className="text-base md:text-lg mb-8 text-brand-blue-100">
              Process instructor and staff compensation.
                          </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/admin/payroll"
                  className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                View Payroll
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
