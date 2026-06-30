'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  CheckCircle, CreditCard, Calculator, ArrowRight, 
  Shield, Clock, Users, Award, Star, Phone, MapPin,
  Package, Sparkles, Scissors, Droplet, Flower2,
  ChevronRight, Lock, Percent, Truck
} from 'lucide-react';

// Pexels Images
const PEXELS_IMAGES = {
  barber: 'https://images.pexels.com/photos/7697278/pexels-photo-7697278.jpeg?auto=compress&cs=tinysrgb&h=600&w=800',
  cosmetology: 'https://images.pexels.com/photos/5584459/pexels-photo-5584459.jpeg?auto=compress&cs=tinysrgb&h=600&w=800',
  esthetician: 'https://images.pexels.com/photos/5583976/pexels-photo-5583976.jpeg?auto=compress&cs=tinysrgb&h=600&w=800',
  nail: 'https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&cs=tinysrgb&h=600&w=800',
};

const PACKAGES = [
  {
    id: 'barber',
    name: 'Barber Apprenticeship',
    hours: '2,000 Hours',
    image: PEXELS_IMAGES.barber,
    icon: <Scissors className="w-8 h-8" />,
    color: 'from-amber-500 to-orange-600',
    programs: [
      { name: 'Essential', price: 2490, deposit: 249, weekly: 48, features: ['Online RTI coursework', 'Exam prep materials', 'Digital textbooks', 'Email support'] },
      { name: 'Complete', price: 4980, deposit: 600, weekly: 84, popular: true, features: ['Everything in Essential', 'Professional barber kit', 'State board exam fee', 'CPR certification', 'Career placement', '1-on-1 coaching'] },
      { name: 'Premium', price: 6980, deposit: 1000, weekly: 115, features: ['Everything in Complete', 'Advanced techniques', 'Business bootcamp', 'Marketing training', 'VIP mentorship', 'Equipment upgrades'] },
    ]
  },
  {
    id: 'cosmetology',
    name: 'Cosmetology Apprenticeship',
    hours: '2,000 Hours',
    image: PEXELS_IMAGES.cosmetology,
    icon: <Sparkles className="w-8 h-8" />,
    color: 'from-purple-500 to-pink-600',
    programs: [
      { name: 'Essential', price: 2490, deposit: 249, weekly: 48, features: ['Online RTI coursework', 'Exam prep materials', 'Digital textbooks', 'Email support'] },
      { name: 'Complete', price: 4980, deposit: 600, weekly: 84, popular: true, features: ['Everything in Essential', 'Professional cosmetology kit', 'State board exam fee', 'CPR certification', 'Career placement', 'Color theory training'] },
      { name: 'Premium', price: 6980, deposit: 1000, weekly: 115, features: ['Everything in Complete', 'Advanced coloring', 'Balayage training', 'Business bootcamp', 'VIP mentorship', 'Equipment upgrades'] },
    ]
  },
  {
    id: 'esthetician',
    name: 'Esthetician Apprenticeship',
    hours: '2,000 Hours',
    image: PEXELS_IMAGES.esthetician,
    icon: <Droplet className="w-8 h-8" />,
    color: 'from-teal-500 to-cyan-600',
    programs: [
      { name: 'Essential', price: 2490, deposit: 249, weekly: 48, features: ['Online RTI coursework', 'Exam prep materials', 'Digital textbooks', 'Email support'] },
      { name: 'Complete', price: 4980, deposit: 600, weekly: 84, popular: true, features: ['Everything in Essential', 'Professional esthetics kit', 'State board exam fee', 'CPR certification', 'Career placement', 'Chemical peel training'] },
      { name: 'Premium', price: 6980, deposit: 1000, weekly: 115, features: ['Everything in Complete', 'Advanced facials', 'Medical esthetics intro', 'Business bootcamp', 'VIP mentorship', 'Equipment upgrades'] },
    ]
  },
  {
    id: 'nail',
    name: 'Nail Technician',
    hours: '2,000 Hours',
    image: PEXELS_IMAGES.nail,
    icon: <Flower2 className="w-8 h-8" />,
    color: 'from-rose-500 to-red-600',
    programs: [
      { name: 'Essential', price: 2490, deposit: 249, weekly: 48, features: ['Online RTI coursework', 'Exam prep materials', 'Digital textbooks', 'Email support'] },
      { name: 'Complete', price: 4980, deposit: 600, weekly: 84, popular: true, features: ['Everything in Essential', 'Professional nail kit', 'State board exam fee', 'CPR certification', 'Career placement', 'Gel & acrylic training'] },
      { name: 'Premium', price: 6980, deposit: 1000, weekly: 115, features: ['Everything in Complete', 'Advanced nail art', '3D designs', 'Business bootcamp', 'VIP mentorship', 'Equipment upgrades'] },
    ]
  },
];

