"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  AlertCircle,
  Download,
  Mail,
  FileText,
  Award,
CheckCircle, } from 'lucide-react';

interface TrainingRecord {
  id: string;
  user_id: string;
  quiz_score: number;
  completed_at: string;
  expires_at: string;
  status: string;
  profiles: {
    full_name: string;
    email: string;
    role: string;
  };
}

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface FERPATrainingDashboardProps {
  trainingRecords: TrainingRecord[];
  pendingUsers: PendingUser[];
  currentUser: any;
}

export default function FERPATrainingDashboard({
  trainingRecords: initialRecords,
  pendingUsers: initialPending,
  currentUser
}: FERPATrainingDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'expired' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>(initialRecords);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>(initialPending);
  const supabase = createClient();

  // Load fresh training data from DB
  useEffect(() => {
    async function loadTrainingData() {
      // Fetch completed training records
      const { data: records } = await supabase
        .from('ferpa_training')
        .select(`
          id, user_id, quiz_score, completed_at, expires_at, status,
          profiles:user_id (full_name, email, role)
        `)
        .order('completed_at', { ascending: false });
      
      if (records) setTrainingRecords(records as any);

      // Fetch users without training
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .in('role', ['admin', 'instructor', 'staff']);
      
      if (allUsers && records) {
        const trainedUserIds = records.map((r: any) => r.user_id);
        const pending = allUsers.filter(u => !trainedUserIds.includes(u.id));
        setPendingUsers(pending);
      }
    }
    loadTrainingData();
  }, [supabase]);

  // Calculate statistics
  const totalStaff = trainingRecords.length + pendingUsers.length;
  const completedCount = trainingRecords.filter(r => r.status === 'completed' && new Date(r.expires_at) > new Date()).length;
  const expiredCount = trainingRecords.filter(r => new Date(r.expires_at) <= new Date()).length;
  const pendingCount = pendingUsers.length;
  const complianceRate = totalStaff > 0 ? Math.round((completedCount / totalStaff) * 100) : 0;

  // Filter records
  const filteredRecords = trainingRecords.filter(record => {
    const matchesSearch = record.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.profiles.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'completed') {
      return matchesSearch && record.status === 'completed' && new Date(record.expires_at) > new Date();
    } else if (filter === 'expired') {
      return matchesSearch && new Date(record.expires_at) <= new Date();
    }
    return matchesSearch;
  });

  const filteredPending = pendingUsers.filter(user => {
    return user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sendReminder = async (userId: string, email: string) => {
    try {
      await fetch('/api/ferpa/training/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, email })
      });
      alert('Reminder sent successfully');
    } catch (error) { /* Error handled silently */ 
      alert('Failed to send reminder');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                FERPA Training Management
              </h1>
              <p className="text-black mt-1">
                Monitor and manage FERPA training compliance
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/ferpa"
                className="px-4 py-2 text-black hover:text-black font-medium"
              >
                FERPA Portal
              </Link>
              <Link
                href="/admin"
                className="px-4 py-2 text-black hover:text-black font-medium"
              >
                Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-brand-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-black">{totalStaff}</div>
            <div className="text-sm text-black mt-1">Total Staff</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-green-100 rounded-lg">
                <span className="text-slate-500 flex-shrink-0">•</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-green-600">{completedCount}</div>
            <div className="text-sm text-black mt-1">Completed</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-brand-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-orange-600">{expiredCount}</div>
            <div className="text-sm text-black mt-1">Expired</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-brand-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-orange-600">{pendingCount}</div>
            <div className="text-sm text-black mt-1">Pending</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600">{complianceRate}%</div>
            <div className="text-sm text-black mt-1">Compliance Rate</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-slate-100 text-black hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'completed'
                    ? 'bg-brand-green-600 text-white'
                    : 'bg-slate-100 text-black hover:bg-slate-200'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilter('expired')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'expired'
                    ? 'bg-brand-orange-600 text-white'
                    : 'bg-slate-100 text-black hover:bg-slate-200'
                }`}
              >
                Expired
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'pending'
                    ? 'bg-brand-orange-600 text-white'
                    : 'bg-slate-100 text-black hover:bg-slate-200'
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* Training Records Table */}
        {(filter === 'all' || filter === 'completed' || filter === 'expired') && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-black">Training Records</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredRecords.map((record) => {
                    const isExpired = new Date(record.expires_at) <= new Date();
                    return (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-black">
                            {record.profiles.full_name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {record.profiles.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-2 text-xs font-medium rounded-full bg-brand-blue-100 text-brand-blue-800">
                            {record.profiles.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            record.quiz_score >= 90 ? 'text-brand-green-600' :
                            record.quiz_score >= 80 ? 'text-brand-blue-600' :
                            'text-brand-orange-600'
                          }`}>
                            {record.quiz_score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {new Date(record.completed_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {new Date(record.expires_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isExpired ? (
                            <span className="px-2 py-2 text-xs font-medium rounded-full bg-brand-red-100 text-brand-red-800">
                              Expired
                            </span>
                          ) : (
                            <span className="px-2 py-2 text-xs font-medium rounded-full bg-brand-green-100 text-brand-green-800">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <Link
                              href={`/ferpa/training/certificate/${record.id}`}
                              className="text-brand-blue-600 hover:text-brand-blue-800"
                              title="View Certificate"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                            {isExpired && (
                              <button
                                onClick={() => sendReminder(record.user_id, record.profiles.email)}
                                className="text-brand-orange-600 hover:text-brand-orange-800"
                                title="Send Reminder"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredRecords.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No training records found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Users Table */}
        {(filter === 'all' || filter === 'pending') && pendingCount > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-black">Pending Training</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Hired Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Days Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredPending.map((user) => {
                    const daysPending = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-black">
                            {user.full_name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-2 text-xs font-medium rounded-full bg-brand-blue-100 text-brand-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            daysPending > 30 ? 'text-brand-orange-600' :
                            daysPending > 14 ? 'text-brand-orange-600' :
                            'text-black'
                          }`}>
                            {daysPending} days
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => sendReminder(user.id, user.email)}
                            className="text-brand-blue-600 hover:text-brand-blue-800 flex items-center gap-1"
                          >
                            <Mail className="w-4 h-4" />
                            Send Reminder
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
