
'use client';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState, useEffect } from 'react';
import {
  FileText,
  XCircle,
  Clock,
  Download,
  User,
  Building2,
CheckCircle, } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Document {
  id: string;
  user_id: string;
  organization_id: string | null;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  description: string | null;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  organizations?: {
    name: string;
  };
}

export default function AdminProgramHolderDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadDocuments();
  }, [filter]);

  const loadDocuments = async () => {
    try {
      let query = supabase
        .from('program_holder_documents')
        .select(
          `
          *,
          profiles:user_id (full_name, email),
          organizations:organization_id (name)
        `
        )
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('approved', false).is('approved_by', null);
      } else if (filter === 'approved') {
        query = query.eq('approved', true);
      } else if (filter === 'rejected') {
        query = query.eq('approved', false).not('approved_by', 'is', null);
      }

      const { data, error } = await query;

      if (error) { /* Condition handled */ } else if (data) {
        setDocuments(data);
      }
    } catch (error) { /* Error handled silently */ } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (docId: string, approve: boolean) => {
    setProcessing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('program_holder_documents')
        .update({
          approved: approve,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          approval_notes: approvalNotes || null,
        })
        .eq('id', docId);

      if (error) {
        alert('Failed to update document');
      } else {
        setSelectedDoc(null);
        setApprovalNotes('');
        loadDocuments();
      }
    } catch (err) {
      alert('Failed to update document');
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (doc: Document) => {
    if (doc.approved) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium bg-brand-green-100 text-brand-green-800">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
          <span className="text-slate-400 flex-shrink-0">•</span>
          Approved
        </span>
      );
    } else if (doc.approved_by) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium bg-brand-red-100 text-brand-red-800">
          <XCircle size={16} />
          Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <Clock size={16} />
          Pending
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Program Holder Documents" }]} />
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto mb-4" />
          <p className="text-black">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Program Holder Documents" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Program Holder Documents
          </h1>
          <p className="text-black">
            Review and approve documents submitted by program holders
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            {[
              {
                key: 'pending',
                label: 'Pending Review',
                count: documents.filter((d) => !d.approved && !d.approved_by)
                  .length,
              },
              {
                key: 'approved',
                label: 'Approved',
                count: documents.filter((d) => d.approved).length,
              },
              {
                key: 'rejected',
                label: 'Rejected',
                count: documents.filter((d) => !d.approved && d.approved_by)
                  .length,
              },
              { key: 'all', label: 'All Documents', count: documents.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-6 py-4 font-medium transition ${
                  filter === tab.key
                    ? 'border-b-2 border-brand-blue-600 text-brand-blue-600'
                    : 'text-black hover:text-black'
                }`}
              >
                {tab.label}
                <span className="ml-2 px-2 py-2 text-xs rounded-full bg-gray-100">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-black">No documents found</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <FileText
                      className="text-brand-blue-600 flex-shrink-0 mt-1"
                      size={32}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-black mb-1">
                        {doc.file_name}
                      </h3>
                      <p className="text-sm text-black capitalize mb-2">
                        {doc.document_type.replace(/_/g, ' ')}
                      </p>
                      {doc.description && (
                        <p className="text-sm text-black mb-2">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-black">
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {doc.profiles?.full_name || 'Unknown User'}
                        </span>
                        {doc.organizations && (
                          <span className="flex items-center gap-1">
                            <Building2 size={14} />
                            {doc.organizations.name}
                          </span>
                        )}
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(doc)}
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue-600 hover:text-brand-blue-700 font-medium flex items-center gap-1"
                    >
                      <Download size={16} />
                      View
                    </a>
                  </div>
                </div>

                {doc.approval_notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                    <strong>Admin Notes:</strong> {doc.approval_notes}
                  </div>
                )}

                {!doc.approved_by && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-black mb-2">
                          Approval Notes (Optional)
                        </label>
                        <textarea
                          value={
                            selectedDoc?.id === doc.id ? approvalNotes : ''
                          }
                          onChange={(e) => {
                            setSelectedDoc(doc);
                            setApprovalNotes(e.target.value);
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                          placeholder="Add notes about your decision..."
                        />
                      </div>
                      <div className="flex gap-2 pt-6">
                        <button
                          onClick={() => handleApprove(doc.id, true)}
                          disabled={processing}
                          className="px-4 py-2 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                          <span className="text-slate-400 flex-shrink-0">•</span>
                          Approve
                        </button>
                        <button
                          onClick={() => handleApprove(doc.id, false)}
                          disabled={processing}
                          className="px-4 py-2 bg-brand-red-600 text-white rounded-lg font-medium hover:bg-brand-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
