'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText, CheckCircle2, Eraser, Download, Send,
  Loader2, AlertCircle, ArrowLeft,
} from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';

// MOU content sections for display
const MOU_SECTIONS = [
  {
    title: '1. Purpose',
    content: 'This Memorandum of Understanding ("MOU") establishes the terms and conditions under which the Shop will serve as a worksite partner for the Indiana Barbershop Apprenticeship Program, a USDOL Registered Apprenticeship sponsored by Elevate for Humanity.',
  },
  {
    title: '2. Program Overview',
    content: 'The Indiana Barbershop Apprenticeship Program combines 2,000 hours of on-the-job training (OJT) at the worksite with Related Technical Instruction (RTI) coordinated by the Sponsor, and progressive skill development tracked through competency assessments.',
  },
  {
    title: '3. Sponsor Responsibilities',
    content: 'Elevate for Humanity agrees to: maintain USDOL/RAPIDS registration; handle all required reporting; coordinate related instruction; maintain official records; issue completion certificates; screen and refer qualified apprentice candidates.',
  },
  {
    title: '4. Worksite Partner Responsibilities',
    content: 'The Shop agrees to: provide direct supervision by a licensed barber; pay the apprentice according to the agreed compensation model (meeting minimum wage requirements); provide structured on-the-job training; accurately track and verify hours; maintain a safe workplace; carry workers\' compensation insurance; maintain required business licenses.',
  },
  {
    title: '5. Compensation',
    content: 'Apprentices are paid employees and cannot be paid on a sole commission basis. Compensation options: Hourly ($10.00–$15.00/hr recommended) or Hybrid ($8.00–$10.00/hr base + 15%–25% commission). All models must meet Indiana minimum wage ($7.25/hr). Progressive wage increases are required as the apprentice gains skills and hours. Apprentices retain 100% of tips.',
  },
  {
    title: '6. Term & Termination',
    content: 'This MOU is effective from the date signed until program completion or termination. Either party may terminate with 14 days written notice. The Sponsor may terminate immediately for failure to pay, safety violations, license loss, or misconduct.',
  },
  {
    title: '7. Confidentiality',
    content: 'Both parties agree to maintain confidentiality of apprentice personal information and business proprietary information, except as required for program administration or by law.',
  },
  {
    title: '8. Dispute Resolution',
    content: 'The parties agree to attempt to resolve any disputes through good faith negotiation. If unresolved, disputes may be submitted to mediation before pursuing other remedies.',
  },
];

