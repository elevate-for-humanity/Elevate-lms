'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Users, 
  Building2, 
  Award, 
  FileText, 
  TrendingUp,
  Handshake,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function PartnerDashboard() {
  const [user, setUser] = useState<{ id: string; email?: string; full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'Partner';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-900 py-8 px-8 md:px-12">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              Partner Dashboard
            </h1>
            <p className="text-purple-200 mb-6">
              Welcome back, {firstName}. Manage your partnerships and programs.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/partners/training-provider" className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition">
                <Building2 className="w-6 h-6 text-white mb-2" />
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-purple-200">Programs</div>
              </Link>
              <Link href="/partners/workforce" className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition">
                <Users className="w-6 h-6 text-white mb-2" />
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-purple-200">Referrals</div>
              </Link>
              <Link href="/admin/partners" className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition">
                <Award className="w-6 h-6 text-white mb-2" />
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-purple-200">Graduates</div>
              </Link>
              <Link href="/admin/grants/opportunities" className="bg-white/10 backdrop-blur rounded-xl p-4 hover:bg-white/20 transition">
                <TrendingUp className="w-6 h-6 text-white mb-2" />
                <div className="text-2xl font-bold text-white">$0</div>
                <div className="text-sm text-purple-200">Funding Secured</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/partners/join" className="bg-white rounded-xl p-6 hover:shadow-lg transition group">
            <Handshake className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-purple-600">Become a Partner</h3>
            <p className="text-slate-600 text-sm">Join our network of training providers and workforce agencies</p>
          </Link>
          <Link href="/partners/training-provider" className="bg-white rounded-xl p-6 hover:shadow-lg transition group">
            <Building2 className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-purple-600">Training Programs</h3>
            <p className="text-slate-600 text-sm">Browse approved training programs and curricula</p>
          </Link>
          <Link href="/partners/barber-host-shop" className="bg-white rounded-xl p-6 hover:shadow-lg transition group">
            <Award className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-purple-600">Host Shop Program</h3>
            <p className="text-slate-600 text-sm">Register as a host shop for barber apprentices</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
          <div className="text-center py-12 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No recent activity</p>
            <p className="text-sm mt-1">Submit applications or referrals to get started</p>
          </div>
        </div>
      </div>
    </div>
  );
}
