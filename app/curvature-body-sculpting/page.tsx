import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Heart,
  Star,
  CheckCircle,
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  Shield,
  Award,
  Users,
  Calendar,
} from 'lucide-react';
import Testimonials from './components/Testimonials';

export const metadata: Metadata = {
  title: 'Curvature Body Sculpting | Body Contouring & Meri-Go-Round Wellness Products | Indianapolis',
  description: 'Professional body sculpting services and Meri-Go-Round wellness products in Indianapolis. Non-invasive body contouring, handcrafted teas, butters, oils, and soaps. Partner of VITA and Selfish Inc.',
  openGraph: {
    title: 'Curvature Body Sculpting - Body Contouring & Wellness',
    description: 'Professional body sculpting services and Meri-Go-Round wellness products in Indianapolis.',
    images: ['/images/beauty/esthetician.jpg'],
  },
};

const services = [
  {
    name: 'Body Contouring',
    description: 'Non-invasive fat reduction and body shaping treatments',
    price: 'From $199',
    icon: Sparkles,
  },
  {
    name: 'Skin Tightening',
    description: 'Radio frequency and ultrasound skin firming treatments',
    price: 'From $149',
    icon: Star,
  },
  {
    name: 'Cellulite Reduction',
    description: 'Advanced treatments to smooth and tone skin texture',
    price: 'From $129',
    icon: Heart,
  },
  {
    name: 'Lymphatic Drainage',
    description: 'Detoxifying massage to reduce bloating and improve circulation',
    price: 'From $89',
    icon: Shield,
  },
];

const wellnessProducts = [
  {
    name: 'Meri-Go-Round Calm Blend Tea',
    description: 'Soothing herbal blend with chamomile, lavender, and passionflower',
    price: '$18.99',
  },
  {
    name: 'Meri-Go-Round Shea Body Butter',
    description: 'Rich, creamy shea butter infused with lavender for deep moisturizing',
    price: '$24.99',
  },
  {
    name: 'Meri-Go-Round Essential Oil Set',
    description: 'Collection of 6 essential oils for aromatherapy and wellness',
    price: '$44.99',
  },
];

export default function CurvatureBodySculptingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 min-h-[600px] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/beauty/esthetician.jpg"
            alt="Curvature Body Sculpting"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-pink-900/90 via-purple-900/80 to-indigo-900/70" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
            <Heart className="w-4 h-4 text-pink-300" />
            VITA & Selfish Inc. Partner
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            Curvature Body Sculpting
          </h1>
          <p className="text-xl text-pink-100 max-w-2xl mx-auto mb-8">
            Transform your body. Nurture your mind. Professional body contouring services 
            and mental health wellness products.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/curvature-body-sculpting/book-appointment"
              className="px-8 py-4 bg-white text-purple-700 font-bold rounded-lg hover:bg-pink-50 transition"
            >
              Book Appointment
            </Link>
            <Link
              href="/curvature-body-sculpting/shop"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition"
            >
              Shop Wellness Products
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-pink-200">
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              7009 E 56th St, Suite EE1, Indianapolis, IN 46226
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Mon-Sat 9am-7pm
            </span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Body Sculpting Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Non-invasive treatments to help you look and feel your best
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div
                key={service.name}
                className="bg-white rounded-2xl p-6 border hover:shadow-xl hover:border-pink-200 transition group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                <p className="text-pink-600 font-bold">{service.price}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/curvature-body-sculpting/services"
              className="inline-flex items-center gap-2 text-purple-600 font-semibold hover:text-purple-700"
            >
              View All Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Wellness Products */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
              <Heart className="w-4 h-4" />
              Meri-Go-Round Products
            </div>
            <h2 className="text-3xl font-bold mb-4">Wellness Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Handcrafted teas, body butters, essential oils, and soaps to support your wellness journey. 
              Partnered with Selfish Inc. 501(c)(3) for community wellness.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {wellnessProducts.map((product) => (
              <div
                key={product.name}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition"
              >
                <div className="w-full h-40 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl mb-4 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-purple-600 font-bold">{product.price}</span>
                  <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/curvature-body-sculpting/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
            >
              Shop All Products <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Curvature?</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-bold mb-2">Certified Technicians</h3>
              <p className="text-gray-600 text-sm">Trained and certified professionals</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold mb-2">Safe & Non-Invasive</h3>
              <p className="text-gray-600 text-sm">FDA-cleared treatments</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-bold mb-2">Holistic Approach</h3>
              <p className="text-gray-600 text-sm">Body and mind wellness</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold mb-2">Community Focused</h3>
              <p className="text-gray-600 text-sm">VITA & Selfish Inc. partner</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <Testimonials />

      {/* Careers - Employer Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20 rounded-full text-pink-300 text-sm font-medium mb-4">
                <Users className="w-4 h-4" />
                Now Hiring
              </div>
              <h2 className="text-3xl font-bold mb-4">Join Our Team</h2>
              <p className="text-slate-300 mb-6">
                We hire graduates from Elevate for Humanity's esthetician and beauty programs. 
                Start your career in body sculpting and wellness.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Paid training provided</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Competitive pay + commission</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Career advancement opportunities</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Flexible scheduling</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/curvature-body-sculpting/careers"
                  className="px-6 py-3 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition"
                >
                  View Open Positions
                </Link>
                <Link
                  href="/programs/esthetician-apprenticeship"
                  className="px-6 py-3 border border-white/30 text-white font-medium rounded-lg hover:bg-white/10 transition"
                >
                  Get Trained First
                </Link>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-xl font-bold mb-4">Open Positions</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="font-bold">Body Sculpting Technician</h4>
                  <p className="text-slate-400 text-sm">Full-time • Indianapolis, IN</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="font-bold">Esthetician</h4>
                  <p className="text-slate-400 text-sm">Full-time • Indianapolis, IN</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="font-bold">Wellness Consultant</h4>
                  <p className="text-slate-400 text-sm">Part-time • Indianapolis, IN</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Partnership */}
      <section className="py-16 bg-purple-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Community Partnership</h2>
          <p className="text-gray-600 mb-8">
            Curvature Body Sculpting proudly partners with VITA and Selfish Inc. 501(c)(3) 
            to provide wellness products and services to our community.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/vita"
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
            >
              Free Tax Services (VITA)
            </Link>
            <Link
              href="/nonprofit"
              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
            >
              Selfish Inc. Mental Wellness
            </Link>
            <Link
              href="/programs"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Free Job Training
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform?</h2>
          <p className="text-pink-100 mb-8">
            Book your consultation today and start your journey to a more confident you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/curvature-body-sculpting/book-appointment"
              className="px-8 py-4 bg-white text-purple-700 font-bold rounded-lg hover:bg-pink-50 transition flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Book Free Consultation
            </Link>
            <a
              href="tel:3173143757"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition flex items-center gap-2"
            >
              <Phone className="w-5 h-5" />
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
