export const revalidate = 3600;

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Phone, Mail, UserPlus } from 'lucide-react';
import { getBeautyProgram, colorClasses } from '@/lib/programs/beauty-programs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface Props {
  params: Promise<{ program: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { program } = await params;
  const cfg = getBeautyProgram(program);
  if (!cfg) return { robots: { index: false, follow: false } };
  return {
    title: `Application Submitted | ${cfg.title}`,
    robots: { index: false, follow: false },
  };
}

export default async function BeautyApplySuccessPage({ params }: Props) {
  const { program } = await params;
  const cfg = getBeautyProgram(program);
  if (!cfg) return notFound();

  const c = colorClasses(cfg.color);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 ${c.bg} rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg`}>
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Application Submitted</h1>
          <p className="text-slate-600 text-base">
            Your application to the {cfg.title} has been received.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-5">
          <div className={`${c.bg} px-6 py-4 flex items-center gap-3`}>
            <UserPlus className="w-5 h-5 text-white flex-shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">Create your account</p>
              <p className="text-white/70 text-xs">
                Required to access orientation and your apprentice dashboard
              </p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-slate-600 text-sm mb-4">
              Use the same email address you used on your application. Your enrollment will be
              linked automatically.
            </p>
            <Link
              href={`/signup?role=apprentice&redirect=/programs/${cfg.slug}/orientation`}
              className={`block w-full text-center py-3 ${c.bg} text-white font-bold rounded-lg ${c.hover} transition`}
            >
              Create Account &amp; Continue
            </Link>
            <p className="text-center text-xs text-slate-500 mt-3">
              Already have an account?{' '}
              <Link
                href={`/login?redirect=/programs/${cfg.slug}/orientation`}
                className={`${c.text} hover:underline font-medium`}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-5">
          <h2 className="font-bold text-slate-900 mb-4">What happens next</h2>
          <div className="space-y-3">
            {[
              'Create your account above using the same email from your application.',
              'Complete the orientation — takes about ' + cfg.orientationTime + '.',
              'Upload your government-issued ID.',
              'Our team reviews your application — usually within 1–2 business days.',
              'Once approved, we match you with a host location or confirm your placement.',
              'You start training' + (cfg.earnWhileYouLearn ? ' and earning wages' : '') + ' from day one.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 ${c.bgLight} ${c.textLight} rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5`}>
                  {i + 1}
                </div>
                <p className="text-sm text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {cfg.earnWhileYouLearn && (
          <div className={`${c.bgLight} ${c.border} border rounded-xl p-4 mb-5 text-center`}>
            <p className={`${c.textLight} font-bold text-sm`}>
              Reminder: This program has no tuition.
            </p>
            <p className={`${c.text} text-xs mt-1`}>
              You earn wages from your host location throughout your {cfg.ojtHours.toLocaleString()}-hour apprenticeship.
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
          <p className="text-slate-500 text-sm mb-4">Questions? We&apos;re here to help.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm font-medium"
            >
              <Phone className="w-4 h-4" />
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
            <a
              href="mailto:info@elevateforhumanity.org"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
