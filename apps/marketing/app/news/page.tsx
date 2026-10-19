import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, ExternalLink, ChevronRight, Newspaper, Award, Users, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'News & Announcements',
  description: 'Latest news, announcements, and press releases from Elevate for Humanity. Stay informed about workforce development initiatives.',
};

const NEWS_ITEMS: Array<never> = [];
const PRESS_RELEASES: Array<never> = [];

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">News & Announcements</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Stay informed about Elevate for Humanity's latest initiatives, partnerships, and workforce development news.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <Newspaper className="h-8 w-8 text-brand-blue-700" />
            <h2 className="mt-4 text-2xl font-bold text-slate-900">Verified announcements only</h2>
            <p className="mt-3 leading-7 text-slate-600">
              No independently sourced press release is currently published on this page. Program approvals,
              funding status, apprenticeship registration, and quantitative outcomes are published only when
              the underlying record is available and current.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/approvals" className="font-semibold text-brand-blue-700 hover:underline">Review approvals</Link>
              <Link href="/programs" className="font-semibold text-brand-blue-700 hover:underline">Review programs</Link>
              <Link href="/contact" className="font-semibold text-brand-blue-700 hover:underline">Media inquiries</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Media Resources */}
      <section className="py-16 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Media Resources</h2>
          <p className="text-blue-200 mb-8">
            Download our brand guidelines, logos, and high-resolution photos for media use.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-700 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors">
              <Building2 className="w-5 h-5" />
              Brand Assets
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold py-3 px-6 rounded-lg hover:bg-white/10 transition-colors">
              <Users className="w-5 h-5" />
              Media Kit
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
