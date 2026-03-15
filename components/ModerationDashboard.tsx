"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  XCircle,
  Flag,
  Eye,
  Trash2,
  MessageSquare,
  Filter,
  TrendingUp,
CheckCircle, } from 'lucide-react';

interface ModerationReport {
  id: string;
  content_type: string;
  content_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
  reporter?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function ModerationDashboard() {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/moderation?action=pending&limit=100');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/moderation?action=stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    }
  };

  const handleReview = async (reportId: string, action: string, notes?: string) => {
    try {
      const response = await fetch('/api/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          reportId,
          moderationAction: action,
          notes,
        }),
      });

      if (response.ok) {
        // Refresh reports
        fetchReports();
        fetchStats();
        setSelectedReport(null);
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to process review');
    }
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-100 text-yellow-800',
      harassment: 'bg-brand-red-100 text-brand-red-800',
      inappropriate: 'bg-brand-orange-100 text-brand-orange-800',
      copyright: 'bg-purple-100 text-purple-800',
      misinformation: 'bg-brand-blue-100 text-brand-blue-800',
      hate_speech: 'bg-brand-red-100 text-brand-red-800',
      violence: 'bg-brand-red-100 text-brand-red-800',
      other: 'bg-gray-100 text-black',
    };

    return (
      <span className={`px-2 py-2 rounded-full text-xs font-medium ${colors[reason] || colors.other}`}>
        {reason.replace('_', ' ')}
      </span>
    );
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return '📚';
      case 'discussion':
        return '💬';
      case 'comment':
        return '💭';
      case 'review':
        return '⭐';
      case 'message':
        return '✉️';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Content Moderation</h1>
          <p className="text-black">Review and manage reported content</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-brand-blue-600" />
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black">Total Reports</p>
                <p className="text-2xl font-bold text-black">{stats.totalReports}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</p>
              </div>
              <Flag className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black">Approved</p>
                <p className="text-2xl font-bold text-brand-green-600">{stats.approvedReports}</p>
              </div>
              <span className="text-slate-500 flex-shrink-0">•</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black">Avg Review Time</p>
                <p className="text-2xl font-bold text-brand-blue-600">
                  {stats.averageReviewTime.toFixed(1)}h
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-brand-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            {['all', 'spam', 'harassment', 'inappropriate', 'copyright'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-gray-100 text-black hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map(report => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getContentTypeIcon(report.content_type)}</span>
                      <div>
                        <div className="text-sm font-medium text-black">
                          {report.content_type}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {report.content_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getReasonBadge(report.reason)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-black">
                      {report.reporter?.first_name} {report.reporter?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {report.reporter?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-brand-blue-600 hover:text-brand-blue-800"
                        title="Review"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReview(report.id, 'approve')}
                        className="text-brand-green-600 hover:text-brand-green-800"
                        title="Approve"
                      >
                        <span className="text-slate-500 flex-shrink-0">•</span>
                      </button>
                      <button
                        onClick={() => handleReview(report.id, 'remove')}
                        className="text-brand-orange-600 hover:text-brand-red-800"
                        title="Remove"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-black">No pending reports</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-black">Review Report</h3>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="text-sm font-medium text-black">Content Type</label>
                <p className="text-black">{selectedReport.content_type}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-black">Reason</label>
                <div className="mt-1">{getReasonBadge(selectedReport.reason)}</div>
              </div>

              {selectedReport.description && (
                <div>
                  <label className="text-sm font-medium text-black">Description</label>
                  <p className="text-black mt-1">{selectedReport.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-black">Reporter</label>
                <p className="text-black">
                  {selectedReport.reporter?.first_name} {selectedReport.reporter?.last_name}
                </p>
                <p className="text-sm text-gray-500">{selectedReport.reporter?.email}</p>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(selectedReport.id, 'approve', 'Content approved after review')}
                className="flex-1 px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleReview(selectedReport.id, 'remove', 'Content removed for policy violation')}
                className="flex-1 px-4 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
