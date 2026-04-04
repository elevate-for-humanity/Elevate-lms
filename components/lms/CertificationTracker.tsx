'use client';

import { useState, useEffect } from 'react';
import { 
  
  Clock, 
  Upload, 
  ExternalLink, 
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar
} from 'lucide-react';

interface Certification {
  id: string;
  name: string;
  provider: string;
  delivery: string;
  hours: number;
  status: 'not_started' | 'in_progress' | 'pending_review' | 'completed';
  completedAt?: string;
  expiresAt?: string;
  certificateUrl?: string;
  credentialNumber?: string;
}

interface Program {
  id: string;
  name: string;
  certifications: Certification[];
}

const PARTNER_LINKS: Record<string, string> = {
  'CareerSafe': 'https://www.careersafeonline.com',
  'HSI': 'https://www.hsi.com',
  'NRF Foundation': 'https://nrffoundation.org/riseup',
  'Certiport': 'https://certiport.pearsonvue.com',
  'IRS': 'https://www.irs.gov/individuals/link-learn-taxes',
  'Elevate LMS': '/lms/courses',
  'National Drug Screening': 'https://www.mydrugtraining.com',
  'EmployIndy': '/lms/courses/jri',
};

interface CertificationTrackerProps {
  programId: string;
  userId: string;
}

export function CertificationTracker({ programId, userId }: CertificationTrackerProps) {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCert, setExpandedCert] = useState<string | null>(null);
  const [uploadingCert, setUploadingCert] = useState<string | null>(null);

  useEffect(() => {
    fetchCertifications();
  }, [programId, userId]);

  const fetchCertifications = async () => {
    try {
      const res = await fetch(`/api/certifications/progress?programId=${programId}&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProgram(data);
      }
    } catch (error) {
      console.error('Failed to fetch certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (certId: string, file: File) => {
    setUploadingCert(certId);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('certificationId', certId);
    formData.append('userId', userId);

    try {
      const res = await fetch('/api/certifications/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchCertifications();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingCert(null);
    }
  };

  const getStatusColor = (status: Certification['status']) => {
    switch (status) {
      case 'completed': return 'text-brand-green-600 bg-brand-green-50 border-brand-green-200';
      case 'pending_review': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'in_progress': return 'text-brand-blue-600 bg-brand-blue-50 border-brand-blue-200';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: Certification['status']) => {
    switch (status) {
      case 'completed': return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'pending_review': return <Clock className="w-5 h-5 text-amber-600" />;
      case 'in_progress': return <AlertCircle className="w-5 h-5 text-brand-blue-600" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-slate-300" />;
    }
  };

  const getStatusLabel = (status: Certification['status']) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending_review': return 'Pending Review';
      case 'in_progress': return 'In Progress';
      default: return 'Not Started';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-600">No program found</p>
      </div>
    );
  }

  const completedCount = program.certifications.filter(c => c.status === 'completed').length;
  const totalCount = program.certifications.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{program.name}</h2>
            <p className="text-sm text-slate-600">Required Certifications</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{completedCount}/{totalCount}</div>
            <p className="text-sm text-slate-600">Completed</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-brand-blue-500 to-brand-green-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-slate-600 mt-2">{progressPercent}% complete</p>
      </div>

      {/* Certifications List */}
      <div className="divide-y divide-slate-100">
        {program.certifications.map((cert) => (
          <div key={cert.id} className="p-4">
            {/* Certification Row */}
            <div 
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => setExpandedCert(expandedCert === cert.id ? null : cert.id)}
            >
              {/* Status Icon */}
              {getStatusIcon(cert.status)}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 truncate">{cert.name}</h3>
                <p className="text-sm text-slate-500">{cert.provider} • {cert.hours} hours</p>
              </div>

              {/* Status Badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(cert.status)}`}>
                {getStatusLabel(cert.status)}
              </span>

              {/* Expand Icon */}
              {expandedCert === cert.id ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>

            {/* Expanded Content */}
            {expandedCert === cert.id && (
              <div className="mt-4 pl-9 space-y-4">
                {/* Delivery Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-600 mb-3">
                    <strong>Delivery:</strong> {cert.delivery}
                  </p>

                  {/* External Link */}
                  {PARTNER_LINKS[cert.provider] && cert.status !== 'completed' && (
                    <a
                      href={PARTNER_LINKS[cert.provider]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Go to {cert.provider}
                    </a>
                  )}
                </div>

                {/* Completion Details */}
                {cert.status === 'completed' && (
                  <div className="bg-brand-green-50 rounded-lg p-4 space-y-2">
                    {cert.completedAt && (
                      <p className="text-sm text-brand-green-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Completed: {new Date(cert.completedAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    {cert.expiresAt && (
                      <p className="text-sm text-brand-green-800 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Expires: {new Date(cert.expiresAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    {cert.credentialNumber && (
                      <p className="text-sm text-brand-green-800 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Credential #: {cert.credentialNumber}
                      </p>
                    )}
                    {cert.certificateUrl && (
                      <a
                        href={cert.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-brand-green-700 hover:text-brand-green-800 text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        View Certificate
                      </a>
                    )}
                  </div>
                )}

                {/* Upload Section */}
                {cert.status !== 'completed' && cert.status !== 'pending_review' && (
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-3">
                      Completed this certification? Upload your certificate for verification.
                    </p>
                    <label className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {uploadingCert === cert.id ? 'Uploading...' : 'Upload Certificate'}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(cert.id, file);
                        }}
                        disabled={uploadingCert === cert.id}
                      />
                    </label>
                  </div>
                )}

                {/* Pending Review */}
                {cert.status === 'pending_review' && (
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Your certificate is being reviewed. We'll notify you once approved.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {progressPercent === 100 && (
        <div className="p-6 bg-brand-green-50 border-t border-brand-green-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-green-100 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-brand-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-brand-green-900">Congratulations!</h3>
              <p className="text-sm text-brand-green-700">You've completed all required certifications for this program.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
