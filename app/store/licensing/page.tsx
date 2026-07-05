import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Licensing',
  description: `License the ${PLATFORM_DEFAULTS.orgName} Workforce Operating System for your training program, apprenticeship, or workforce initiative. Structured tiers for approved partners.`,
};

import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600; // 1 hour ISR cache

export default function LicensingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-10 py-16 bg-slate-50">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight">
            Platform Licensing & Partnerships
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-700 leading-relaxed">
            {PLATFORM_DEFAULTS.orgName} offers its Workforce Operating System through a structured
            licensing model for organizations that need a proven, compliant workforce platform
            without building from scratch.
          </p>
          <p className="mt-4 text-lg text-zinc-700 leading-relaxed">
            Licensing is available to approved partners operating training programs,
            apprenticeships, or workforce initiatives.
          </p>
        </div>
      </section>

      {/* Licensing Model */}
      <section className="px-4 sm:px-6 lg:px-10 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black text-zinc-900 text-center mb-8">
            Licensing Model (High-Level)
          </h2>
          <p className="text-lg text-zinc-700 mb-4">Licensing provides:</p>
          <ul className="space-y-3 text-zinc-700">
            <li className="flex items-start">
              <span className="text-brand-green-600 font-bold mr-2">•</span>
              Access to the Elevate Workforce Operating System
            </li>
            <li className="flex items-start">
              <span className="text-brand-green-600 font-bold mr-2">•</span>
              Organization-level configuration
            </li>
            <li className="flex items-start">
              <span className="text-brand-green-600 font-bold mr-2">•</span>
              Ongoing platform updates
            </li>
            <li className="flex items-start">
              <span className="text-brand-green-600 font-bold mr-2">•</span>
              Security and compliance foundation
            </li>
            <li className="flex items-start">
              <span className="text-brand-green-600 font-bold mr-2">•</span>
              Support for workforce and apprenticeship use cases
            </li>
          </ul>
          <p className="mt-6 text-zinc-700">
            Licensing is offered annually and structured based on program scope, number of users,
            and deployment needs.
          </p>
          <p className="mt-4 text-zinc-700">
            Specific pricing and terms are discussed during a consultation to ensure alignment with
            funding sources, compliance requirements, and operational scale.
          </p>
        </div>
      </section>

      {/* Available Options */}
      <section className="px-4 sm:px-6 lg:px-10 py-16 bg-slate-50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black text-zinc-900 text-center mb-8">
            Available Licensing Options
          </h2>
          <p className="text-lg text-zinc-700 mb-6">
            Depending on your organization, licensing may include:
          </p>
          <ul className="space-y-3 text-zinc-700">
            <li className="flex items-start">
              <span className="text-brand-green-600 font-bold mr-2">•</span>
              Single-organization deployment
            </li>
            <li className="flex items-start">
              <span className="text-brand-green-600 font-bold mr-2">•</span>
              Multi-organization or umbrella deployments
            </li>
            <li className="flex items-start">
              <span className="text-brand-green-600 font-bold mr-2">•</span>
              White-label or co-branded experiences
            </li>
            <li className="flex items-start">
              <span className="text-brand-green-600 font-bold mr-2">•</span>
              Employer and workforce board integrations
            </li>
            <li className="flex items-start">
              <span className="text-brand-green-600 font-bold mr-2">•</span>
              Apprenticeship and Earn While You Learn configurations
            </li>
          </ul>
        </div>
      </section>

      {/* Who Licenses */}
      <section className="px-4 sm:px-6 lg:px-10 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black text-zinc-900 text-center mb-8">
            Who Licenses the Platform
          </h2>
          <p className="text-lg text-zinc-700 mb-6">Licensing is intended for:</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-lg">
              <h3 className="text-lg font-bold text-zinc-900">Training providers and schools</h3>
            </div>
            <div className="p-6 bg-slate-50 rounded-lg">
              <h3 className="text-lg font-bold text-zinc-900">
                Workforce boards and public agencies
              </h3>
            </div>
            <div className="p-6 bg-slate-50 rounded-lg">
              <h3 className="text-lg font-bold text-zinc-900">Employer consortiums</h3>
            </div>
            <div className="p-6 bg-slate-50 rounded-lg">
              <h3 className="text-lg font-bold text-zinc-900">
                Nonprofits delivering funded programs
              </h3>
            </div>
            <div className="p-6 bg-slate-50 rounded-lg">
              <h3 className="text-lg font-bold text-zinc-900">Enterprise workforce initiatives</h3>
            </div>
          </div>
          <p className="mt-8 text-center text-zinc-700">
            All licensing relationships are reviewed to ensure mission alignment and responsible
            use.
          </p>
        </div>
      </section>

      {/* What Licensing Is Not */}
      <section className="px-4 sm:px-6 lg:px-10 py-16 bg-slate-50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black text-zinc-900 text-center mb-8">
            What Licensing Is Not
          </h2>
          <p className="text-lg text-zinc-700 mb-6">To maintain quality and security:</p>
          <ul className="space-y-3 text-zinc-700">
            <li className="flex items-start">
              <span className="text-brand-orange-600 font-bold mr-2">✗</span>
              The platform is not sold outright
            </li>
            <li className="flex items-start">
              <span className="text-brand-orange-600 font-bold mr-2">✗</span>
              Source code is not transferred
            </li>
            <li className="flex items-start">
              <span className="text-brand-orange-600 font-bold mr-2">✗</span>
              Licensing does not allow redistribution without approval
            </li>
            <li className="flex items-start">
              <span className="text-brand-orange-600 font-bold mr-2">✗</span>
              Each deployment is governed by a formal agreement
            </li>
          </ul>
          <p className="mt-6 text-zinc-700">
            This ensures long-term stability, updates, and support for all partners.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-10 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black text-zinc-900">Start a Licensing Conversation</h2>
          <p className="mt-4 text-lg text-zinc-700">
            If you are evaluating workforce infrastructure or replacing fragmented systems, a short
            conversation can determine fit quickly.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store/licenses/starter-license"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white bg-brand-green-600 rounded-lg hover:bg-brand-green-700 transition-colors"
            >
              Start License Setup
            </Link>
            <Link
              href="/store/demos"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-zinc-900 bg-white border-2 border-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Watch Demo First
            </Link>
            <Link
              href="/contact?topic=licensing"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-zinc-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Have Questions?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
