'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Briefcase, GraduationCap, Phone, Settings } from 'lucide-react';

export default function ContactClient() {
  const contactOptions = [
    {
      title: 'Students & Applicants',
      description:
        'Ready to start your career journey? Learn about programs, funding, and enrollment.',
      image: '/images/efh/sections/staffing.jpg',
      href: '/apply',
      icon: '<GraduationCap className="w-5 h-5 inline-block" />',
      color: ' ',
    },
    {
      title: 'Training Providers',
      description:
        'Partner with us to deliver programs through our platform and expand your reach.',
      image: '/images/heroes/training-provider-1.jpg',
      href: '/platform',
      icon: '🏫',
      color: ' ',
    },
    {
      title: 'Employers',
      description:
        'Build your talent pipeline and connect with skilled workers ready for employment.',
      image: '/images/learners/reentry-coaching.jpg',
      href: '/employers',
      icon: '<Briefcase className="w-5 h-5 inline-block" />',
      color: ' ',
    },
    {
      title: 'Workforce Boards',
      description:
        'Collaborate on workforce development initiatives and funding partnerships.',
      image: '/images/facilities-new/facility-8.jpg',
      href: '/platform/workforce-boards',
      icon: '🤝',
      color: ' ',
    },
    {
      title: 'Platform Licensing',
      description:
        'License our platform for your organization and deliver training at scale.',
      image: '/images/learners/barrier-support.jpg',
      href: '/platform/licensing',
      icon: '<Settings className="w-5 h-5 inline-block" />',
      color: ' ',
    },
    {
      title: 'General Inquiry',
      description:
        'Have a question? Get in touch with our team for any other inquiries.',
      image: '/images/facilities-new/facility-1.jpg',
      href: 'mailto:info@elevateforhumanity.org',
      icon: '✉️',
      color: ' ',
    },
  ];

  return (
    <main className="bg-white overflow-hidden">
      {/* Hero Section with Curved Bottom */}
      <section className="relative bg-zinc-900    py-24 md:py-32 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-block px-6 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Contact Us
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Hey there, how can we help?
          </h1>
          <p className="text-base md:text-lg text-white/90 max-w-3xl mx-auto">
            The best way to experience Elevate is to see it for yourself. Choose
            your path below and we'll connect you with the right team.
          </p>
        </div>

        {/* Curved bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 bg-white"
          style={{ clipPath: 'ellipse(100% 100% at 50% 100%)' }}
        />
      </section>

      {/* Contact Options Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {contactOptions.map((option, idx) => (
              <Link key={idx} href={option.href} className="group relative">
                <div className="relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  {/* Image */}
                  <div className="relative h-72 overflow-hidden">
                    <Image
                      loading="lazy"
                      src={option.image}
                      alt={option.title}
                      fill
                      sizes="100vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      quality={75}
                    />
                    {/* Overlay removed - no gradients */}

                    {/* Icon badge */}
                    <div className="absolute top-6 right-6 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      <span className="text-3xl">{option.icon}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-zinc-900">
                    <h3 className="text-lg md:text-lg font-bold text-white mb-2 group-hover:text-brand-orange-300 transition">
                      {option.title}
                    </h3>
                    <p className="text-white text-sm leading-relaxed">
                      {option.description}
                    </p>
                    <div className="mt-4 inline-flex items-center text-white font-bold group-hover:gap-2 transition-all">
                      Get Started
                      <span className="ml-2 group-hover:ml-4 transition-all">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Contact Section */}
      <section className="py-20 bg-zinc-900   relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange-200 rounded-full opacity-20 blur-3xl" />

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Get Started */}
            <div className="bg-white rounded-3xl p-10 shadow-xl">
              <div className="w-20 h-20 bg-zinc-900   rounded-3xl flex items-center justify-center mb-6 transform hover:scale-110 transition-transform">
                <span className="text-4xl">
                  <Phone className="w-5 h-5 inline-block" />
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
                Prefer to get started?
              </h2>
              <p className="text-black mb-6 leading-relaxed">
                You can reach us Monday-Friday, 8am-5pm EST. Our advisors are
                ready to help you find the right program.
              </p>
              <a
                href="/support"
                className="inline-flex items-center justify-center bg-zinc-900   text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                support center
              </a>
            </div>

            {/* Right: Email */}
            <div className="bg-white rounded-3xl p-10 shadow-xl">
              <div className="w-20 h-20 bg-zinc-900   rounded-3xl flex items-center justify-center mb-6 transform hover:scale-110 transition-transform">
                <span className="text-4xl">✉️</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
                Send us an email
              </h2>
              <p className="text-black mb-6 leading-relaxed">
                Have a detailed question? Email us and we'll respond within 24
                hours with the information you need.
              </p>
              <a
                href="mailto:info@elevateforhumanity.org"
                className="inline-flex items-center justify-center bg-zinc-900   text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Already Enrolled Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-zinc-900   rounded-3xl p-12 shadow-2xl relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange-600/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Already enrolled?
              </h2>
              <p className="text-white/80 text-lg mb-8">
                Sign in to access your courses, track progress, and manage your
                account.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-white text-black px-10 py-4 rounded-2xl font-bold text-lg hover:bg-brand-orange-600 hover:text-white transition-all shadow-xl"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Join Section */}
      <section className="py-20 bg-zinc-900  ">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
            Ready to start your journey?
          </h2>
          <p className="text-base md:text-lg text-black mb-8">
            Apply now and take the first step toward a better future.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center justify-center bg-zinc-900   text-white px-12 py-5 rounded-2xl font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            Apply Now
          </Link>
        </div>
      </section>
    </main>
  );
}
