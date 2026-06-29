import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRight, Clock, FileText, AlertCircle, 
  CheckCircle, Upload, Shield, Users, Zap
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Transfer Hours | Apprentice Portal',
  description: 'Request to transfer hours from previous training or employment.',
};

export const dynamic = 'force-dynamic';

export default async function TransferHoursPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/transfer-hours');
  }

  // Get apprentice profile
  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('*, program:program_id(name, allows_transfer)')
    .eq('user_id', user.id)
    .maybeSingle();

  // Get transfer requests
  const { data: transferRequests } = await supabase
    .from('hour_transfer_requests')
    .select('*')
    .eq('apprentice_id', apprentice?.id)
    .order('created_at', { ascending: false });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-brand-green-500" />;
      case 'denied':
        return <AlertCircle className="w-5 h-5 text-brand-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-brand-green-100 text-brand-green-700';
      case 'denied':
        return 'bg-brand-red-100 text-brand-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const approvedHours = transferRequests
    ?.filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (r.hours_approved || 0), 0) || 0;

  const pendingHours = transferRequests
    ?.filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + (r.hours_requested || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Breadcrumbs 
            items={[{ label: 'Apprentice Portal', href: '/apprentice', className: 'text-white/70' }, { label: 'Transfer Hours', className: 'text-white' }]}
            className="text-white/70 mb-6"
          />
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Transfer Hours</h1>
              <p className="text-white/90 text-lg">
                Get credit for your previous experience and training
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-brand-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{approvedHours}</p>
                <p className="text-sm text-slate-500">Hours Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pendingHours}</p>
                <p className="text-sm text-slate-500">Hours Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">50%</p>
                <p className="text-sm text-slate-500">Max Transfer</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div className="bg-gradient-to-r from-brand-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Ready to Transfer Hours?</h2>
                <p className="text-white/80">Get credit for your past experience</p>
              </div>
            </div>
            <p className="text-white/90 mb-6 max-w-xl">
              If you have previous barber or cosmetology experience from employment or training, 
              you may be eligible to transfer up to 50% of your required hours.
            </p>
            <Link
              href="/apprentice/transfer-hours/request"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-700 px-8 py-4 rounded-xl font-bold hover:bg-white/90 transition shadow-lg"
            >
              Start Transfer Request
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">How Hour Transfers Work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">1. Gather Documents</h3>
              <p className="text-sm text-slate-600">Collect employment records, pay stubs, or training certificates</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">2. Submit Request</h3>
              <p className="text-sm text-slate-600">Complete the form and upload your documentation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">3. Get Verified</h3>
              <p className="text-sm text-slate-600">We verify your documents and approve eligible hours</p>
            </div>
          </div>
        </div>

        {/* Previous Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-8">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900">Your Transfer Requests</h2>
          </div>
          {transferRequests && transferRequests.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {transferRequests.map((request: any) => (
                <div key={request.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      request.status === 'approved' ? 'bg-brand-green-100' :
                      request.status === 'denied' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      <FileText className={`w-6 h-6 ${
                        request.status === 'approved' ? 'text-brand-green-600' :
                        request.status === 'denied' ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {request.hours_requested} hours from {request.source || 'Previous Training'}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Submitted {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    {getStatusIcon(request.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">No Transfer Requests Yet</h3>
              <p className="text-slate-500 mb-6">Start your first transfer request to get credit for your experience</p>
              <Link
                href="/apprentice/transfer-hours/request"
                className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
              >
                Start Your First Request <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Required Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Required Documentation</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Employment Verification</p>
                <p className="text-sm text-slate-500">Letter from previous employer on company letterhead</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Pay Stubs or W-2</p>
                <p className="text-sm text-slate-500">Documentation showing dates of employment</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Training Certificates</p>
                <p className="text-sm text-slate-500">Cosmetology or barber school completion records</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">Job Description</p>
                <p className="text-sm text-slate-500">Description of duties performed and skills learned</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
