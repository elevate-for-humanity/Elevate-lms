import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Heart,
  Star,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Services | Curvature Body Sculpting | Body Contouring & Wellness',
  description: 'Non-invasive body sculpting services including body contouring, skin tightening, cellulite reduction, and lymphatic drainage. Book your consultation today.',
};

const services = [
  {
    id: 'body-contouring',
    name: 'Body Contouring',
    tagline: 'Sculpt your ideal shape',
    description: 'Non-invasive fat reduction using advanced technology to target stubborn fat deposits. See visible results in as few as 2-4 sessions.',
    price: 'From $199/session',
    duration: '60 minutes',
    icon: Sparkles,
    color: 'pink',
    benefits: [
      'Targets stubborn fat areas',
      'No surgery or downtime',
      'Visible results in 2-4 weeks',
      'Permanent fat cell reduction',
    ],
    areas: ['Abdomen', 'Love handles', 'Thighs', 'Arms', 'Back', 'Chin'],
  },
  {
    id: 'skin-tightening',
    name: 'Skin Tightening',
    tagline: 'Firm and tone your skin',
    description: 'Radio frequency and ultrasound treatments to stimulate collagen production and tighten loose skin.',
    price: 'From $149/session',
    duration: '45 minutes',
    icon: Star,
    color: 'purple',
    benefits: [
      'Stimulates collagen production',
      'Tightens loose skin',
      'Reduces fine lines',
      'No downtime required',
    ],
    areas: ['Face', 'Neck', 'Arms', 'Abdomen', 'Thighs'],
  },
  {
    id: 'cellulite-reduction',
    name: 'Cellulite Reduction',
    tagline: 'Smooth and tone',
    description: 'Advanced treatments to break down cellulite and improve skin texture for smoother, more toned appearance.',
    price: 'From $129/session',
    duration: '45 minutes',
    icon: Heart,
    color: 'indigo',
    benefits: [
      'Reduces cellulite appearance',
      'Improves skin texture',
      'Increases circulation',
      'Long-lasting results',
    ],
    areas: ['Thighs', 'Buttocks', 'Abdomen', 'Arms'],
  },
  {
    id: 'lymphatic-drainage',
    name: 'Lymphatic Drainage',
    tagline: 'Detox and rejuvenate',
    description: 'Specialized massage technique to stimulate lymphatic system, reduce bloating, and improve overall wellness.',
    price: 'From $89/session',
    duration: '60 minutes',
    icon: Shield,
    color: 'green',
    benefits: [
      'Reduces bloating and water retention',
      'Boosts immune system',
      'Improves circulation',
      'Promotes detoxification',
    ],
    areas: ['Full body treatment'],
  },
  {
    id: 'body-wrap',
    name: 'Detox Body Wrap',
    tagline: 'Cleanse and contour',
    description: 'Detoxifying body wrap treatment to help eliminate toxins, reduce inches, and improve skin appearance.',
    price: 'From $99/session',
    duration: '75 minutes',
    icon: Zap,
    color: 'amber',
    benefits: [
      'Temporary inch loss',
      'Skin detoxification',
      'Improved skin tone',
      'Relaxation benefits',
    ],
    areas: ['Full body treatment'],
  },
];

const packages = [
  {
    name: 'Starter Package',
    sessions: 3,
    price: '$499',
    savings: 'Save $98',
    description: 'Perfect for trying body sculpting',
  },
  {
    name: 'Transformation Package',
    sessions: 6,
    price: '$899',
    savings: 'Save $295',
    description: 'Best results for most clients',
    popular: true,
  },
  {
    name: 'Ultimate Package',
    sessions: 10,
    price: '$1,399',
    savings: 'Save $591',
    description: 'Maximum transformation',
  },
];

const colorClasses: Record<string, { bg: string; light: string; text: string }> = {
  pink: { bg: 'bg-pink-600', light: 'bg-pink-50', text: 'text-pink-600' },
  purple: { bg: 'bg-purple-600', light: 'bg-purple-50', text: 'text-purple-600' },
  indigo: { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600' },
  green: { bg: 'bg-green-600', light: 'bg-green-50', text: 'text-green-600' },
  amber: { bg: 'bg-amber-600', light: 'bg-amber-50', text: 'text-amber-600' },
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="/images/beauty/program-beauty-training.jpg"
            alt="Body Sculpting Services"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-900/90 via-purple-900/80 to-indigo-900/70" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-black mb-6">Our Services</h1>
          <p className="text-xl text-pink-100 max-w-2xl mx-auto mb-8">
            Non-invasive body sculpting and wellness treatments to help you look and feel your best
          </p>
          <Link
            href="/curvature-body-sculpting/book-appointment"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-700 font-bold rounded-lg hover:bg-pink-50 transition"
          >
            <Calendar className="w-5 h-5" />
            Book Free Consultation
          </Link>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-16">
            {services.map((service, index) => {
              const colors = colorClasses[service.color];
              return (
                <div
                  key={service.id}
                  className={`grid md:grid-cols-2 gap-8 items-center ${
                    index % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 ${colors.light} ${colors.text} rounded-full text-sm font-medium mb-4`}>
                      <service.icon className="w-4 h-4" />
                      {service.tagline}
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{service.name}</h2>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    
                    <div className="flex flex-wrap gap-4 mb-6">
                      <span className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-5 h-5 text-gray-400" />
                        {service.duration}
                      </span>
                      <span className={`font-bold ${colors.text}`}>{service.price}</span>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">Benefits:</h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {service.benefits.map((benefit) => (
                          <li key={benefit} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className={`w-4 h-4 ${colors.text}`} />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold mb-2">Treatment Areas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.areas.map((area) => (
                          <span key={area} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Link
                      href={`/curvature-body-sculpting/book-appointment?service=${service.id}`}
                      className={`inline-flex items-center gap-2 px-6 py-3 ${colors.bg} text-white font-bold rounded-lg hover:opacity-90 transition`}
                    >
                      Book This Service <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className={`${colors.light} rounded-2xl p-8 flex items-center justify-center min-h-[300px] ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                    <service.icon className={`w-32 h-32 ${colors.text} opacity-50`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Body Sculpting Packages</h2>
            <p className="text-gray-600">Save more with our multi-session packages</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`bg-white rounded-2xl p-6 ${
                  pkg.popular ? 'ring-2 ring-purple-600 shadow-xl' : 'border'
                }`}
              >
                {pkg.popular && (
                  <span className="inline-block px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-black text-gray-900">{pkg.price}</span>
                  <span className="text-gray-500 text-sm ml-2">for {pkg.sessions} sessions</span>
                </div>
                <p className="text-green-600 font-medium text-sm mb-6">{pkg.savings}</p>
                <Link
                  href="/curvature-body-sculpting/book-appointment"
                  className={`block text-center py-3 rounded-lg font-bold transition ${
                    pkg.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform?</h2>
          <p className="text-pink-100 mb-8">
            Book your free consultation and let us create a personalized treatment plan for you.
          </p>
          <Link
            href="/curvature-body-sculpting/book-appointment"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-700 font-bold rounded-lg hover:bg-pink-50 transition"
          >
            <Calendar className="w-5 h-5" />
            Book Free Consultation
          </Link>
        </div>
      </section>
    </div>
  );
}
