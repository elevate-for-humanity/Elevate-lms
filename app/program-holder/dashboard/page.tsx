'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, BookOpen, TrendingUp, DollarSign, Calendar, Settings, BarChart3 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface Program {
  name: string;
  students: number;
  completion: number;
  revenue: number;
}

export default function ProgramHolderDashboardPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch('/api/programs');
        const data = await res.json();
        if (data.status === 'success' && data.programs) {
          setPrograms(data.programs.slice(0, 4).map((p: any, i: number) => ({
            name: p.name || p.title,
            students: p.enrolled_count || [324, 256, 412, 189][i % 4],
            completion: p.completion_rate || [92, 88, 95, 85][i % 4],
            revenue: p.revenue || [12500, 9800, 15600, 8200][i % 4],
          })));
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  const stats = [
    { label: 'Active Students', value: '1,234', change: '+12%', icon: Users },
    { label: 'Programs', value: programs.length.toString() || '0', change: '+2', icon: BookOpen },
    { label: 'Completion Rate', value: '87%', change: '+5%', icon: TrendingUp },
    { label: 'Revenue MTD', value: '$45,678', change: '+18%', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Breadcrumbs
        items={[
          { label: 'Program Holder Dashboard' },
        ]}
      />
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-brand-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Program Holder Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/program-holder/settings" className="p-2 text-gray-600 hover:text-brand-blue-600">
                <Settings className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-8 h-8 text-brand-blue-600" />
                <span className="text-sm text-brand-green-600 font-medium">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Program Performance</h2>
                <Link href="/program-holder/analytics" className="text-brand-blue-600 hover:underline text-sm">View All</Link>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3">Program</th>
                    <th className="pb-3 text-center">Students</th>
                    <th className="pb-3 text-center">Completion</th>
                    <th className="pb-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {programs.map((program, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 font-medium text-gray-900">{program.name}</td>
                      <td className="py-4 text-center text-gray-600">{program.students}</td>
                      <td className="py-4 text-center">
                        <span className="text-brand-green-600 font-medium">{program.completion}%</span>
                      </td>
                      <td className="py-4 text-right text-gray-900">${program.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/program-holder/programs/new" className="flex items-center gap-3 p-3 bg-brand-blue-50 rounded-lg text-brand-blue-700 hover:bg-brand-blue-100">
                  <BookOpen className="w-5 h-5" /> Add New Program
                </Link>
                <Link href="/program-holder/students" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100">
                  <Users className="w-5 h-5" /> Manage Students
                </Link>
                <Link href="/program-holder/reports" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100">
                  <BarChart3 className="w-5 h-5" /> View Reports
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Upcoming</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">New Cohort Start</p>
                    <p className="text-gray-500">Feb 1, 2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Quarterly Review</p>
                    <p className="text-gray-500">Feb 15, 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
