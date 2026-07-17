import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Revenue Analytics | Elevate For Humanity' };

function fmtUsd(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

export default async function RevenueAnalyticsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

  // Payments from payment_transactions
  const { data: allPayments } = await db
    .from('payment_transactions')
    .select(
      'amount, status, created_at, program_id, programs!payment_transactions_program_id_fkey(title)',
    )
    .eq('status', 'completed')
    .gte('created_at', startOfYear)
    .order('created_at', { ascending: false });

  const payments = allPayments || [];

  const totalYTD = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const thisMonth = payments
    .filter((p: any) => p.created_at >= startOfMonth)
    .reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const lastMonth = payments
    .filter((p: any) => p.created_at >= startOfLastMonth && p.created_at < startOfMonth)
    .reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const momChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  // Revenue by program
  const byProgram: Record<string, { title: string; total: number; count: number }> = {};
  for (const p of payments) {
    const key = p.program_id || 'unknown';
    if (!byProgram[key])
      byProgram[key] = { title: (p.programs as any)?.title || 'Unknown', total: 0, count: 0 };
    byProgram[key].total += p.amount || 0;
    byProgram[key].count += 1;
  }
  const programRevenue = Object.values(byProgram)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Monthly breakdown for current year
  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), i, 1);
    const monthStr = month.toISOString().slice(0, 7);
    const total = payments
      .filter((p: any) => p.created_at.startsWith(monthStr))
      .reduce((s: number, p: any) => s + (p.amount || 0), 0);
    return { month: month.toLocaleString('en-US', { month: 'short' }), total };
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2 text-slate-700">
            <li>
              <Link href="/admin" className="hover:text-primary">
                Admin
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/admin/analytics" className="hover:text-primary">
                Analytics
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 font-medium">Revenue</li>
          </ol>
        </nav>
        <h1 className="text-3xl font-bold mb-2">Revenue Analytics</h1>
        <p className="text-slate-700 mb-8">Payment transactions — current year</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            ['YTD Revenue', fmtUsd(totalYTD), null],
            [
              'This Month',
              fmtUsd(thisMonth),
              `${momChange >= 0 ? '+' : ''}${momChange}% vs last month`,
            ],
            ['Last Month', fmtUsd(lastMonth), null],
          ].map(([label, value, sub]) => (
            <div key={label as string} className="bg-white rounded-lg shadow-sm border p-6">
              <p className="text-sm text-slate-700">{label}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
              {sub && (
                <p className={`text-xs mt-1 ${momChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {sub}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="font-semibold mb-4">Revenue by Program</h2>
            {programRevenue.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-700 border-b">
                    <th className="pb-2">Program</th>
                    <th className="pb-2 text-right">Revenue</th>
                    <th className="pb-2 text-right">Txns</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {programRevenue.map((p) => (
                    <tr key={p.title}>
                      <td className="py-2">{p.title}</td>
                      <td className="py-2 text-right font-medium">{fmtUsd(p.total)}</td>
                      <td className="py-2 text-right text-slate-700">{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-700 text-sm">No payment data yet.</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="font-semibold mb-4">Monthly Breakdown ({now.getFullYear()})</h2>
            <div className="space-y-2">
              {monthlyTotals.map(({ month, total }) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 w-8">{month}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-brand-blue-500 h-2 rounded-full"
                      style={{
                        width:
                          totalYTD > 0 ? `${Math.round((total / totalYTD) * 100 * 12)}%` : '0%',
                        maxWidth: '100%',
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-20 text-right">{fmtUsd(total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
