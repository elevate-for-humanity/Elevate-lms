"use client";

import { useState, useEffect } from 'react';
import { Download, Share2, Printer, Loader2, ExternalLink, Copy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CertificateData {
  id: string;
  student_name: string;
  program_name: string;
  course_name?: string;
  issue_date: string;
  expiry_date?: string;
  certificate_number: string;
  verification_code: string;
  credential_type: string;
  issuer_name: string;
  issuer_title: string;
  hours_completed?: number;
  grade?: string;
}

interface Props {
  certificateId?: string;
  student?: string;
  program?: string;
  date?: string;
  onDownload?: () => void;
}

export default function CertificateDownload({
  certificateId,
  student,
  program,
  date,
  onDownload,
}: Props) {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(!!certificateId);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch certificate data from database
  useEffect(() => {
    if (!certificateId) {
      // Use props if no certificateId
      if (student && program && date) {
        setCertificate({
          id: 'preview',
          student_name: student,
          program_name: program,
          issue_date: date,
          certificate_number: 'PREVIEW-000',
          verification_code: 'PREVIEW',
          credential_type: 'Certificate of Completion',
          issuer_name: 'Program Director',
          issuer_title: 'Director of Training',
        });
      }
      setLoading(false);
      return;
    }

    async function fetchCertificate() {
      const supabase = createClient();

      try {
        const { data, error: fetchError } = await supabase
          .from('certificates')
          .select(`
            id,
            certificate_number,
            verification_code,
            credential_type,
            issue_date,
            expiry_date,
            hours_completed,
            grade,
            profiles!certificates_user_id_fkey(full_name),
            training_programs(name),
            courses(title)
          `)
          .eq('id', certificateId)
          .single();

        if (fetchError) throw fetchError;

        setCertificate({
          id: data.id,
          student_name: (data.profiles as any)?.full_name || 'Student',
          program_name: (data.training_programs as any)?.name || (data.courses as any)?.title || 'Program',
          course_name: (data.courses as any)?.title,
          issue_date: data.issue_date,
          expiry_date: data.expiry_date,
          certificate_number: data.certificate_number,
          verification_code: data.verification_code,
          credential_type: data.credential_type || 'Certificate of Completion',
          issuer_name: 'Program Director',
          issuer_title: 'Director of Training',
          hours_completed: data.hours_completed,
          grade: data.grade,
        });
      } catch (err: any) {
        console.error('Error fetching certificate:', err);
        setError('Failed to load certificate');
      } finally {
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [certificateId, student, program, date]);

  // Generate SVG certificate
  const generateSVG = () => {
    if (!certificate) return '';

    const formattedDate = new Date(certificate.issue_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `<svg xmlns='http://www.w3.org/2000/svg' width='1400' height='1000' viewBox='0 0 1400 1000'>
      <defs>
        <linearGradient id='headerGrad' x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' style='stop-color:#1e40af'/>
          <stop offset='100%' style='stop-color:#3b82f6'/>
        </linearGradient>
        <pattern id='watermark' patternUnits='userSpaceOnUse' width='200' height='200'>
          <text x='100' y='100' text-anchor='middle' font-size='14' fill='#f1f5f9' transform='rotate(-45 100 100)'>ELEVATE</text>
        </pattern>
      </defs>
      
      <!-- Background -->
      <rect width='100%' height='100%' fill='white'/>
      <rect width='100%' height='100%' fill='url(#watermark)'/>
      
      <!-- Border -->
      <rect x='30' y='30' width='1340' height='940' fill='none' stroke='url(#headerGrad)' stroke-width='6' rx='16'/>
      <rect x='45' y='45' width='1310' height='910' fill='none' stroke='#e2e8f0' stroke-width='2' rx='12'/>
      
      <!-- Header -->
      <text x='700' y='120' text-anchor='middle' font-size='24' font-family='Arial, sans-serif' fill='#64748b' letter-spacing='8'>ELEVATE FOR HUMANITY</text>
      
      <!-- Title -->
      <text x='700' y='200' text-anchor='middle' font-size='52' font-family='Georgia, serif' fill='#1e40af' font-weight='bold'>${certificate.credential_type}</text>
      
      <!-- Decorative line -->
      <line x1='400' y1='240' x2='1000' y2='240' stroke='#3b82f6' stroke-width='2'/>
      
      <!-- Body text -->
      <text x='700' y='320' text-anchor='middle' font-size='24' font-family='Arial, sans-serif' fill='#475569'>This is to certify that</text>
      
      <!-- Student name -->
      <text x='700' y='400' text-anchor='middle' font-size='48' font-family='Georgia, serif' fill='#1e3a8a' font-weight='bold'>${certificate.student_name}</text>
      
      <!-- Completion text -->
      <text x='700' y='470' text-anchor='middle' font-size='24' font-family='Arial, sans-serif' fill='#475569'>has successfully completed the requirements for</text>
      
      <!-- Program name -->
      <text x='700' y='540' text-anchor='middle' font-size='36' font-family='Georgia, serif' fill='#059669' font-weight='bold'>${certificate.program_name}</text>
      
      ${certificate.hours_completed ? `<text x='700' y='590' text-anchor='middle' font-size='18' font-family='Arial, sans-serif' fill='#64748b'>${certificate.hours_completed} Hours Completed</text>` : ''}
      
      <!-- Date -->
      <text x='700' y='660' text-anchor='middle' font-size='20' font-family='Arial, sans-serif' fill='#475569'>Issued on ${formattedDate}</text>
      
      <!-- Signatures -->
      <line x1='200' y1='780' x2='450' y2='780' stroke='#1e40af' stroke-width='1'/>
      <text x='325' y='810' text-anchor='middle' font-size='16' font-family='Arial, sans-serif' fill='#475569'>${certificate.issuer_name}</text>
      <text x='325' y='830' text-anchor='middle' font-size='14' font-family='Arial, sans-serif' fill='#64748b'>${certificate.issuer_title}</text>
      
      <line x1='950' y1='780' x2='1200' y2='780' stroke='#1e40af' stroke-width='1'/>
      <text x='1075' y='810' text-anchor='middle' font-size='16' font-family='Arial, sans-serif' fill='#475569'>Registrar</text>
      <text x='1075' y='830' text-anchor='middle' font-size='14' font-family='Arial, sans-serif' fill='#64748b'>Office of the Registrar</text>
      
      <!-- Certificate number and verification -->
      <text x='700' y='900' text-anchor='middle' font-size='14' font-family='monospace' fill='#94a3b8'>Certificate #: ${certificate.certificate_number}</text>
      <text x='700' y='920' text-anchor='middle' font-size='12' font-family='Arial, sans-serif' fill='#94a3b8'>Verify at: elevateforhumanity.org/verify/${certificate.verification_code}</text>
    </svg>`;
  };

  // Download as SVG
  const downloadSVG = async () => {
    if (!certificate) return;
    
    setDownloading(true);
    
    try {
      const svg = generateSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate.student_name.replace(/\s+/g, '-')}-${certificate.certificate_number}.svg`;
      a.click();
      URL.revokeObjectURL(url);

      // Log download
      if (certificateId) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('certificate_downloads').insert({
            certificate_id: certificateId,
            user_id: user.id,
            format: 'svg',
          }).catch(() => {});
        }
      }

      onDownload?.();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Download as PNG
  const downloadPNG = async () => {
    if (!certificate) return;
    
    setDownloading(true);
    
    try {
      const svg = generateSVG();
      const canvas = document.createElement('canvas');
      canvas.width = 1400;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      
      const img = new Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificate-${certificate.student_name.replace(/\s+/g, '-')}-${certificate.certificate_number}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
          setDownloading(false);
        }, 'image/png');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    } catch (err) {
      console.error('PNG download error:', err);
      setDownloading(false);
    }
  };

  // Print certificate
  const printCertificate = () => {
    const svg = generateSVG();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Certificate - ${certificate?.student_name}</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            ${svg}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Copy verification link
  const copyVerificationLink = async () => {
    if (!certificate) return;
    
    const link = `${window.location.origin}/verify/${certificate.verification_code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share certificate
  const shareCertificate = async () => {
    if (!certificate) return;
    
    const shareData = {
      title: `${certificate.credential_type} - ${certificate.student_name}`,
      text: `I earned my ${certificate.program_name} certificate from Elevate for Humanity!`,
      url: `${window.location.origin}/verify/${certificate.verification_code}`,
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      copyVerificationLink();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <p className="text-red-700">{error || 'Certificate not found'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{certificate.credential_type}</h2>
            <p className="text-sm text-gray-600">Certificate #{certificate.certificate_number}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSVG}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              SVG
            </button>
            <button
              onClick={downloadPNG}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              PNG
            </button>
            <button
              onClick={printCertificate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={shareCertificate}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Certificate Preview */}
      <div className="p-8">
        <div className="border-4 border-brand-blue-600 rounded-2xl p-8 md:p-12 text-center bg-white relative overflow-hidden">
          {/* Watermark */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-bold text-brand-blue-600 transform -rotate-45">ELEVATE</span>
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-sm tracking-[0.3em] text-gray-500 mb-4">ELEVATE FOR HUMANITY</p>
            <h3 className="text-3xl md:text-4xl font-bold text-brand-blue-700 mb-8">
              {certificate.credential_type}
            </h3>
            
            <p className="text-lg text-gray-600 mb-2">This certifies that</p>
            <p className="text-3xl md:text-4xl font-bold text-brand-blue-900 mb-4">
              {certificate.student_name}
            </p>
            
            <p className="text-lg text-gray-600 mb-2">has successfully completed</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600 mb-4">
              {certificate.program_name}
            </p>
            
            {certificate.hours_completed && (
              <p className="text-sm text-gray-500 mb-4">{certificate.hours_completed} Hours Completed</p>
            )}
            
            <p className="text-gray-600 mb-8">
              Issued on {new Date(certificate.issue_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            
            <div className="flex justify-between items-end mt-12 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="w-32 border-t border-gray-400 mb-2"></div>
                <p className="text-sm font-medium text-gray-700">{certificate.issuer_name}</p>
                <p className="text-xs text-gray-500">{certificate.issuer_title}</p>
              </div>
              <div className="text-center">
                <div className="w-32 border-t border-gray-400 mb-2"></div>
                <p className="text-sm font-medium text-gray-700">Registrar</p>
                <p className="text-xs text-gray-500">Office of the Registrar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <span>Verification Code: <code className="bg-gray-200 px-2 py-0.5 rounded">{certificate.verification_code}</code></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyVerificationLink}
              className="flex items-center gap-1 text-sm text-brand-blue-600 hover:text-brand-blue-800"
            >
              {copied ? <span className="text-slate-400 flex-shrink-0">•</span> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <a
              href={`/verify/${certificate.verification_code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-brand-blue-600 hover:text-brand-blue-800"
            >
              <ExternalLink className="w-4 h-4" />
              Verify
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