export default function SignMOUPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [shopName, setShopName] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorLicense, setSupervisorLicense] = useState('');
  const [compensationModel, setCompensationModel] = useState('');
  const [compensationRate, setCompensationRate] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Style
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw signature line
    ctx.beginPath();
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px system-ui';
    ctx.fillText('Sign above this line', rect.width / 2 - 50, rect.height - 12);

    // Reset stroke style for drawing
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
  }, []);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSigned(true);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw signature line
    ctx.beginPath();
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.moveTo(20, rect.height - 30);
    ctx.lineTo(rect.width - 20, rect.height - 30);
    ctx.stroke();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px system-ui';
    ctx.fillText('Sign above this line', rect.width / 2 - 50, rect.height - 12);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;

    setHasSigned(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasSigned) {
      setError('Please provide your signature above.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the terms of the MOU.');
      return;
    }

    setSubmitting(true);

    try {
      // Get signature as data URL
      const signatureData = canvasRef.current?.toDataURL('image/png');

      const payload = {
        shop_name: shopName,
        signer_name: signerName,
        signer_title: signerTitle,
        supervisor_name: supervisorName,
        supervisor_license: supervisorLicense,
        compensation_model: compensationModel,
        compensation_rate: compensationRate,
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
        mou_version: '2025-01',
      };

      const res = await fetch('/api/partners/barbershop-apprenticeship/sign-mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit MOU');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-brand-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">MOU Signed Successfully</h1>
          <p className="text-gray-600 mb-6">
            Your Memorandum of Understanding has been submitted. Our team will countersign
            and send you a fully executed copy within 2 business days.
          </p>
          <div className="space-y-3">
            <Link
              href="/partners/barbershop-apprenticeship/forms"
              className="block w-full px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700"
            >
              Continue to Required Forms
            </Link>
            <Link
              href="/partners/barbershop-apprenticeship"
              className="block w-full px-6 py-3 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
            >
              Back to Partner Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Breadcrumbs items={[
          { label: 'Partners', href: '/partners/barbershop-apprenticeship' },
          { label: 'Sign MOU' },
        ]} />
      </div>

      {/* Institutional Document Header */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link href="/partners/barbershop-apprenticeship" className="inline-flex items-center gap-1 text-gray-600 hover:text-brand-blue-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Partner Page
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8">
        {/* MOU Content */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b rounded-t-xl">
            <InstitutionalHeader
              documentType="Memorandum of Understanding"
              title="Indiana Barbershop Apprenticeship Program"
              subtitle="Worksite Partner Agreement"
              noDivider
            />
            <div className="text-sm text-gray-600 border-t border-slate-200 pt-4 mt-2">
              <p><strong>Between:</strong> 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Technical Institute (&ldquo;Sponsor&rdquo;)</p>
              <p><strong>And:</strong> Your barbershop (&ldquo;Shop&rdquo;)</p>
            </div>
          </div>
          <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
            {MOU_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="font-bold text-gray-900 mb-1">{section.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{section.content}</p>
              </div>
            ))}
            <div className="pt-4 border-t">
              <Link
                href="/docs/Indiana-Barbershop-Apprenticeship-MOU"
                target="_blank"
                className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
              >
                <Download className="w-4 h-4" /> View Full MOU Document
              </Link>
            </div>
          </div>
        </div>

        {/* Partner Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Partner Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Your Barbershop Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Full legal name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Title *</label>
              <input
                type="text"
                required
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Owner, Manager, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supervising Barber Name *</label>
              <input
                type="text"
                required
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Licensed barber who will supervise"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Indiana License # *</label>
              <input
                type="text"
                required
                value={supervisorLicense}
                onChange={(e) => setSupervisorLicense(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Indiana barber license number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compensation Model *</label>
              <select
                required
                value={compensationModel}
                onChange={(e) => setCompensationModel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                <option value="">Select model</option>
                <option value="hourly">Hourly Wage ($10.00–$15.00/hr recommended)</option>
                <option value="hybrid">Hybrid ($8–$10/hr base + 15%–25% commission)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Rate *</label>
              <input
                type="text"
                required
                value={compensationRate}
                onChange={(e) => setCompensationRate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder={
                  compensationModel === 'hourly' ? '$12.00/hour' :
                  compensationModel === 'commission' ? '40% of all services performed' :
                  compensationModel === 'hybrid' ? '$9.00/hour + 20% commission' :
                  'Select a compensation model first'
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                Indiana minimum wage: $7.25/hr. Commission models must average at least minimum wage per pay period. Apprentices keep 100% of tips.
              </p>
            </div>
          </div>
        </div>

        {/* Digital Signature */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Digital Signature</h2>
            <button
              type="button"
              onClick={clearSignature}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <Eraser className="w-4 h-4" /> Clear
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Draw your signature in the box below using your mouse or finger (on touch devices).
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ height: '180px' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          {hasSigned && (
            <p className="text-sm text-brand-green-600 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Signature captured
            </p>
          )}
        </div>

        {/* Agreement Checkbox */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-blue-600 focus:ring-brand-blue-500"
            />
            <span className="text-sm text-gray-700">
              I have read and agree to the terms of this Memorandum of Understanding. I confirm that
              I am authorized to sign on behalf of the barbershop named above. I understand that this
              is a legally binding agreement and that my digital signature has the same legal effect
              as a handwritten signature. I acknowledge that I have reviewed the{' '}
              <Link href="/partners/barbershop-apprenticeship/handbook" className="text-brand-blue-600 underline">
                Partner Handbook
              </Link>{' '}
              and understand my responsibilities as a worksite partner. *
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-blue-600 text-white rounded-lg font-bold text-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> Sign & Submit MOU
              </>
            )}
          </button>
          <Link
            href="/partners/barbershop-apprenticeship"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          By submitting, you agree that your electronic signature is legally binding under the
          Indiana Uniform Electronic Transactions Act (IC 26-2-8) and the federal ESIGN Act.
          A copy of the signed MOU will be emailed to you.
        </p>

        {/* Next Steps */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900">Next: Submit Your Application</h3>
            <p className="text-sm text-gray-600">After signing the MOU, complete the partner application form.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/partners/barbershop-apprenticeship/forms"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 text-sm whitespace-nowrap"
            >
              Required Forms
            </Link>
            <Link
              href="/partners/barbershop-apprenticeship/apply"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 text-sm whitespace-nowrap"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
