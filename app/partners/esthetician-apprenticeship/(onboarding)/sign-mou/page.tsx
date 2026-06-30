'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Eraser, Download, Send, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { InstitutionalHeader } from '@/components/documents/InstitutionalHeader';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const MOU_SECTIONS = [
  {
    title: '1. Parties and Purpose',
    content: `This Memorandum of Understanding ("MOU") is entered into between 2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute ("Sponsor") and the spa/salon identified at execution ("Worksite Partner" or "Spa").

This MOU establishes the terms under which the Spa will serve as a worksite for the Indiana Esthetician Apprenticeship Program, a USDOL Registered Apprenticeship sponsored by ${PLATFORM_DEFAULTS.orgName}.

WHAT THIS AGREEMENT IS: This is a worksite hosting agreement for a federally registered apprenticeship program. The Spa is hosting an apprentice employee and providing on-the-job training under federal Department of Labor oversight.

WHAT THIS AGREEMENT IS NOT: This MOU does not make the Spa a Training Network Partner, a co-owner of Elevate programs, or a revenue-sharing partner.`,
  },
  {
    title: '2. Worksite Partner Obligations',
    content: `The Spa agrees to:
• Employ the apprentice as a W-2 employee and pay at least Indiana minimum wage for all training hours
• Designate a licensed Indiana esthetician supervisor (minimum 2 years experience) for each apprentice
• Maintain a supervisor-to-apprentice ratio not to exceed 1:3
• Log and verify apprentice hours monthly in the Elevate partner portal
• Allow apprentices to complete all required competency areas progressively
• Maintain a safe, professional, and inclusive training environment
• Cooperate with USDOL compliance visits and Elevate coordinator check-ins`,
  },
  {
    title: '3. Sponsor Obligations',
    content: `${PLATFORM_DEFAULTS.orgName} agrees to:
• Provide Related Technical Instruction (RTI) through the Elevate LMS at no cost to the Spa
• Submit verified hours to USDOL RAPIDS system
• Coordinate IPLA licensing exam registration and preparation
• Provide ongoing compliance support and coordinator check-ins
• Coordinate OJT wage reimbursement through WorkOne where eligible
• Maintain USDOL program registration in good standing`,
  },
  {
    title: '4. Term and Termination',
    content: `This MOU is effective upon execution and remains in effect for the duration of the apprentice's enrollment, not to exceed 24 months. Either party may terminate with 30 days written notice. Elevate may terminate immediately for cause, including non-payment of wages, safety violations, or misrepresentation of hours.`,
  },
  {
    title: '5. Governing Law',
    content: `This MOU is governed by the laws of the State of Indiana and applicable federal law, including the National Apprenticeship Act and WIOA. Disputes shall be resolved through mediation before litigation.`,
  },
];

export default function EstheticianSignMouPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.stroke();
    setHasSig(true);
  }, [drawing]);

  const endDraw = useCallback(() => setDrawing(false), []);

  function clearSig() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasSig) { setError('Please provide your signature.'); return; }
    if (!signerName.trim()) { setError('Please enter your full name.'); return; }
    setSubmitting(true); setError('');
    try {
      const canvas = canvasRef.current;
      const sigDataUrl = canvas?.toDataURL('image/png') ?? '';
      const res = await fetch('/api/partners/esthetician-apprenticeship/sign-mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_name: signerName,
          signer_name: signerName,
          signer_title: signerTitle,
          signature_data: sigDataUrl,
          signed_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch {
      setError('Could not submit MOU. Please try again or contact partners@elevateforhumanity.org.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-brand-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">MOU Signed!</h2>
          <p className="text-slate-600 text-sm mb-6">
            Your Memorandum of Understanding has been submitted. Our team will countersign and
            send you a copy within 2 business days. You are now approved to host an apprentice.
          </p>
          <Link href="/partners/esthetician-apprenticeship/thank-you"
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
            Complete Onboarding →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <InstitutionalHeader title="Memorandum of Understanding" subtitle="Esthetician Apprenticeship — Worksite Partner Agreement" documentType="MOU" />

        <div className="mt-8 space-y-4">
          {MOU_SECTIONS.map((s) => (
            <div key={s.title} className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-2">{s.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{s.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h3 className="font-bold text-slate-900">Sign Below</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Legal Name <span className="text-red-500">*</span></label>
              <input value={signerName} onChange={(e) => setSignerName(e.target.value)} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Title / Role</label>
              <input value={signerTitle} onChange={(e) => setSignerTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500" placeholder="Owner, Manager, etc." />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Signature <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50">
              <canvas ref={canvasRef} width={600} height={150} className="w-full touch-none cursor-crosshair"
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-400">Draw your signature above</p>
              <button type="button" onClick={clearSig} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                <Eraser className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Link href="/partners/esthetician-apprenticeship/forms" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <button type="submit" disabled={submitting || !hasSig}
              className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Submit Signed MOU</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
