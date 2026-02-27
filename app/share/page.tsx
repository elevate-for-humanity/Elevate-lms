import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Share2, Users, Heart, Mail, MessageCircle, Copy } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/share' },
  title: 'Share Elevate | Elevate For Humanity',
  description: 'Help someone you know access career training at no cost. Share Elevate for Humanity with friends, family, or community members.',
};

const SHARE_OPTIONS = [
  {
    title: 'Refer a Friend or Family Member',
    desc: 'Know someone looking for career training? Send them our way. Many programs are available at no cost through WIOA and DOL funding.',
    icon: Users,
    href: '/enroll',
    cta: 'Send to Enrollment Page',
  },
  {
    title: 'Share with a Case Manager',
    desc: 'If you work with a workforce development agency, WorkOne office, or reentry program, share our training catalog with your clients.',
    icon: MessageCircle,
    href: '/partners/join',
    cta: 'Partner With Us',
  },
  {
    title: 'Email Our Programs Page',
    desc: 'Send a direct link to our programs page so someone can browse available training options.',
    icon: Mail,
    href: 'mailto:?subject=Check out Elevate for Humanity&body=I thought you might be interested in free career training programs: https://www.elevateforhumanity.org/programs',
    cta: 'Send via Email',
  },
];

export default function SharePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Share' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/heroes-hq/success-stories-hero.jpg" alt="Share Elevate for Humanity" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Share Elevate</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Help someone access free career training and change their life.</p>
          </div>
        </div>
      </section>

      {/* Share Options */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {SHARE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <div key={opt.title} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col">
                  <Icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{opt.title}</h3>
                  <p className="text-gray-600 text-sm mb-6 flex-1">{opt.desc}</p>
                  <Link
                    href={opt.href}
                    className="bg-brand-blue-600 text-white text-center px-4 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition text-sm"
                  >
                    {opt.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Copy Link */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Share Link</h2>
          <p className="text-gray-600 mb-6">Copy this link and share it anywhere — social media, text message, or email.</p>
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 max-w-lg mx-auto">
            <span className="text-gray-700 text-sm flex-1 truncate">https://www.elevateforhumanity.org/programs</span>
            <Copy className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="w-10 h-10 text-brand-red-500 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Your Referral Matters</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Many of our students found us through someone who cared enough to share. A single referral can lead to a career, a certification, and a better future for an entire family.
          </p>
        </div>
      </section>
    </div>
  );
}
