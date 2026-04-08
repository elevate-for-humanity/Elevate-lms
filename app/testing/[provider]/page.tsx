import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Clock, MapPin, Monitor, DollarSign, ExternalLink, CalendarDays } from 'lucide-react';
import { CERT_PROVIDERS } from '@/lib/testing/proctoring-capabilities';

// Hero images per provider key
const PROVIDER_HERO: Record<string, string> = {
  esco:       '/images/pages/hvac-technician.jpg',
  certiport:  '/images/pages/programs-it-hero.jpg',
  nha:        '/images/pages/medical-assistant.jpg',
  nrf:        '/images/pages/apply-employer-hero.jpg',
  workkeys:   '/images/pages/career-services-page-4.jpg',
  careersafe: '/images/pages/apprenticeships-hero.jpg',
  lms:     '/images/pages/barber-apprenticeship.jpg',
};

const PROVIDER_ACCENT: Record<string, string> = {
  esco:       'from-sky-900',
  certiport:  'from-blue-900',
  nha:        'from-emerald-900',
  nrf:        'from-orange-900',
  workkeys:   'from-violet-900',
  careersafe: 'from-yellow-900',
  lms:     'from-pink-900',
};

const CAPABILITY_LABEL: Record<string, { label: string; icon: typeof MapPin }> = {
  IN_PERSON_ONLY:              { label: 'In-person proctored only', icon: MapPin },
  IN_PERSON_OR_PROVIDER_REMOTE:{ label: 'In-person or remote (provider system)', icon: Monitor },
  CENTER_REMOTE_ALLOWED:       { label: 'In-person or live online proctoring', icon: Monitor },
};

interface Props {
  params: Promise<{ provider: string }>;
}

