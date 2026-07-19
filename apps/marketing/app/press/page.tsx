import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Press & Media | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Press releases, media coverage, and news about ${PLATFORM_DEFAULTS.orgName}.`,
};

export default function PressPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Press & Media</h1>
          <p className="text-xl text-slate-300">
            News, announcements, and media resources from {PLATFORM_DEFAULTS.orgName}.
          </p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center py-16">
          <p className="text-slate-600 text-lg">
            Media inquiries: <a href={`mailto:${PLATFORM_DEFAULTS.orgEmail}`} className="text-blue-600 underline">{PLATFORM_DEFAULTS.orgEmail}</a>
          </p>
        </div>
      </section>
    </div>
  );
}
