'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, Eraser, Loader2, AlertCircle } from 'lucide-react';
import { BOOTH_RENTAL_TIERS, type BoothRentalDiscipline } from '@/lib/programs/pricing';

const MOU_SECTIONS = [
  {
    title: '1. Parties and Purpose',
    content: `This Booth Rental Agreement ("Agreement") is entered into between 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Technical Institute ("Elevate"), located at 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240, and the licensed professional identified at execution ("Renter").

This Agreement establishes the terms under which the Renter will lease a booth or suite at Elevate's facility for the purpose of providing licensed cosmetology, barbering, esthetics, or nail technology services to the Renter's clients.

This is a booth rental agreement. The Renter is an independent contractor, not an employee of Elevate. Elevate does not control the Renter's schedule, clientele, pricing, or services.`,
  },
  {
    title: '2. Rental Space and Term',
    content: `Elevate agrees to provide the Renter with access to a designated booth or suite ("Space") at the facility. The specific Space assignment will be confirmed by Elevate staff prior to the Renter's first day.

The Agreement begins on the date of execution and continues on a week-to-week basis. Either party may terminate this Agreement with seven (7) days written notice. Elevate may terminate immediately for non-payment, license lapse, or conduct that endangers clients or staff.`,
  },
  {
    title: '3. Rent and Payment Terms',
    content: `Weekly Rent: As specified in the Renter's selected tier at signup. Rent is charged automatically every Friday via the card on file through Stripe.

Security Deposit: Where applicable, a deposit equal to one week's rent is collected at signup. The deposit is refundable within 14 days of lease termination, less any amounts owed for unpaid rent, damages, or cleaning fees.

Late Fees: If payment fails on the scheduled Friday:
  • A $25 late fee is assessed immediately on day 1 past due.
  • An additional $10/day fee accrues for each day the payment remains outstanding (days 2 through 5).
  • If payment is not received by day 5, Elevate will initiate termination of this Agreement and revoke access to the Space.

The Renter is responsible for ensuring their card on file is valid and has sufficient funds. Elevate will send payment failure notices by email and SMS (if consent given).`,
  },
  {
    title: '4. Renter Responsibilities',
    content: `The Renter agrees to:

LICENSE: Maintain a valid, active Indiana state license for their discipline at all times. Provide proof of license renewal to Elevate upon request. If a license lapses, the Renter must vacate the Space immediately until the license is reinstated.

INSURANCE: Carry and maintain professional liability (malpractice) insurance with minimum coverage of $1,000,000 per occurrence. Provide proof of coverage to Elevate before occupying the Space and upon each renewal.

CONDUCT: Maintain professional conduct at all times. Treat clients, staff, and other renters with respect. No harassment, discrimination, or conduct that creates a hostile environment will be tolerated.

CLEANLINESS: Keep the Space clean and sanitary at all times in compliance with Indiana State Board of Cosmetology and Barber Examiners standards. Clean the Space after each client. Dispose of all waste properly.

SUPPLIES: Provide all personal tools, equipment, and supplies needed for services. Elevate provides the Space only — not tools, products, or equipment unless otherwise agreed in writing.

CLIENTS: The Renter's clients are the Renter's own. Elevate has no relationship with the Renter's clients and is not responsible for services rendered by the Renter.

HOURS: The Renter may use the Space during Elevate's facility operating hours. After-hours access requires prior written approval from Elevate management.

COMPLIANCE: Comply with all applicable federal, state, and local laws, including OSHA standards, Indiana Board of Cosmetology and Barber Examiners rules, and Indianapolis health and safety codes.`,
  },
  {
    title: '5. Elevate Responsibilities',
    content: `Elevate agrees to:

• Provide a clean, maintained booth or suite with access to shared shampoo bowls, restrooms, and common areas as available.
• Maintain the facility in compliance with applicable health and safety codes.
• Provide utilities (electricity, water, Wi-Fi) included in the weekly rent.
• Process rent payments automatically via Stripe on the agreed schedule.
• Provide reasonable notice (minimum 48 hours) before any changes to facility access, operating hours, or Space assignment, except in emergencies.`,
  },
  {
    title: '6. Independent Contractor Status',
    content: `The Renter is an independent contractor. Nothing in this Agreement creates an employer-employee relationship, partnership, joint venture, or agency between Elevate and the Renter.

The Renter is solely responsible for:
• All federal, state, and local taxes on income earned at the Space.
• Self-employment taxes.
• Their own health insurance, workers' compensation, and benefits.
• Compliance with all laws applicable to their independent business.

Elevate will issue a 1099 to the Renter if required by IRS rules.`,
  },
  {
    title: '7. Termination',
    content: `Either party may terminate this Agreement with seven (7) days written notice sent by email to the address on file.

Elevate may terminate immediately and without notice for:
• Non-payment of rent beyond 5 days past due.
• Lapse of required state license.
• Conduct that endangers clients, staff, or other renters.
• Violation of any material term of this Agreement.
• Damage to the facility or equipment.

Upon termination, the Renter must remove all personal property from the Space within 24 hours. Property not removed within 48 hours may be disposed of by Elevate.`,
  },
  {
    title: '8. Limitation of Liability',
    content: `Elevate is not liable for any loss, theft, or damage to the Renter's personal property, tools, or equipment at the facility. The Renter assumes all risk for personal property left at the Space.

Elevate is not liable for any claims arising from services rendered by the Renter to the Renter's clients. The Renter indemnifies and holds harmless Elevate from any such claims.

Elevate's total liability under this Agreement shall not exceed the amount of rent paid by the Renter in the 30 days preceding the claim.`,
  },
  {
    title: '9. Governing Law',
    content: `This Agreement is governed by the laws of the State of Indiana. Any disputes shall be resolved in Marion County, Indiana. The prevailing party in any dispute shall be entitled to reasonable attorney's fees.`,
  },
];

function SignMouInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const discipline = searchParams.get('discipline') as BoothRentalDiscipline | null;
  const sessionId = searchParams.get('session_id');
  const tier = discipline ? BOOTH_RENTAL_TIERS[discipline] : null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [printedName, setPrintedName] = useState('');

  // Canvas drawing
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSubmit = async () => {
    if (!hasSigned) { setError('Please sign the agreement above.'); return; }
    if (!printedName.trim()) { setError('Please print your full name.'); return; }
    if (!agreed) { setError('Please check the acknowledgment box.'); return; }

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas?.toDataURL('image/png') ?? '';

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/booth-rental/sign-mou', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discipline,
          session_id: sessionId,
          printed_name: printedName,
          signature_data_url: signatureDataUrl,
          signed_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit. Please try again.'); setLoading(false); return; }
      setSubmitted(true);
      setTimeout(() => router.push('/booth-rental/success'), 1500);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="font-bold text-slate-900">Agreement signed. Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/booth-rental/apply" className="text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Booth Rental Agreement</h1>
            {tier && <p className="text-sm text-slate-500">{tier.label} {tier.spaceType} — ${tier.weeklyRateDollars}/week</p>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* MOU content */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <FileText className="w-4 h-4" />
            <span>Read the full agreement before signing</span>
          </div>
          {MOU_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-slate-900 mb-2">{section.title}</h3>
              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Signature block */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Sign Below</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Printed Full Name *</label>
            <input
              type="text"
              value={printedName}
              onChange={e => setPrintedName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="Your full legal name"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Signature *</label>
              <button onClick={clearSignature} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
                <Eraser className="w-3 h-3" /> Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={600}
              height={120}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
              className="w-full border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 cursor-crosshair touch-none"
              style={{ height: '120px' }}
            />
            {!hasSigned && (
              <p className="text-xs text-slate-400 mt-1">Draw your signature above</p>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
            />
            <span className="text-sm text-slate-600">
              I have read and agree to the Booth Rental Agreement. I understand that my card on file will be charged ${tier?.weeklyRateDollars ?? '—'} automatically every Friday, and that late fees apply as described. I am signing as an independent contractor, not an employee of Elevate for Humanity.
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-brand-blue-700 hover:bg-brand-blue-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</> : <><CheckCircle2 className="w-5 h-5" /> Sign &amp; Complete Rental Setup</>}
          </button>

          <p className="text-xs text-center text-slate-400">
            Signed {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · 2Exclusive LLC-S d/b/a Elevate for Humanity · Indianapolis, IN
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignMouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
      <SignMouInner />
    </Suspense>
  );
}
