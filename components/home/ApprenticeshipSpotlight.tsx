'use client';

import dynamic from 'next/dynamic';
import { GraduationCap, Clock, DollarSign, Users, Building2, CheckCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

// Dynamically import the calculator to reduce initial bundle size
const WageProgressionCalculator = dynamic(
  () => import('@/components/calculators/WageProgressionCalculator').then(m => m.WageProgressionCalculator),
  { ssr: false, loading: () => <CalculatorSkeleton /> }
);

function CalculatorSkeleton() {
  return (
    <div className="bg-gradient-to-br from-brand-blue-900 to-brand-blue-800 rounded-2xl p-8 animate-pulse">
      <div className="h-8 w-64 bg-white/10 rounded mb-4" />
      <div className="h-4 w-48 bg-white/10 rounded mb-8" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="h-12 bg-white/10 rounded" />
        <div className="h-12 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export function ApprenticeshipSpotlight() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <GraduationCap className="w-4 h-4" />
            Earn While You Learn
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Become a Licensed Barber in 12-18 Months
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Our Registered Apprenticeship program lets you work in a real salon, earn $14-18/hour, 
            and become a licensed barber—all with no tuition upfront for qualifying students.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Info */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard 
                icon={<DollarSign className="w-5 h-5" />}
                value="$14-18/hr"
                label="Earn while training"
              />
              <StatCard 
                icon={<Clock className="w-5 h-5" />}
                value="12-18 mo"
                label="Program duration"
              />
              <StatCard 
                icon={<GraduationCap className="w-5 h-5" />}
                value="4,000 hrs"
                label="Real salon experience"
              />
              <StatCard 
                icon={<Users className="w-5 h-5" />}
                value="95%"
                label="Hired by graduation"
              />
            </div>

            {/* How It Works */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                How the Apprenticeship Works
              </h3>
              <ol className="space-y-4">
                {[
                  { step: '1', title: 'Apply', desc: 'Submit your free application online' },
                  { step: '2', title: 'Get Matched', desc: 'We match you with a partner salon' },
                  { step: '3', title: 'Work & Learn', desc: 'Earn $14-18/hr while training' },
                  { step: '4', title: 'Get Licensed', desc: 'Pass state board exam' },
                  { step: '5', title: 'Get Hired', desc: '95% hired by your host shop' },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-600 flex items-center justify-center font-bold">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>

            {/* Host Shops */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Partner Salons
              </h3>
              <p className="text-slate-300 mb-4">
                Work at top Indianapolis salons including Great Clips, Sport Clips, and local shops.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Great Clips', 'Sport Clips', 'Supercuts', 'The Barbershop', 'Local Shops'].map((shop) => (
                  <span key={shop} className="px-3 py-1 bg-white/10 rounded-full text-sm">
                    {shop}
                  </span>
                ))}
              </div>
            </Card>

            {/* Funding Banner */}
            <Card className="p-6 bg-green-500/10 border-green-500/30">
              <h3 className="text-xl font-bold mb-2 text-green-400">
                Most Students Pay $0
              </h3>
              <p className="text-slate-300 mb-4">
                WIOA, Vocational Rehabilitation, and employer sponsors may cover your full tuition, 
                tools, and exam fees.
              </p>
              <Link href="/check-eligibility">
                <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/20">
                  Check Your Eligibility
                </Button>
              </Link>
            </Card>
          </div>

          {/* Right Column - Calculator */}
          <div>
            <WageProgressionCalculator 
              programSlug="barbering-apprenticeship"
              className="sticky top-8"
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/apply/student?program=barber-apprenticeship">
            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4">
              Apply for Barbering Apprenticeship
            </Button>
          </Link>
          <Link href="/programs/barbering-apprenticeship">
            <Button variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 font-semibold px-8 py-4">
              View Full Program Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Approved by Indiana State Board of Barber Examiners
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              DOL Registered Apprenticeship Program
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              WIOA Approved Training Provider
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Card className="p-4 bg-white/5 border-white/10 text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-blue-600/30 text-brand-blue-400 mb-2">
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </Card>
  );
}

export default ApprenticeshipSpotlight;
