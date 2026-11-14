import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, Clock, User, Edit } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SOP Details | Elevate Admin',
  description: 'Standard operating procedure details.',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SOPDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Standard Operating Procedure</h1>
                <p className="text-sm text-slate-500">ID: {id}</p>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors">
              <Edit className="w-4 h-4" />
              Edit SOP
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-6 text-sm text-slate-500 mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Created by: Admin
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Last updated: Recently
                </div>
              </div>
              <div className="prose prose-slate max-w-none">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-slate-700 mb-2">SOP Content</h2>
                  <p className="text-slate-500">Standard operating procedure content will appear here.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
