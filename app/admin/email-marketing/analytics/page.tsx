"use client";

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

import {

  Mail,
  TrendingUp,
  TrendingDown,
  Users,
  MousePointerClick,
  Eye,
  Send,
  AlertCircle,
  Calendar,
  Download,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalSent: number;
    totalOpens: number;
    totalClicks: number;
    totalBounces: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  campaigns: Array<{
    id: string;
    name: string;
    sent: number;
    opens: number;
    clicks: number;
    openRate: number;
    clickRate: number;
    sentAt: string;
  }>;
  timeline: Array<{
    date: string;
    sent: number;
    opens: number;
    clicks: number;
  }>;
  topPerformers: Array<{
    campaign: string;
    metric: string;
    value: number;
  }>;
}



export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    // Check admin auth
    fetch('/api/auth/check-admin')
      .then((res) => res.json())
      .then((data) => {
        if (!data.isAdmin) {
          router.push('/login?redirect=/admin');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>(
    '30d'
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/email/analytics?range=${timeRange}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) { /* Error handled silently */ 
    // Error handled
  } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!data) return;

    const csv = [
      [
        'Campaign',
        'Sent',
        'Opens',
        'Clicks',
        'Open Rate',
        'Click Rate',
        'Date',
      ],
      ...data.campaigns.map((c) => [
        c.name,
        c.sent,
        c.opens,
        c.clicks,
        `${c.openRate}%`,
        `${c.clickRate}%`,
        new Date(c.sentAt).toLocaleDateString(),
      ]),
    ]
      .map((row: any) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-analytics-${timeRange}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative h-[500px] md:h-[600px] lg:h-[700px] flex items-center justify-center text-white overflow-hidden">
          <Image
            src="/images/trades/program-construction-training.jpg"
            alt="Analytics"
            fill
            className="object-cover"
            quality={100}
            priority
            sizes="100vw"
          />

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-2xl">
              Analytics
            </h1>
            <p className="text-base md:text-lg mb-8 text-gray-100 drop-shadow-lg">
              Transform your career with free training and industry
              certifications
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

        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto mb-4" />
          <p className="text-black">Loading analytics...</p>

          {/* CTA Section */}
          <section className="py-16    text-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                  Ready to Improve Your Career?
                </h2>
                <p className="text-base md:text-lg mb-8 text-blue-100">
                  Join thousands who have launched successful careers through
                  our free training programs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/contact"
                    className="bg-white text-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                  >
                    Apply Now - It's Free
                  </Link>
                  <Link
                    href="/programs"
                    className="bg-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
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

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-black mx-auto mb-4" />
          <p className="text-black">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Analytics" }]} />
      </div>
{/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Email Analytics
              </h1>
              <p className="text-black mt-1">
                Track campaign performance and engagement
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setTimeRange(e.target.value as '7d' | '30d' | '90d' | 'all')
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>

              <button
                onClick={exportData}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Sent"
            value={data.overview.totalSent.toLocaleString()}
            icon={Send}
            color="blue"
            trend={null}
          />
          <StatCard
            title="Open Rate"
            value={`${data.overview.openRate.toFixed(1)}%`}
            icon={Eye}
            color="green"
            trend={
              data.overview.openRate > 40
                ? 'up'
                : data.overview.openRate < 30
                  ? 'down'
                  : null
            }
          />
          <StatCard
            title="Click Rate"
            value={`${data.overview.clickRate.toFixed(1)}%`}
            icon={MousePointerClick}
            color="purple"
            trend={
              data.overview.clickRate > 8
                ? 'up'
                : data.overview.clickRate < 5
                  ? 'down'
                  : null
            }
          />
          <StatCard
            title="Bounce Rate"
            value={`${data.overview.bounceRate.toFixed(1)}%`}
            icon={AlertCircle}
            color="red"
            trend={
              data.overview.bounceRate < 2
                ? 'up'
                : data.overview.bounceRate > 5
                  ? 'down'
                  : null
            }
          />
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-black">Total Opens</h3>
              <Eye className="w-5 h-5 text-brand-green-600" />
            </div>
            <div className="text-3xl font-bold text-black mb-2">
              {data.overview.totalOpens.toLocaleString()}
            </div>
            <div className="text-sm text-black">
              {data.overview.openRate.toFixed(1)}% of emails sent
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-black">Total Clicks</h3>
              <MousePointerClick className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-black mb-2">
              {data.overview.totalClicks.toLocaleString()}
            </div>
            <div className="text-sm text-black">
              {data.overview.clickRate.toFixed(1)}% of emails sent
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-black">Total Bounces</h3>
              <AlertCircle className="w-5 h-5 text-brand-orange-600" />
            </div>
            <div className="text-3xl font-bold text-black mb-2">
              {data.overview.totalBounces.toLocaleString()}
            </div>
            <div className="text-sm text-black">
              {data.overview.bounceRate.toFixed(1)}% of emails sent
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="font-semibold text-black mb-6">
            Performance Timeline
          </h3>
          <div className="space-y-4">
            {data.timeline.map((day, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-black">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(day.sent / Math.max(...data.timeline.map((d) => d.sent))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-black w-16 text-right">
                      {day.sent} sent
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-brand-green-600 h-2 rounded-full"
                        style={{
                          width: `${(day.opens / Math.max(...data.timeline.map((d) => d.opens))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-black w-16 text-right">
                      {day.opens} opens
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(day.clicks / Math.max(...data.timeline.map((d) => d.clicks))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-black w-16 text-right">
                      {day.clicks} clicks
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Performance Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-black">
              Campaign Performance
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Opens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Open Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Click Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black">
                        {campaign.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {campaign.sent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {campaign.opens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {campaign.clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.openRate > 40
                            ? 'bg-brand-green-100 text-green-800'
                            : campaign.openRate > 30
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {campaign.openRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.clickRate > 8
                            ? 'bg-brand-green-100 text-green-800'
                            : campaign.clickRate > 5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {campaign.clickRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {new Date(campaign.sentAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'red';
  trend: 'up' | 'down' | null;
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'text-brand-blue-600 bg-blue-50',
    green: 'text-brand-green-600 bg-green-50',
    purple: 'text-blue-600 bg-blue-50',
    red: 'text-brand-orange-600 bg-red-50',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div
            className={`flex items-center space-x-1 ${trend === 'up' ? 'text-brand-green-600' : 'text-brand-orange-600'}`}
          >
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-black mb-1">{value}</div>
      <div className="text-sm text-black">{title}</div>
    </div>
  );
}
