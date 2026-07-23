import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Shield, CheckCircle, Award, Users, Building, FileText, 
  Clock, TrendingUp, Target, HeartHandshake, BadgeCheck,
  BarChart3, ArrowRight, Star
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trust & Transparency',
  keywords: ["trust", "transparency", "compliance", "certifications", "workforce development"],
  description: 'See why workforce agencies trust Elevate. Compliance certifications, transparency reports, and proven outcomes.',
};

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/pages/trust-hero.webp" alt="Trust and Security - Elevate for Humanity workforce platform" fill className="object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <HeartHandshake className="w-4 h-4" />
              Trusted by Workforce Organizations
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Why Organizations Choose Elevate
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              We're not just a software vendor — we're your partner in workforce development. 
              See the certifications, compliance standards, and track record that give our partners peace of mind.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Schedule a Consultation
              </Link>
              <Link href="/security" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                View Security Page
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="py-16 bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">500+</div>
              <p className="text-slate-600">Organizations Served</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">50K+</div>
              <p className="text-slate-600">Students Enrolled</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">95%</div>
              <p className="text-slate-600">Completion Rate</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">4.9</div>
              <p className="text-slate-600 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                Customer Rating
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance & Certifications */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Compliance & Certifications
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We maintain the highest standards to protect your data and support your compliance requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-green-200">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">FERPA Compliant</h3>
              <p className="text-slate-600 mb-4">
                Fully compliant with the Family Educational Rights and Privacy Act. Student data is protected 
                and handled according to federal regulations.
              </p>
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <BadgeCheck className="w-4 h-4" />
                Certified
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-green-200">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">DOL Registered</h3>
              <p className="text-slate-600 mb-4">
                As a DOL-registered apprenticeship sponsor, our platform supports all required 
                documentation for federal apprenticeship programs.
              </p>
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <BadgeCheck className="w-4 h-4" />
                Registered Sponsor
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-green-200">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Building className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">WIOA Approved</h3>
              <p className="text-slate-600 mb-4">
                Approved workforce training provider under the Workforce Innovation and Opportunity Act. 
                Easy integration with Workforce Boards.
              </p>
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <BadgeCheck className="w-4 h-4" />
                Approved Provider
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">SOC 2 Type II</h3>
              <p className="text-slate-600 mb-4">
                Annual third-party audit verifying our security controls, availability, and data protection practices.
              </p>
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                <Clock className="w-4 h-4" />
                In Progress
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">PCI DSS Compliant</h3>
              <p className="text-slate-600 mb-4">
                Payment card industry data security standards. Your payment processing is safe and compliant.
              </p>
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                <BadgeCheck className="w-4 h-4" />
                Level 1 Compliant
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">GDPR Ready</h3>
              <p className="text-slate-600 mb-4">
                Data protection measures in place for organizations working with international data subjects.
              </p>
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                <BadgeCheck className="w-4 h-4" />
                Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Reports */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Transparency Reports
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                We believe in complete transparency with our partners. Regular reports on security, 
                uptime, and data handling help you make informed decisions.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Annual Security Report</h4>
                    <p className="text-slate-600 text-sm">
                      Comprehensive review of security practices, incidents, and improvements.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Uptime Reports</h4>
                    <p className="text-slate-600 text-sm">
                      Real-time status page and monthly uptime statistics.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Incident Disclosure</h4>
                    <p className="text-slate-600 text-sm">
                      If an incident occurs, we notify affected parties within 72 hours.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/status" className="inline-flex items-center text-brand-blue-600 hover:text-brand-blue-700 font-semibold">
                  View System Status <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Uptime</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">Last 90 Days</span>
                  <span className="font-bold text-green-600">99.98%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">Last 12 Months</span>
                  <span className="font-bold text-green-600">99.95%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">All Time</span>
                  <span className="font-bold text-green-600">99.92%</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">No outages in the last 6 months</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Outcomes */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Proven Outcomes
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Our partners see real results. Here's what organizations achieve with Elevate.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center border border-slate-100">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-4xl font-bold text-brand-blue-600 mb-2">40%</h3>
              <p className="text-slate-600">Faster Program Launch</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg text-center border border-slate-100">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-4xl font-bold text-brand-blue-600 mb-2">95%</h3>
              <p className="text-slate-600">Completion Rate</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg text-center border border-slate-100">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-4xl font-bold text-brand-blue-600 mb-2">3x</h3>
              <p className="text-slate-600">More Participants</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg text-center border border-slate-100">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-4xl font-bold text-brand-blue-600 mb-2">60%</h3>
              <p className="text-slate-600">Less Admin Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What Our Partners Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 italic">
                "Elevate transformed how we manage apprenticeships. The compliance documentation alone 
                saves us 20 hours per month. Our DOL audits are now straightforward."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-brand-blue-600">JW</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Jennifer Wilson</p>
                  <p className="text-slate-600 text-sm">Workforce Development Director</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 italic">
                "We manage 50+ apprentices across multiple host sites. Elevate makes it possible 
                to track everyone and stay compliant. Worth every penny."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-brand-blue-600">MR</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Michael Rodriguez</p>
                  <p className="text-slate-600 text-sm">Barbering Program Manager</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 italic">
                "The reporting dashboard is incredible. We can show our board exactly what we're 
                achieving — enrollment, completion, job placement. Game changer for funding."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-brand-blue-600">SK</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Sarah Kim</p>
                  <p className="text-slate-600 text-sm">Career Center Executive Director</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsible AI */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-brand-blue-900 rounded-3xl p-8 md:p-12 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Responsible AI Practices
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Our AI features are designed with transparency and fairness in mind. We believe in 
                human oversight, bias prevention, and clear communication about how AI assists — not replaces — 
                your workforce professionals.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-white/10 px-6 py-3 rounded-xl">
                  <span className="font-medium">Human-in-the-Loop</span>
                </div>
                <div className="bg-white/10 px-6 py-3 rounded-xl">
                  <span className="font-medium">Bias Auditing</span>
                </div>
                <div className="bg-white/10 px-6 py-3 rounded-xl">
                  <span className="font-medium">Transparent Decisions</span>
                </div>
                <div className="bg-white/10 px-6 py-3 rounded-xl">
                  <span className="font-medium">Data Privacy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Join Our Partner Network?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            See for yourself why organizations trust Elevate for their workforce development needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/demos" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Request Demo <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}