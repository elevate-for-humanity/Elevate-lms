'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  Award, 
  ExternalLink, 
  Download,
  Clock,
  Shield,
CheckCircle, } from 'lucide-react';

interface Credential {
  id: string;
  title: string;
  issueDate: string;
  expiryDate?: string;
  status: 'active' | 'pending' | 'expired';
  verificationUrl?: string;
  certificateUrl?: string;
}

export default function CredentialsView({ userId }: { userId?: string }) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCredentials() {
      const supabase = createClient();
      
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id;
      }

      if (!targetUserId) {
        setLoading(false);
        return;
      }

      // Fetch certificates/credentials
      const { data: certs } = await supabase
        .from('certificates')
        .select('id, title, issued_at, expires_at, status, verification_code, certificate_url')
        .eq('user_id', targetUserId)
        .order('issued_at', { ascending: false });

      if (certs && certs.length > 0) {
        setCredentials(certs.map((cert: any) => ({
          id: cert.id,
          title: cert.title,
          issueDate: cert.issued_at,
          expiryDate: cert.expires_at,
          status: cert.status || 'active',
          verificationUrl: cert.verification_code ? `/verify/${cert.verification_code}` : undefined,
          certificateUrl: cert.certificate_url,
        })));
      }

      setLoading(false);
    }

    fetchCredentials();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 mb-2">No Credentials Yet</h3>
        <p className="text-slate-600 mb-4">Complete your program to earn credentials</p>
        <Link 
          href="/programs"
          className="text-brand-blue-600 font-medium hover:underline"
        >
          Browse Programs →
        </Link>
      </div>
    );
  }

  const statusConfig = {
    active: { label: 'Active', color: 'text-brand-green-700', bg: 'bg-brand-green-100', icon: CheckCircle },
    pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
    expired: { label: 'Expired', color: 'text-brand-red-700', bg: 'bg-brand-red-100', icon: Clock },
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Your Credentials
        </h3>
        <span className="text-sm text-slate-500">{credentials.length} total</span>
      </div>

      <div className="divide-y divide-slate-100">
        {credentials.map((credential) => {
          const status = statusConfig[credential.status];
          const StatusIcon = status.icon;

          return (
            <div key={credential.id} className="p-4 hover:bg-slate-50 transition">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-slate-900">{credential.title}</h4>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-3">
                Issued: {new Date(credential.issueDate).toLocaleDateString()}
                {credential.expiryDate && ` • Expires: ${new Date(credential.expiryDate).toLocaleDateString()}`}
              </p>

              <div className="flex items-center gap-3">
                {credential.verificationUrl && (
                  <Link
                    href={credential.verificationUrl}
                    className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:text-brand-blue-700"
                  >
                    <Shield className="w-4 h-4" />
                    Verify
                  </Link>
                )}
                {credential.certificateUrl && (
                  <a
                    href={credential.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Public Verification Note */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          All credentials include public verification links for employers
        </p>
      </div>
    </div>
  );
}
