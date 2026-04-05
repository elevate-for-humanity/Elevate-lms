'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  Database,
  Download,
  Trash2,
  Shield,
  AlertTriangle,
  Loader2,
  FileText,
CheckCircle, } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function DataSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login?redirect=/lms/settings/data');
      return;
    }
    setLoading(false);
  };

  const handleExportData = async () => {
    setExporting(true);
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 2000));
    setExporting(false);
    alert('Your data export has been initiated. You will receive an email with a download link.');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    // In production, this would call an API to delete the account
    alert('Account deletion request submitted. You will receive a confirmation email.');
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Lms", href: "/lms" }, { label: "Data" }]} />
      </div>
<div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/lms/dashboard" className="hover:text-gray-700">LMS</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/lms/settings" className="hover:text-gray-700">Settings</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Data & Privacy</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Data & Privacy</h1>
          <p className="text-gray-600 mt-1">Manage your data and privacy settings</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Export */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-brand-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Export Your Data</h2>
              <p className="text-gray-600 mt-1 mb-4">
                Download a copy of all your personal data, including profile information, 
                course progress, certificates, and activity history.
              </p>
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Preparing Export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Request Data Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy Settings
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Profile Visibility</p>
                <p className="text-sm text-gray-500">Allow other students to see your profile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-600"></div>
              </label>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Show in Alumni Directory</p>
                <p className="text-sm text-gray-500">Appear in the alumni directory after graduation</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-600"></div>
              </label>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Activity Tracking</p>
                <p className="text-sm text-gray-500">Allow tracking of learning activity for personalized recommendations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-600"></div>
              </label>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Marketing Communications</p>
                <p className="text-sm text-gray-500">Receive promotional emails and offers</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-brand-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Data Retention</h2>
              <p className="text-gray-600 mt-1 mb-4">
                Your education records are retained in accordance with FERPA regulations and 
                accreditation requirements. Transcripts and certificates are kept permanently.
              </p>
              <div className="flex items-center gap-2 text-sm text-brand-green-600">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Your data is securely stored and encrypted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Legal Documents</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <Link href="/policies/privacy-notice" className="px-6 py-4 flex items-center justify-between hover:bg-white">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Privacy Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/policies/ferpa" className="px-6 py-4 flex items-center justify-between hover:bg-white">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">FERPA Rights</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/policies/data-retention" className="px-6 py-4 flex items-center justify-between hover:bg-white">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">Data Retention Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-brand-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-brand-red-800">Delete Account</h2>
              <p className="text-brand-red-700 mt-1 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
                Note: Some records may be retained for legal and accreditation purposes.
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete My Account
                </button>
              ) : (
                <div className="bg-white rounded-lg p-4 border border-brand-red-200">
                  <div className="flex items-center gap-2 text-brand-red-800 mb-3">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">This action is irreversible</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Type DELETE to confirm account deletion:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
                    placeholder="Type DELETE"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE'}
                      className="px-4 py-2 bg-brand-red-600 text-white rounded-lg hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
