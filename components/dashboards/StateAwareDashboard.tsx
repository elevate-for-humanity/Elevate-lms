import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

/**
 * STATE-AWARE DASHBOARD COMPONENT
 *
 * This component enforces progression and makes dashboards act like staff.
 * Every portal gets a bright, picture-backed directional hero rather than a
 * blank shell or a generic dark banner.
 */

interface DominantAction {
  label: string;
  href: string;
  description: string;
}

interface LockedSection {
  id: string;
  label: string;
  reason: string;
}

interface Alert {
  type: 'error' | 'warning' | 'info';
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

interface StateAwareDashboardProps {
  dominantAction: DominantAction;
  availableSections: string[];
  lockedSections: LockedSection[];
  progressPercentage?: number;
  alerts: Alert[];
  children?: React.ReactNode;
}

function portalHeroImage(href: string): string {
  const value = href.toLowerCase();
  if (value.includes('employer')) return '/images/pages/business-meeting.webp';
  if (value.includes('case-manager') || value.includes('workforce')) return '/images/pages/admin-wioa-hero.webp';
  if (value.includes('provider') || value.includes('program-holder')) return '/images/pages/training-classroom.webp';
  if (value.includes('host-shop') || value.includes('apprentice')) return '/images/pages/barber-training.webp';
  if (value.includes('parent')) return '/images/pages/about-supportive-services.webp';
  if (value.includes('student') || value.includes('/lms')) return '/images/pages/training-classroom.webp';
  return '/images/pages/workforce-training.webp';
}

export function StateAwareDashboard({
  dominantAction,
  availableSections,
  lockedSections,
  progressPercentage,
  alerts,
  children,
}: StateAwareDashboardProps) {
  const heroImage = portalHeroImage(dominantAction.href);

  return (
    <div className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-4 pt-4 sm:pt-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-rose-50 shadow-lg">
          <div className="grid min-h-[280px] lg:grid-cols-[1.08fr_0.92fr]">
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-900">
                  <ShieldCheck className="h-4 w-4" /> Secure workspace
                </span>
                <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-blue-900">
                  Your next step
                </span>
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {dominantAction.label}
              </h1>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-700">
                {dominantAction.description}
              </p>
              <div className="mt-6">
                <Link
                  href={dominantAction.href}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-blue-700 px-6 py-3 font-black text-white shadow-sm transition hover:bg-brand-blue-800"
                >
                  {dominantAction.label}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              {progressPercentage !== undefined && (
                <div className="mt-7 max-w-2xl">
                  <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
                    <span>Your Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-brand-blue-600 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="relative min-h-[240px] lg:min-h-full">
              <Image
                src={heroImage}
                alt="Portal work and next-step guidance"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/50 bg-white/90 p-4 shadow-lg backdrop-blur-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-red-700">Use your navigation</p>
                <p className="mt-1 font-black text-slate-950">Complete the highlighted action, then move through the tools available for your role.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {alerts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-4 rounded-xl border-2 p-4 ${
                  alert.type === 'error'
                    ? 'border-brand-red-600 bg-brand-red-50'
                    : alert.type === 'warning'
                      ? 'border-yellow-600 bg-yellow-50'
                      : 'border-brand-blue-600 bg-brand-blue-50'
                }`}
              >
                <AlertCircle
                  className={`mt-0.5 h-6 w-6 shrink-0 ${
                    alert.type === 'error'
                      ? 'text-brand-red-600'
                      : alert.type === 'warning'
                        ? 'text-yellow-700'
                        : 'text-brand-blue-700'
                  }`}
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-950">{alert.message}</p>
                </div>
                {alert.actionLabel && alert.actionHref && (
                  <Link
                    href={alert.actionHref}
                    className={`shrink-0 rounded-lg px-4 py-2 font-semibold text-white transition ${
                      alert.type === 'error'
                        ? 'bg-brand-red-600 hover:bg-brand-red-700'
                        : alert.type === 'warning'
                          ? 'bg-yellow-700 hover:bg-yellow-800'
                          : 'bg-brand-blue-700 hover:bg-brand-blue-800'
                    }`}
                  >
                    {alert.actionLabel}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8">{children}</section>

      {lockedSections.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <h3 className="mb-6 text-xl font-bold text-slate-950">Locked Until Prerequisites Complete</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lockedSections.map((section) => (
              <div
                key={section.id}
                className="cursor-not-allowed rounded-xl border-2 border-slate-300 bg-slate-100 p-6 opacity-70"
              >
                <div className="mb-3 flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                  <h4 className="font-bold text-slate-950">{section.label}</h4>
                </div>
                <p className="text-sm font-medium text-slate-700">{section.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface SectionCardProps {
  title: string;
  description: string;
  href: string;
  image?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export function SectionCard({ title, description, href, image, icon, badge }: SectionCardProps) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-brand-blue-400 hover:shadow-xl"
    >
      {image ? (
        <div className="relative h-36 overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="100vw"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
          {badge && (
            <span className="absolute right-3 top-3 rounded-full bg-brand-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
              {badge}
            </span>
          )}
          <div className="absolute bottom-3 left-4 right-4">
            <h4 className="text-lg font-bold text-white drop-shadow-lg">{title}</h4>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between p-4 pb-0">
          <div className="flex items-center gap-3">
            {icon && <div className="text-brand-blue-600">{icon}</div>}
            <h4 className="font-bold text-slate-950 transition group-hover:text-brand-blue-700">{title}</h4>
          </div>
          {badge && (
            <span className="rounded-full bg-brand-red-100 px-3 py-1 text-xs font-bold text-brand-red-700">{badge}</span>
          )}
        </div>
      )}
      <div className="p-4">
        <p className="mb-3 line-clamp-2 text-sm font-medium text-slate-700">{description}</p>
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-blue-700 transition-all group-hover:gap-3">
          <span>Open</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

interface ProgressIndicatorProps {
  steps: Array<{
    label: string;
    status: 'completed' | 'current' | 'locked';
  }>;
}

export function ProgressIndicator({ steps }: ProgressIndicatorProps) {
  if (!steps || !Array.isArray(steps)) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-bold text-slate-950">Your Journey</h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                step.status === 'completed'
                  ? 'bg-brand-green-600 text-white'
                  : step.status === 'current'
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step.status === 'completed' ? (
                <span className="inline-block h-3 w-3 rounded-full bg-white" />
              ) : step.status === 'locked' ? (
                <Lock className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </div>
            <div className="flex-1">
              <div
                className={`font-semibold ${
                  step.status === 'completed'
                    ? 'text-brand-green-900'
                    : step.status === 'current'
                      ? 'text-brand-blue-900'
                      : 'text-slate-500'
                }`}
              >
                {step.label}
              </div>
              {step.status === 'current' && (
                <div className="text-sm font-semibold text-brand-blue-700">Current Step</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
