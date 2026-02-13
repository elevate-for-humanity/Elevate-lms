import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface FooterPageTemplateProps {
  title: string;
  description: string;
  heroImage?: string;
  children: React.ReactNode;
}

export default function FooterPageTemplate({
  title,
  description,
  heroImage = "/images/artlist/hero-training-1.jpg",
  children,
}: FooterPageTemplateProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: title }]} />
        </div>
      </div>

      {/* Hero Banner */}
      <section className="relative min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover"
            priority
            quality={90}
            sizes="100vw"
          />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-wide text-orange-400 mb-4">
              Legal Information
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl">
              {title}
            </h1>
            <p className="text-lg md:text-xl text-white/95 drop-shadow-lg">
              {description}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate max-w-none">
              {children}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/artlist/hero-training-2.jpg"
                  alt="Elevate For Humanity Training"
                  fill
                  className="object-cover"
                  quality={90}
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-black mb-4">
                  Questions About Our Policies?
                </h2>
                <p className="text-black mb-6">
                  Our team is here to help. Contact us for clarification on any of our policies or to learn more about our programs.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/contact"
                    className="px-6 py-3 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-700 transition"
                  >
                    Contact Us
                  </Link>
                  <a
                    href="/support"
                    className="px-6 py-3 border-2 border-orange-600 text-orange-600 font-bold rounded-full hover:bg-orange-50 transition"
                  >
                    Call 317-314-3757
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-white border-t border-slate-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-black mb-6 text-center">
              Related Information
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Link
                href="/privacy-policy"
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition text-center"
              >
                <div className="font-semibold text-black">Privacy Policy</div>
                <div className="text-sm text-black mt-1">How we protect your data</div>
              </Link>
              <Link
                href="/terms-of-service"
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition text-center"
              >
                <div className="font-semibold text-black">Terms of Service</div>
                <div className="text-sm text-black mt-1">Our service agreement</div>
              </Link>
              <Link
                href="/refund-policy"
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition text-center"
              >
                <div className="font-semibold text-black">Refund Policy</div>
                <div className="text-sm text-black mt-1">Our refund terms</div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
