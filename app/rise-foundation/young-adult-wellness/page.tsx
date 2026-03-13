import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Users, BookOpen, Phone, Mail, ArrowRight, Star, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Young Adult Wellness Support | Selfish Inc. | Rise Foundation',
  description:
    'Essential support strategies for teen and young adult mental health. Resources and guidance for parents, caregivers, and young adults navigating challenges and building resilience. Selfish Inc. 501(c)(3), Indianapolis.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/rise-foundation/young-adult-wellness' },
};

const STRATEGIES = [
  {
    icon: BookOpen,
    title: 'Psychoeducation',
    desc: 'Help teens understand their emotions, stress responses, and mental health. Knowledge reduces stigma and builds self-awareness.',
  },
  {
    icon: Users,
    title: 'Peer Support Groups',
    desc: 'Facilitated peer groups where young adults connect with others facing similar challenges. Reduces isolation and builds community.',
  },
  {
    icon: Heart,
    title: 'Family Involvement',
    desc: 'Guidance for parents and caregivers on how to support a young person\'s mental health without overstepping or dismissing.',
  },
  {
    icon: Shield,
    title: 'Resilience Building',
    desc: 'Practical tools for coping with academic pressure, social challenges, identity development, and life transitions.',
  },
  {
    icon: Star,
    title: 'Strengths-Based Coaching',
    desc: 'Focus on what young adults do well. Build confidence and self-efficacy through goal-setting and achievement.',
  },
  {
    icon: Phone,
    title: 'Crisis Navigation',
    desc: 'Guidance for families on recognizing warning signs and connecting young adults to appropriate crisis resources.',
  },
];

const RESOURCES = [
  { title: 'Crisis Text Line', detail: 'Text HOME to 741741', href: 'https://www.crisistextline.org' },
  { title: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988', href: 'https://988lifeline.org' },
  { title: 'NAMI Teen & Young Adult HelpLine', detail: '1-800-950-6264', href: 'https://www.nami.org/Support-Education/NAMI-HelpLine' },
  { title: 'Teen Line', detail: '1-800-852-8336', href: 'https://www.teenline.org' },
];

export default function YoungAdultWellnessPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative h-[320px] sm:h-[420px] overflow-hidden bg-slate-900">
        <Image
          src="/images/pages/rise-foundation.jpg"
          alt="Young adult wellness support"
          fill sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex items-end pb-10 px-6">
          <div className="max-w-4xl mx-auto w-full">
            <p className="text-pink-400 font-bold text-xs uppercase tracking-widest mb-2">Selfish Inc. 501(c)(3)</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-2">
              Young Adult Wellness Support
            </h1>
            <p className="text-white/80 text-lg max-w-2xl">
              Essential support strategies for teen and young adult mental health — for young adults, parents, and caregivers.
            </p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-8 mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            &ldquo;Empowering Teens and Young Adults&rdquo;
          </h2>
          <p className="text-slate-700 text-lg leading-relaxed mb-4">
            Effective resources and tips for navigating challenges and building resilience. This program is designed for young adults ages 13–26, and for the parents and caregivers who support them.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Selfish Inc. believes that investing in young people&apos;s mental health is one of the highest-return investments a community can make. Our Young Adult Wellness program provides practical tools, peer connection, and family guidance — not clinical treatment, but real support that meets young people where they are.
          </p>
        </div>

        {/* Strategies */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Support Strategies</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {STRATEGIES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-pink-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* For Parents & Caregivers */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 mb-10">
          <h2 className="text-2xl font-bold mb-4">For Parents &amp; Caregivers</h2>
          <p className="text-white/80 leading-relaxed mb-6">
            Supporting a young person&apos;s mental health starts with understanding. Selfish Inc. offers guidance sessions for parents and caregivers — practical conversations about how to listen, when to act, and how to connect your young adult to the right resources without creating distance.
          </p>
          <ul className="space-y-3 text-white/80 text-sm mb-6">
            <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">✓</span> How to start the conversation about mental health</li>
            <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">✓</span> Recognizing warning signs of depression, anxiety, and crisis</li>
            <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">✓</span> Setting boundaries while staying connected</li>
            <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">✓</span> Navigating school, social media, and peer pressure</li>
            <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">✓</span> When and how to seek professional help</li>
          </ul>
          <Link
            href="/rise-foundation/get-involved"
            className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-lg transition"
          >
            Get Involved <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Crisis Resources */}
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Crisis Resources</h2>
        <p className="text-slate-600 mb-6">If you or a young person you know is in crisis, these resources are available 24/7.</p>
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {RESOURCES.map(({ title, detail, href }) => (
            <a
              key={title}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 bg-white border border-slate-200 rounded-xl p-5 hover:border-pink-300 transition shadow-sm"
            >
              <Phone className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-900 text-sm">{title}</p>
                <p className="text-slate-500 text-sm">{detail}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Contact */}
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Connect With Us</h2>
          <p className="text-slate-600 mb-6">
            Reach out to learn more about Young Adult Wellness programming or to schedule a family guidance session.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:info@selfishincsupport.org"
              className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-lg transition"
            >
              <Mail className="w-4 h-4" /> Email Us
            </a>
            <Link
              href="/rise-foundation/get-involved"
              className="inline-flex items-center gap-2 border border-pink-300 text-pink-700 font-bold px-6 py-3 rounded-lg hover:bg-pink-50 transition"
            >
              <Users className="w-4 h-4" /> Volunteer
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-4">
            Selfish Inc. 501(c)(3) &middot; Indianapolis, Indiana &middot;{' '}
            <a href="https://www.selfishincsupport.org" target="_blank" rel="noopener noreferrer" className="underline">selfishincsupport.org</a>
          </p>
        </div>
      </section>

      {/* Back nav */}
      <div className="border-t border-slate-100 py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/rise-foundation" className="text-pink-600 hover:underline text-sm font-medium">
            ← Back to Rise Foundation
          </Link>
        </div>
      </div>
    </div>
  );
}
