import { Metadata } from 'next';
import Link from 'next/link';
import { Settings, Users, BookOpen, BarChart3, FileText, Bell, Shield, Database, Palette, Layout } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Studio | Elevate for Humanity',
  description: 'Platform administration and configuration tools.',
};

export default function AdminStudioPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-800 text-white p-6">
        <h1 className="text-2xl font-bold">Admin Studio</h1>
        <p className="text-slate-400">Platform configuration and management</p>
      </div>
      <div className="p-6">
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
            <Settings className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Platform Settings</h3>
            <p className="text-slate-600 text-sm">Configure platform settings and preferences</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
            <Users className="w-10 h-10 text-green-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">User Management</h3>
            <p className="text-slate-600 text-sm">Manage users, roles, and permissions</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
            <BookOpen className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Content Manager</h3>
            <p className="text-slate-600 text-sm">Manage courses and learning content</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
            <BarChart3 className="w-10 h-10 text-orange-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Analytics</h3>
            <p className="text-slate-600 text-sm">View platform metrics and reports</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
            <FileText className="w-10 h-10 text-red-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Documents</h3>
            <p className="text-slate-600 text-sm">Manage templates and documents</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
            <Bell className="w-10 h-10 text-yellow-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Notifications</h3>
            <p className="text-slate-600 text-sm">Configure alerts and notifications</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
            <Shield className="w-10 h-10 text-indigo-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Security</h3>
            <p className="text-slate-600 text-sm">Manage security settings and audit logs</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
            <Database className="w-10 h-10 text-teal-600 mb-4" />
            <h3 className="font-bold text-lg mb-2">Database</h3>
            <p className="text-slate-600 text-sm">Database management tools</p>
          </div>
        </div>
      </div>
    </div>
  );
}