const TRUST_BADGES = [
  { icon: <Award className="w-5 h-5" />, text: 'DOL Registered' },
  { icon: <CheckCircle className="w-5 h-5" />, text: 'ETPL Listed' },
  { icon: <Shield className="w-5 h-5" />, text: 'Secure Checkout' },
  { icon: <Clock className="w-5 h-5" />, text: '98% Pass Rate' },
];

export default function BeautyCheckoutPage() {
  const [selectedProgram, setSelectedProgram] = useState('barber');
  const [selectedPackage, setSelectedPackage] = useState<number>(1);
  const [customDeposit, setCustomDeposit] = useState<number>(600);
  const [processing, setProcessing] = useState(false);

  const currentProgram = PACKAGES.find(p => p.id === selectedProgram)!;
  const currentPackage = currentProgram.programs[selectedPackage];
  
  const balance = currentPackage.price - customDeposit;
  const weeks = 52;
  const weeklyPayment = (balance / weeks).toFixed(2);

  const handleCheckout = async () => {
    setProcessing(true);
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedProgram,
          successUrl: `${window.location.origin}/checkout/success?program=${selectedProgram}&package=${selectedPackage}`,
          cancelUrl: `${window.location.origin}/beauty-checkout`
        })
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed. Please try again.');
        setProcessing(false);
      }
    } catch (error) {
      alert('Checkout failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/barber-and-beauty-apprenticeships" className="text-2xl font-black text-gray-900">
              ELEVATE<span className="text-amber-500">.</span>
            </Link>
            <div className="flex items-center gap-4">
              <a href="tel:3173143757" className="flex items-center gap-2 text-gray-600 hover:text-amber-500">
                <Phone className="w-5 h-5" />
                (317) 314-3757
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Trust Bar */}
      <div className="bg-gray-900 text-white py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            {TRUST_BADGES.map((badge, i) => (
              <span key={i} className="flex items-center gap-2 text-sm">
                {badge.icon}
                {badge.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Choose Your <span className="text-amber-500">Package</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select your program and choose the package that fits your goals and budget.
            All packages include 2,000 hours of RTI and Indiana state licensure prep.
          </p>
        </div>

        {/* Program Selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {PACKAGES.map((program) => (
            <button
              key={program.id}
              onClick={() => setSelectedProgram(program.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold transition-all ${
                selectedProgram === program.id
                  ? `bg-gradient-to-r ${program.color} text-white shadow-lg`
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {program.icon}
              <span>{program.name}</span>
              <span className="text-sm opacity-80">{program.hours}</span>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Package Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-6 h-6 text-gray-700" />
              <h2 className="text-2xl font-bold text-gray-900">Select Your Package</h2>
            </div>

            {currentProgram.programs.map((pkg, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPackage(idx)}
                className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all border-4 ${
                  selectedPackage === idx
                    ? 'border-amber-500 shadow-xl'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black px-4 py-1 text-xs font-bold rounded-full">
                      ⭐ MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{pkg.name}</h3>
                    <p className="text-gray-500">Everything you need to get licensed and hired</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-gray-900">${pkg.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 mb-6">
                  {pkg.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    <span className="font-bold text-gray-900">${pkg.deposit} deposit</span> + ${pkg.weekly}/week
                  </div>
                  {selectedPackage === idx && (
                    <CheckCircle className="w-6 h-6 text-amber-500" />
                  )}
                </div>
              </div>
            ))}

            {/* BNPL Info */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Percent className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Buy Now, Pay Later with Klarna</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Split your payments across 12, 24, or 36 months. 0% interest options available. No credit check required for qualifying purchases.
                  </p>
                  <div className="flex gap-4">
                    <img src="https://cdn.klarna.com/1.0/images/shared/social-media/klarna-badge.png" alt="Klarna" className="h-8" />
                  </div>
                </div>
              </div>
            </div>

            {/* Deposit Slider */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-6 h-6 text-gray-700" />
                <h4 className="font-bold text-gray-900">Customize Your Payment</h4>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <label className="font-medium text-gray-700">Deposit Amount</label>
                  <span className="font-bold text-amber-600">${customDeposit}</span>
                </div>
                <input
                  type="range"
                  min={currentPackage.deposit}
                  max={currentPackage.price * 0.5}
                  step="50"
                  value={customDeposit}
                  onChange={(e) => setCustomDeposit(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>${currentPackage.deposit} min</span>
                  <span>${(currentPackage.price * 0.5).toLocaleString()} max</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Program Total</p>
                    <p className="text-lg font-bold text-gray-900">${currentPackage.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Your Deposit</p>
                    <p className="text-lg font-bold text-green-600">${customDeposit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Weekly Payment</p>
                    <p className="text-lg font-bold text-amber-600">${weeklyPayment}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden sticky top-8">
              {/* Program Image */}
              <div className="relative h-48">
// IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback)
                <Image sizes="100vw"
                  src={currentProgram.image}
                  alt={currentProgram.name}
                  fill
                  className="object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${currentProgram.color} opacity-60`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    {currentProgram.icon}
                    <p className="font-bold mt-2">{currentProgram.name}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-black text-gray-900 mb-4">Order Summary</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{currentPackage.name} Package</span>
                    <span className="font-bold text-gray-900">${currentPackage.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Your Deposit</span>
                    <span className="font-bold">-${customDeposit}</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Balance (52 weeks)</span>
                    <span className="font-bold">${balance.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-black text-gray-900">${currentPackage.price.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Schedule */}
                <div className="bg-amber-50 rounded-xl p-4 mb-6">
                  <p className="text-sm font-bold text-amber-800 mb-2">Your Payment Plan</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-amber-600">${customDeposit}</span>
                    <span className="text-amber-700">today</span>
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    + ${weeklyPayment}/week for 52 weeks
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      ENROLL NOW
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout powered by Stripe</span>
                </div>

                {/* BNPL Options */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Buy Now, Pay Later Options
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 py-3 px-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all">
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Klarna
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 px-4 bg-[#00B4E6] text-white rounded-xl font-bold hover:bg-[#009FCC] transition-all">
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                      Affirm
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Split your payment across 4 interest-free installments or choose longer terms with Affirm.
                  </p>
                </div>

                {/* What's Included */}
                <div className="mt-6 pt-6 border-t">
                  <p className="font-bold text-gray-900 mb-3">What's Included:</p>
                  <ul className="space-y-2">
                    {currentPackage.features.slice(0, 4).map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Employer Sponsorship Option */}
                <div className="mt-6 p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <p className="font-bold text-teal-800 mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Employer Sponsorship
                  </p>
                  <p className="text-sm text-teal-700 mb-3">
                    Already working at a salon? Your employer may cover your tuition!
                  </p>
                  <Link href="/barber-and-beauty-apprenticeships#host-shops" className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                    Learn more <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { q: 'What\'s included in the kit?', a: 'Professional-grade tools specific to your program - clippers, shears, combs, products for barber; styling tools and products for cosmetology; esthetician equipment; nail tech supplies for nail programs.' },
              { q: 'Can I get a refund?', a: 'Yes, within 30 days if you\'re not satisfied. Contact our support team for a full refund.' },
              { q: 'How does employer sponsorship work?', a: 'If you\'re employed at a partner salon, your employer pays for your training. You continue working and earning while you complete your hours.' },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Elevate for Humanity Career & Technical Institute
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-400">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> DOL Registered</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> ETPL Listed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
