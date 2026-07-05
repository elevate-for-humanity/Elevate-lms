import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { FileText, Mail, Phone, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: `Press | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Press releases, media kit, and contact information for media inquiries about Elevate for Humanity.',
};

const pressReleases = [
  {
    title: 'Elevate for Humanity Launches New HVAC Technician Program',
    date: '2026-06-15',
    summary: 'DOL-registered apprenticeship program addresses skilled trades shortage in Indiana.',
  },
  {
    title: 'WIOA Partnership Expands Workforce Training Access',
    date: '2026-05-01',
    summary: 'New agreement with WorkOne centers increases funding opportunities for eligible students.',
  },
  {
    title: 'Record Graduation: 500+ Students Complete Training in 2025',
    date: '2026-01-15',
    summary: 'Milestone achievement reflects growing demand for workforce development programs.',
  },
];

export default function PressPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Press & Media</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            News, press releases, and media resources from Elevate for Humanity
          </p>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Press Releases</h2>
          <div className="space-y-6">
            {pressReleases.map((release, i) => (
              <article key={i} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-red-100 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-brand-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{release.date}</p>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{release.title}</h3>
                    <p className="text-slate-600">{release.summary}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Media Kit</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Brand Guidelines</h3>
              <p className="text-slate-600 text-sm mb-4">Logos, colors, and usage guidelines for Elevate for Humanity.</p>
              <a href="#" className="inline-flex items-center gap-1 text-brand-red-600 text-sm font-semibold">
                Download <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Fact Sheet</h3>
              <p className="text-slate-600 text-sm mb-4">Key statistics and program overview in a printable format.</p>
              <a href="#" className="inline-flex items-center gap-1 text-brand-red-600 text-sm font-semibold">
                Download <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">High-Res Photos</h3>
              <p className="text-slate-600 text-sm mb-4">Professional photos of our facilities, staff, and students.</p>
              <a href="#" className="inline-flex items-center gap-1 text-brand-red-600 text-sm font-semibold">
                Download <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Media Inquiries</h2>
          <p className="text-slate-600 mb-8">
            For press inquiries, interview requests, or additional information, please contact:
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-500" />
              <a href="mailto:press@elevateforhumanity.org" className="text-brand-red-600 font-semibold">
                press@elevateforhumanity.org
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-500" />
              <span className="text-slate-700">{PLATFORM_DEFAULTS.supportPhone}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