export async function generateStaticParams() {
  return Object.keys(CERT_PROVIDERS).map((key) => ({ provider: key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { provider: key } = await params;
  const p = CERT_PROVIDERS[key];
  if (!p) return {};
  return {
    title: `${p.name} | Testing Center | Elevate for Humanity`,
    description: p.description,
    alternates: { canonical: `https://www.elevateforhumanity.org/testing/${key}` },
  };
}

export default async function ProviderPage({ params }: Props) {
  const { provider: key } = await params;
  const provider = CERT_PROVIDERS[key];
  if (!provider) notFound();

  const heroImg   = PROVIDER_HERO[key]   ?? '/images/pages/career-services-hero.jpg';
  const accent    = PROVIDER_ACCENT[key] ?? 'from-slate-900';
  const capInfo   = CAPABILITY_LABEL[provider.capability];
  const CapIcon   = capInfo?.icon ?? MapPin;
  const isActive  = provider.status === 'active';

  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="relative h-[480px] flex items-end overflow-hidden">
        <Image
          src={heroImg}
          alt={provider.name}
          fill
          className="object-cover object-center"
          priority
        />
        {/* gradient overlay — bottom only, no text on video rule doesn't apply to static images */}
        <div className={`absolute inset-0 bg-gradient-to-t ${accent} via-transparent to-transparent opacity-90`} />
        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-12 w-full">
          {/* Breadcrumb */}
          <nav className="text-sm text-white/60 mb-4">
            <Link href="/testing" className="hover:text-white transition-colors">Testing Center</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{provider.name}</span>
          </nav>
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 ${
            isActive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400' : 'bg-amber-400'}`} />
            {isActive ? 'Authorized Testing Site' : 'Available Through Partner'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-3">
            {provider.name}
          </h1>
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <CapIcon className="w-4 h-4 flex-shrink-0" />
            <span>{capInfo?.label}</span>
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-10">

        {/* Left — description + exams */}
        <div className="lg:col-span-2 space-y-10">

          {/* About */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">About This Exam</h2>
            <p className="text-slate-600 text-base leading-relaxed">{provider.description}</p>
            {provider.verifyUrl && (
              <a
                href={provider.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-blue-600 hover:underline font-medium"
              >
                Official verification / more info <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </section>

          {/* Exams available */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Exams Available</h2>
            <ul className="space-y-2">
              {provider.exams.map((exam) => (
                <li key={exam} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{exam}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Proctoring options */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-600 text-sm mb-4">All exams are proctored. Most are administered in-person at our Indianapolis testing center.{provider.capability !== 'IN_PERSON_ONLY' ? ' This provider also supports remote proctoring — see options below.' : ''}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <MapPin className="w-5 h-5 text-brand-red-600 mb-2" />
                <h3 className="font-semibold text-slate-900 mb-1">In-Person (Required)</h3>
                <p className="text-slate-600 text-sm">Proctored at our Indianapolis testing center. Appointment required — no walk-ins. Arrive 15 minutes early with valid government-issued photo ID.</p>
              </div>
              {provider.capability !== 'IN_PERSON_ONLY' && (
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <Monitor className="w-5 h-5 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {provider.capability === 'CENTER_REMOTE_ALLOWED' ? 'Live Online Proctoring' : 'Remote (Provider System)'}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {provider.capability === 'CENTER_REMOTE_ALLOWED'
                      ? 'We proctor you live via video. Take the exam from home with a webcam and stable internet. Appointment still required.'
                      : 'This provider operates their own remote proctoring system. You may test remotely through their platform or in-person at our center.'}
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right — pricing + CTA */}
        <aside className="space-y-6">

          {/* Pricing card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-4">
              <div className="flex items-center gap-2 text-white">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-bold text-lg">Pricing</h3>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {provider.fees && provider.fees.length > 0 ? (
                provider.fees.map((fee, i) => (
                  <div key={i} className={i > 0 ? 'pt-4 border-t border-slate-100' : ''}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-slate-700 text-sm font-medium">{fee.label}</span>
                      <span className="text-2xl font-extrabold text-slate-900">${fee.amount}</span>
                    </div>
                    {fee.note && (
                      <p className="text-slate-500 text-xs mt-1">{fee.note}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">Pricing quoted on request — contact us for details.</p>
              )}
              {provider.groupDiscount && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-100 mt-2">
                  <p className="text-green-800 text-xs font-medium">{provider.groupDiscount}</p>
                </div>
              )}
            </div>
          </div>

          {/* Book CTA */}
          {isActive && (
            <div className="space-y-3">
              <Link
                href={`/testing/book?provider=${key}`}
                className="flex items-center justify-center gap-2 w-full bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-4 rounded-xl transition-colors"
              >
                <CalendarDays className="w-5 h-5" />
                Book a Testing Session
              </Link>
              <Link
                href="/testing"
                className="flex items-center justify-center w-full border border-slate-200 text-slate-700 font-medium px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                ← All Testing Options
              </Link>
            </div>
          )}
          {!isActive && (
            <div className="space-y-3">
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-4 rounded-xl transition-colors"
              >
                Contact Us for Access
              </Link>
              <Link
                href="/testing"
                className="flex items-center justify-center w-full border border-slate-200 text-slate-700 font-medium px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                ← All Testing Options
              </Link>
            </div>
          )}

          {/* What to bring */}
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
            <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> What to Bring
            </h4>
            <ul className="text-amber-800 text-sm space-y-1.5">
              <li>• Valid government-issued photo ID</li>
              <li>• Confirmation email / booking reference</li>
              <li>• Arrive 10 minutes early</li>
              {provider.capability !== 'IN_PERSON_ONLY' && (
                <li>• Webcam + stable internet (remote option)</li>
              )}
            </ul>
          </div>

        </aside>
      </div>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-slate-900 py-16 px-6 text-center">
        <h2 className="text-3xl font-extrabold text-white mb-3">Ready to Get Certified?</h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          All exams are by appointment only. Walk-ins are not accepted. Same-day appointments may be available depending on capacity — call us to check.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {isActive && (
            <Link
              href={`/testing/book?provider=${key}`}
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-full transition-colors"
            >
              Book Now
            </Link>
          )}
          <Link
            href="/testing"
            className="border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 font-bold px-8 py-4 rounded-full transition-colors"
          >
            View All Exams
          </Link>
        </div>
      </section>

    </main>
  );
}
