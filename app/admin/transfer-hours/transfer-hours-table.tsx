"use client";

import React from 'react';

import { useState } from 'react';
import { approveTransferHours, denyTransferHours } from './actions';

interface TransferHour {
  id: string;
  enrollment_id: string;
  hours_requested: number;
  hours_approved?: number;
  category?: string;
  evidence_description?: string;
  evidence_file_url?: string;
  status: string;
  reviewed_at?: string;
  notes?: string;
  created_at: string;
  enrollment?: {
    student?: {
      full_name: string;
      email: string;
    };
    program?: {
      name: string;
      slug: string;
    };
  };
}

export function TransferHoursTable({
  transferHours,
}: {
  transferHours: TransferHour[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'approved' | 'denied'
  >('all');
  const [selectedRequest, setSelectedRequest] = useState<TransferHour | null>(
    null
  );
  const [approvalHours, setApprovalHours] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredRequests = transferHours.filter((request) => {
    const studentName =
      request.enrollment?.student?.full_name?.toLowerCase() || '';
    const programName = request.enrollment?.program?.name?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      studentName.includes(searchLower) || programName.includes(searchLower);
    const matchesFilter =
      filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-brand-green-100 text-brand-green-800';
      case 'denied':
        return 'bg-brand-red-100 text-brand-red-800';
      default:
        return 'bg-gray-100 text-black';
    }
  };

  async function handleApprove() {
    if (!selectedRequest) return;
    setLoading(true);

    try {
      await approveTransferHours(
        selectedRequest.id,
        parseFloat(approvalHours) || selectedRequest.hours_requested,
        approvalNotes
      );
      setSelectedRequest(null);
      setApprovalHours('');
      setApprovalNotes('');
      window.location.reload();
    } catch (error) { /* Error handled silently */ 
      alert('Failed to approve request');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeny() {
    if (!selectedRequest) return;
    setLoading(true);

    try {
      await denyTransferHours(selectedRequest.id, approvalNotes);
      setSelectedRequest(null);
      setApprovalNotes('');
      window.location.reload();
    } catch (error) { /* Error handled silently */ 
      alert('Failed to deny request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Filters */}
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by student or program..."
              value={searchTerm}
              onChange={(
                e: React.ChangeEvent<
                  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >
              ) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
            <select
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilterStatus(
                  e.target.value as 'all' | 'pending' | 'approved' | 'denied'
                )
              }
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Hours Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Hours Approved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-black"
                  >
                    No transfer hour requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-black">
                          {request.enrollment?.student?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-black">
                          {request.enrollment?.student?.email || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {request.enrollment?.program?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {request.category || 'General'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-black">
                      {request.hours_requested}h
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {request.hours_approved
                        ? `${request.hours_approved}h`
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-2 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-brand-blue-600 hover:text-brand-blue-900"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination info */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <p className="text-sm text-black">
            Showing{' '}
            <span className="font-medium">{filteredRequests.length}</span> of{' '}
            <span className="font-medium">{transferHours.length}</span> requests
          </p>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-black">
                Review Transfer Hours Request
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Student Info */}
              <div>
                <h3 className="font-semibold text-black mb-2">
                  Student Information
                </h3>
                <p className="text-black">
                  {selectedRequest.enrollment?.student?.full_name}
                </p>
                <p className="text-sm text-black">
                  {selectedRequest.enrollment?.student?.email}
                </p>
              </div>

              {/* Program Info */}
              <div>
                <h3 className="font-semibold text-black mb-2">Program</h3>
                <p className="text-black">
                  {selectedRequest.enrollment?.program?.name}
                </p>
              </div>

              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-black mb-1">
                    Hours Requested
                  </h3>
                  <p className="text-2xl font-bold text-brand-blue-600">
                    {selectedRequest.hours_requested}h
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-black mb-1">Category</h3>
                  <p className="text-black">
                    {selectedRequest.category || 'General'}
                  </p>
                </div>
              </div>

              {/* Evidence */}
              {selectedRequest.evidence_description && (
                <div>
                  <h3 className="font-semibold text-black mb-2">
                    Evidence Description
                  </h3>
                  <p className="text-black whitespace-pre-wrap">
                    {selectedRequest.evidence_description}
                  </p>
                </div>
              )}

              {selectedRequest.evidence_file_url && (
                <div>
                  <h3 className="font-semibold text-black mb-2">
                    Evidence File
                  </h3>
                  <a
                    href={selectedRequest.evidence_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue-600 hover:underline"
                  >
                    View Evidence File
                  </a>
                </div>
              )}

              {/* Approval Form */}
              {selectedRequest.status === 'pending' && (
                <div className="pt-4 border-t space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Hours to Approve
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={selectedRequest.hours_requested}
                      step="0.5"
                      value={approvalHours}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApprovalHours(e.target.value)}
                      placeholder={`Max: ${selectedRequest.hours_requested}`}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                    />
                    <p className="text-sm text-black mt-1">
                      Leave empty to approve full amount
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Review Notes
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(
                        e: React.ChangeEvent<
                          | HTMLInputElement
                          | HTMLSelectElement
                          | HTMLTextAreaElement
                        >
                      ) => setApprovalNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                      placeholder="Add notes about your decision..."
                    />
                  </div>
                </div>
              )}

              {/* Existing Review */}
              {selectedRequest.status !== 'pending' && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-black mb-2">
                    Review Decision
                  </h3>
                  <p className="text-black">
                    <span className="font-medium">Status:</span>{' '}
                    <span
                      className={`px-2 py-2 text-xs font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}
                    >
                      {selectedRequest.status}
                    </span>
                  </p>
                  {selectedRequest.hours_approved && (
                    <p className="text-black mt-2">
                      <span className="font-medium">Hours Approved:</span>{' '}
                      {selectedRequest.hours_approved}h
                    </p>
                  )}
                  {selectedRequest.notes && (
                    <p className="text-black mt-2">
                      <span className="font-medium">Notes:</span>{' '}
                      {selectedRequest.notes}
                    </p>
                  )}
                  {selectedRequest.reviewed_at && (
                    <p className="text-sm text-black mt-2">
                      Reviewed on{' '}
                      {new Date(selectedRequest.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setApprovalHours('');
                  setApprovalNotes('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-100 font-medium"
              >
                Close
              </button>
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={handleDeny}
                    disabled={loading}
                    className="px-6 py-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Deny'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="px-6 py-2 bg-brand-green-600 hover:bg-brand-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
