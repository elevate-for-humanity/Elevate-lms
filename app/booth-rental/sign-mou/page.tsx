'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { CheckCircle, Eraser, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const MOU_SECTIONS = [
  {
    title: '1. Parties and Purpose',
    content: `This Booth Rental Agreement ("Agreement") is entered into between 2Exclusive LLC-S d/b/a ${PLATFORM_DEFAULTS.orgName} Career & Technical Institute ("Elevate") and the licensed professional identified at execution ("Renter").

This Agreement governs the rental of a booth, station, or suite at ${PLATFORM_DEFAULTS.orgName}'s facility located in Indianapolis, Indiana. The Renter is an independent contractor operating their own business — not an employee of Elevate.`,
  },
  {
    title: '2. Rental Terms',
    content: `Weekly Rent: As specified at checkout based on discipline and space type.

Billing: Rent is charged automatically every Friday via the card on file. A $25 late fee applies if payment fails, plus $10/day after 5 days past due.

Security Deposit: Where applicable, the deposit collected at checkout is held and returned within 14 days of lease termination, less any amounts owed.

Term: Month-to-month. Either party may terminate with 14 days written notice.`,
  },
  {
    title: '3. Renter Responsibilities',
    content: `The Renter agrees to:
• Maintain a valid, active state license for their discipline at all times.
• Keep their booth/station clean and in good condition.
• Comply with all applicable state board regulations and health codes.
• Carry their own professional liability insurance (minimum $1M per occurrence).
• Not sublease or share their assigned space without written consent.
• Conduct business in a professional manner consistent with Elevate's standards.
• Not solicit other renters or staff to leave Elevate.`,
  },
  {
    title: '4. Elevate Responsibilities',
    content: `Elevate agrees to:
• Provide a clean, professional workspace with utilities included.
• Maintain common areas, restrooms, and shared equipment.
• Provide Wi-Fi access.
• Process payments securely via Stripe.
• Give 30 days notice of any rate changes.`,
  },
  {
    title: '5. Independent Contractor Status',
    content: `The Renter is an independent contractor. This Agreement does not create an employment relationship. The Renter is solely responsible for:
• All federal, state, and local taxes on income earned.
• Their own business licenses and permits.
• Client scheduling, pricing, and service delivery.
• Their own professional liability and general liability insurance.

Elevate does not control the Renter's hours, pricing, clientele, or business practices.`,
  },
  {
    title: '6. Termination',
    content: `Either party may terminate this Agreement with 14 days written notice. Elevate may terminate immediately for:
• Non-payment of rent (more than 7 days past due).
• License suspension or revocation.
• Conduct that violates state board regulations or creates liability for Elevate.
• Harassment of staff, students, or other renters.

Upon termination, the Renter must vacate their space and remove all personal property within 48 hours.`,
  },
  {
    title: '7. Governing Law',
    content: `This Agreement is governed by the laws of the State of Indiana. Any disputes shall be resolved in Marion County, Indiana. The prevailing party in any dispute shall be entitled to reasonable attorney's fees.`,
  },
];

function SignaturePad({
  onSign,
  onClear,
}: {
  onSign: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing.current = true;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };
    const move = (e: MouseEvent | TouchEvent) => {
      if (!drawing.current) return;
      e.preventDefault();
      const pos = getPos(e, canvas);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasSignature(true);
    };
    const end = () => {
      if (!drawing.current) return;
      drawing.current = false;
      onSign(canvas.toDataURL());
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', end);
    };
  }, [onSign]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onClear();
  };

  return (
    <div>
      <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white touch-none">
        <canvas ref={canvasRef} width={600} height={160} className="w-full h-40 cursor-crosshair" />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-slate-400">Draw your signature above</p>
        {hasSignature && (
          <button
            onClick={clear}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"
          >
            <Eraser className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

function BoothRentalMouInner() {
  const searchParams = useSafeSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const discipline = searchParams.get('discipline');

  const [signatureName, setSignatureName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-slate-600 mb-4">No checkout session found.</p>
          <Link href="/booth-rental/apply" className="text-brand-blue-600 underline">
            Start a new application
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!signatureName.trim()) { setError('Please type your full legal name.'); return; }
    if (!signatureDataUrl) { setError('Please draw your signature.'); return; }
    if (!agreed) { setError('You must agree to the terms to proceed.'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/booth-rental/sign-mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, signatureName, signatureDataUrl, discipline, agreedToTerms: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save agreement');
      router.push('/booth-rental/confirmed');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-brand-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-slate-900">Booth Rental Agreement</h1>
            <p className="text-sm text-slate-500">Review and sign before your rental activates</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <strong>Payment received.</strong> Please read and sign this agreement to activate your rental.
        </div>

        {/* Agreement sections */}
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {MOU_SECTIONS.map((section) => (
            <div key={section.title} className="p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-2">{section.title}</h3>
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Signature block */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h2 className="font-bold text-slate-900">Sign Agreement</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="Type your full legal name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Signature <span className="text-red-500">*</span>
            </label>
            <SignaturePad
              onSign={setSignatureDataUrl}
              onClear={() => setSignatureDataUrl('')}
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-blue-600"
            />
            <span className="text-sm text-slate-600">
              I have read and agree to the Booth Rental Agreement above. I understand this is a
              legally binding contract and that my electronic signature has the same legal effect as
              a handwritten signature.
            </span>
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><CheckCircle className="w-4 h-4" /> Sign &amp; Activate Rental</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BoothRentalSignMouPage() {
  return <BoothRentalMouInner />;
}
