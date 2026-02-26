"use client";

import { Award } from 'lucide-react';

interface CertificateProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateNumber: string;
  instructorName?: string;
}

export function CertificateTemplate({
  studentName,
  courseName,
  completionDate,
  certificateNumber,
  instructorName = 'Elizabeth Greene, CEO',
}: CertificateProps) {
  return (
    <div
      id="certificate-template"
      className="bg-white p-12 relative"
      style={{ width: '1056px', height: '816px' }}
    >
      {/* Border */}
      <div className="absolute inset-8 border-8 border-brand-blue-600 rounded-lg">
        <div className="absolute inset-2 border-2 border-brand-blue-400 rounded-lg" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-16">
        {/* Logo/Icon */}
        <div className="w-24 h-24 bg-brand-blue-600 rounded-full flex items-center justify-center mb-6">
          <Award className="w-12 h-12 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-black mb-4">
          Certificate of Completion
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-black mb-8">This certifies that</p>

        {/* Student Name */}
        <h2 className="text-6xl font-bold text-brand-blue-600 mb-8 border-b-4 border-brand-blue-600 pb-4 px-8">
          {studentName}
        </h2>

        {/* Course Info */}
        <p className="text-xl text-black mb-4">
          has successfully completed
        </p>
        <h3 className="text-3xl font-bold text-black mb-8">{courseName}</h3>

        {/* Date */}
        <p className="text-lg text-black mb-12">
          Completed on{' '}
          {new Date(completionDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>

        {/* Signature Section */}
        <div className="flex justify-center gap-24 w-full mt-auto">
          <div className="text-center">
            <div className="border-t-2 border-slate-900 pt-2 px-8">
              <p className="font-bold text-black">{instructorName}</p>
              <p className="text-sm text-black">Elevate for Humanity Career &amp; Technical Institute</p>
            </div>
          </div>
        </div>

        {/* Certificate Number */}
        <div className="mt-8">
          <p className="text-xs text-slate-500">
            Certificate Number: {certificateNumber}
          </p>
          <p className="text-xs text-slate-500">
            Verify at: www.elevateforhumanity.org/verify/{certificateNumber}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CertificatePreview({
  studentName,
  courseName,
  completionDate,
  certificateNumber,
  instructorName,
}: CertificateProps) {
  const downloadPDF = async () => {
    // Import html2canvas and jsPDF dynamically
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const element = document.getElementById('certificate-template');
    if (!element) return;

    // Capture the certificate as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
    });

    // Convert to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1056, 816],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 1056, 816);
    pdf.save(`certificate-${certificateNumber}.pdf`);
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(courseName)}&organizationId=elevate-for-humanity&issueYear=${new Date(completionDate).getFullYear()}&issueMonth=${new Date(completionDate).getMonth() + 1}&certUrl=${encodeURIComponent(`https://www.elevateforhumanity.org/verify/${certificateNumber}`)}`;
    window.open(url, '_blank');
  };

  const copyVerificationLink = () => {
    const link = `https://www.elevateforhumanity.org/verify/${certificateNumber}`;
    navigator.clipboard.writeText(link);
    alert('Verification link copied to clipboard!');
  };

  return (
    <div>
      {/* Certificate Display */}
      <div className="bg-slate-100 p-8 rounded-lg mb-6 overflow-auto">
        <div
          className="inline-block"
          style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}
        >
          <CertificateTemplate
            studentName={studentName}
            courseName={courseName}
            completionDate={completionDate}
            certificateNumber={certificateNumber}
            instructorName={instructorName}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={downloadPDF}
          className="flex-1 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download PDF
        </button>
        <button
          onClick={shareOnLinkedIn}
          className="flex-1 bg-[#0077B5] hover:bg-[#006399] text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Share on LinkedIn
        </button>
        <button
          onClick={copyVerificationLink}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-black px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy Link
        </button>
      </div>
    </div>
  );
}
