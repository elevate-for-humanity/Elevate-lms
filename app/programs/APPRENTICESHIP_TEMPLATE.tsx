import type { Metadata } from 'next';
import Link from 'next/link';
import CanonicalVideo from '@/components/video/CanonicalVideo';
import CanonicalHero from '@/components/hero/CanonicalHero';
import HeroMediaFrame from '@/components/hero/HeroMediaFrame';
import {
  GraduationCap,
  Clock,
  DollarSign,
  MapPin,
  CheckCircle,
  Users,
  Award,
  TrendingUp,
  ArrowRight,
  Star,
  Briefcase,
  Zap,
  Target,
  Shield,
  Calendar,
  Building2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Barber Apprenticeship | Earn While You Learn | DOL Registered',
  description:
    'DOL-registered barber apprenticeship. Earn $12-15/hour while training. Get matched to licensed shop, hands-on training, earn Indiana barber license.',
};

export default function ApprenticeshipPage() {
  return (
    <main className="min-h-screen bg-white">
      <CanonicalHero
        media={
          <HeroMediaFrame heightClass="h-[50vh] sm:h-[56vw] min-h-[280px] max-h-[680px]">
            <CanonicalVideo
              src="/videos/barber-hero-final.mp4"
              poster="/images/pages/barber-apprenticeship.jpg"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </HeroMediaFrame>
        }
        title="Barber Apprenticeship"
        body="Get paid to learn. Master your craft. Build your career."
        actions={
          <>
            <Link href="/start" className="inline-flex items-center gap-2 bg-brand-orange-600 text-white px-8 py-3.5 rounded-lg font-bold hover:bg-brand-orange-700 transition-colors">
              Start Your Journey <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#how-it-works" className="border border-slate-300 text-slate-700 px-8 py-3.5 rounded-lg font-bold hover:bg-slate-50 transition-colors">
              How It Works
            </Link>
          </>
        }
      />

      {/* Value Props Strip */}
      <section className="bg-white py-8 border-t">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <DollarSign className="w-12 h-12 text-brand-orange-500 mb-3" />
              <div className="text-2xl font-bold mb-1">$12-15/Hour</div>
              <div className="text-slate-600">Paid Training</div>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-12 h-12 text-brand-orange-500 mb-3" />
              <div className="text-2xl font-bold mb-1">2,000 Hours</div>
              <div className="text-slate-600">Hands-On Experience</div>
            </div>
            <div className="flex flex-col items-center">
              <Award className="w-12 h-12 text-brand-orange-500 mb-3" />
              <div className="text-2xl font-bold mb-1">State Licensed</div>
              <div className="text-slate-600">Indiana Barber License</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-black mb-6">
              How It Works
            </h2>
            <p className="text-xl text-black max-w-3xl mx-auto">
              Your path from beginner to licensed professional barber
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 rounded-3xl p-8 text-white h-full">
                <div className="text-6xl font-black mb-4 opacity-20">01</div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Apply</h3>
                <p className="text-white/90 leading-relaxed">
                  Submit your application. No experience required. We'll match
                  you with a licensed shop.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 rounded-3xl p-8 text-white h-full">
                <div className="text-6xl font-black mb-4 opacity-20">02</div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Get Matched</h3>
                <p className="text-white/90 leading-relaxed">
                  We connect you with a licensed barber shop in your area for
                  hands-on training.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-brand-orange-500 to-brand-orange-600 rounded-3xl p-8 text-white h-full">
                <div className="text-6xl font-black mb-4 opacity-20">03</div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Train & Earn</h3>
                <p className="text-white/90 leading-relaxed">
                  Work alongside master barbers. Earn $12-15/hour while you
                  learn the craft.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-brand-green-500 to-brand-green-600 rounded-3xl p-8 text-white h-full">
                <div className="text-6xl font-black mb-4 opacity-20">04</div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <Award className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Get Licensed</h3>
                <p className="text-white/90 leading-relaxed">
                  Complete 2,000 hours, pass your exam, and earn your Indiana
                  barber license.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Apprenticeship */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-black text-black mb-8">
                Why Choose Apprenticeship?
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-2">
                      Get Paid to Learn
                    </h3>
                    <p className="text-black text-lg leading-relaxed">
                      Unlike traditional barber school, you earn $12-15/hour
                      from day one. No student debt, just income while you
                      train.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-2">
                      Real-World Experience
                    </h3>
                    <p className="text-black text-lg leading-relaxed">
                      Learn from master barbers in actual shops with real
                      clients. Build your skills and clientele from the start.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-2">
                      DOL Registered
                    </h3>
                    <p className="text-black text-lg leading-relaxed">
                      U.S. Department of Labor registered program. Nationally
                      recognized credential that opens doors nationwide.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-2">
                      Job Ready
                    </h3>
                    <p className="text-black text-lg leading-relaxed">
                      Graduate with 2,000 hours of real experience, a client
                      base, and connections in the industry.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-3xl p-12 text-slate-900">
                <h3 className="text-3xl font-bold mb-8">Program Details</h3>

                <div className="space-y-6">
                  <div className="border-b border-white/10 pb-6">
                    <div className="text-slate-400 text-sm mb-2">Duration</div>
                    <div className="text-2xl font-bold">15-24 Months</div>
                  </div>

                  <div className="border-b border-white/10 pb-6">
                    <div className="text-slate-400 text-sm mb-2">
                      Training Hours
                    </div>
                    <div className="text-2xl font-bold">2,000 Hours</div>
                  </div>

                  <div className="border-b border-white/10 pb-6">
                    <div className="text-slate-400 text-sm mb-2">
                      Hourly Pay
                    </div>
                    <div className="text-2xl font-bold">$12-15/Hour</div>
                  </div>

                  <div className="border-b border-white/10 pb-6">
                    <div className="text-slate-400 text-sm mb-2">Format</div>
                    <div className="text-2xl font-bold">In-Person</div>
                  </div>

                  <div className="border-b border-white/10 pb-6">
                    <div className="text-slate-400 text-sm mb-2">
                      Certification
                    </div>
                    <div className="text-2xl font-bold">
                      Indiana Barber License
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-sm mb-2">Cost</div>
                    <div className="text-2xl font-bold text-brand-orange-500">
                      $0 - You Get Paid!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Master */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-black mb-6">
              What You'll Master
            </h2>
            <p className="text-xl text-black max-w-3xl mx-auto">
              Complete training in all aspects of professional barbering
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6">
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">✓</span>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">
                Classic Cuts
              </h3>
              <ul className="space-y-3 text-black">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Clipper techniques
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Scissor over comb
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Fades and tapers
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Traditional styles
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6">
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">✓</span>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">
                Grooming Services
              </h3>
              <ul className="space-y-3 text-black">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Beard shaping
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Straight razor shaves
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Hot towel treatments
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Facial grooming
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6">
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">✓</span>
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">
                Business Skills
              </h3>
              <ul className="space-y-3 text-black">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Client consultation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Shop management
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Marketing yourself
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  Building clientele
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 bg-white border-t">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-slate-300">
              Real apprentices, real success
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-xl text-white mb-8 leading-relaxed">
                "Best decision I ever made. I'm earning money while learning
                from the best. Already building my own client base and I'm only
                6 months in."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full"></div>
                <div>
                  <div className="font-bold text-lg">James W.</div>
                  <div className="text-slate-500">Apprentice, 6 months</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-xl text-white mb-8 leading-relaxed">
                "Graduated last month and already opened my own chair. The
                hands-on experience and connections I made were invaluable. No
                debt, just skills."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-full"></div>
                <div>
                  <div className="font-bold text-lg">DeAndre Williams</div>
                  <div className="text-slate-500">
                    Licensed Barber, Graduate 2024
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-brand-orange-600 to-brand-orange-700 text-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            Start Earning While You Learn
          </h2>
          <p className="text-2xl mb-12 text-white/90">
            No experience required. No tuition for eligible participants.
            Just your commitment to mastering the craft.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center gap-3 bg-white text-brand-orange-600 px-12 py-6 rounded-xl text-xl font-bold hover:bg-white transition shadow-2xl"
            >
              Apply Now
              <ArrowRight className="w-6 h-6" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm text-white px-12 py-6 rounded-xl text-xl font-bold hover:bg-white/20 transition border-2 border-white/30"
            >
              Learn More
            </Link>
          </div>
          <p className="text-white/80 mt-8 text-lg">
            Next cohort starts soon • Limited spots available
          </p>
        </div>
      </section>
    </main>
  );
}
