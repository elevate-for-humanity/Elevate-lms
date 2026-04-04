"use client";
import { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Download, Share2, Award } from 'lucide-react';
interface CertificateGeneratorProps {
  studentName?: string;
  courseName?: string;
  completionDate?: string;
  certificateId?: string;
}
export default function CertificateGenerator({
  studentName = 'Student Name',
  courseName = 'Course Name',
  completionDate = new Date().toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }),
  certificateId = 'CERT-' + Date.now(),
}: CertificateGeneratorProps = {}) {
  const certRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    // Open a print dialog scoped to just the certificate element.
    // The browser's "Save as PDF" option produces a clean PDF without
    // needing a server-side renderer or third-party library.
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow || !certRef.current) return;

    const styles = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((r) => r.cssText);
        } catch {
          return [];
        }
      })
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate — ${courseName}</title>
          <style>${styles}</style>
          <style>
            @media print { body { margin: 0; } }
            body { font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>${certRef.current.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Small delay lets styles load before the dialog opens
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const handleShare = () => {
    // Deep-link to LinkedIn's share dialog pre-filled with certificate details.
    // LinkedIn's certification add flow requires their API; this opens the
    // profile share as the closest publicly available option.
    const text = encodeURIComponent(
      `I just completed "${courseName}" through Elevate for Humanity! Certificate ID: ${certificateId}`,
    );
    const url = encodeURIComponent('https://www.elevateforhumanity.org');
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      '_blank',
      'noopener,noreferrer,width=600,height=500',
    );
  };
  return (
    <div className="space-y-6">
      <Card ref={certRef} className="border-4 border-brand-red-600">
        <CardContent className="p-12 text-center">
          <div className="mb-8">
            <Award className="mx-auto text-brand-orange-600" size={64} />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-black text-2xl md:text-3xl lg:text-4xl">
            Certificate of Completion
          </h1>
          <div className="text-lg text-black mb-8">
            This certifies that
          </div>
          <div className="text-3xl font-bold mb-8 text-brand-orange-600">
            {studentName}
          </div>
          <div className="text-lg text-black mb-4">
            has successfully completed
          </div>
          <div className="text-2xl font-semibold mb-8 text-black">
            {courseName}
          </div>
          <div className="flex items-center justify-center gap-12 text-sm text-black mb-8">
            <div>
              <div className="font-semibold">Date of Completion</div>
              <div>{completionDate}</div>
            </div>
            <div>
              <div className="font-semibold">Certificate ID</div>
              <div>{certificateId}</div>
            </div>
          </div>
          <div className="border-t-2 border-gray-300 pt-8">
            <div className="text-sm text-black">
              Elevate for Humanity Career &amp; Technical Institute
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Workforce Development & Training
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-4 justify-center">
        <Button onClick={handleDownload} className="bg-brand-orange-600 hover:bg-brand-orange-700">
          <Download size={16} className="mr-2" />
          Download PDF
        </Button>
        <Button onClick={handleShare} variant="outline" className="border-brand-orange-500 text-brand-orange-700 hover:bg-brand-orange-50">
          <Share2 size={16} className="mr-2" />
          Share on LinkedIn
        </Button>
      </div>
    </div>
  );
}
