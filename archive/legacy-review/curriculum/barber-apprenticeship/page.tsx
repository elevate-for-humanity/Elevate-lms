/**
 * Barber Apprenticeship System - Sales Page
 * 
 * © 2026 Elevate for Humanity
 * All Rights Reserved
 * 
 * Landing page for the Barber Apprenticeship System.
 */
export default function BarberApprenticeshipPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <span className="text-sm text-slate-400">Elevate Course Factory</span>
            <h1 className="text-2xl font-bold mt-1">Barber Apprenticeship System</h1>
          </div>
          <a 
            href="#demo"
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Request Demo
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block bg-orange-500/20 text-orange-400 px-4 py-1 rounded-full text-sm font-medium mb-4">
            Complete Apprenticeship Solution
          </span>
          <h2 className="text-5xl font-bold mb-6">
            The Only Training System<br />Salon Owners Need
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Everything you need to launch and manage a DOL-registered barber 
            apprenticeship program. RTI curriculum, OJL tracking, employer portal, 
            and RAPIDS reporting — all in one platform.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="#demo"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition"
            >
              Request Demo
            </a>
            <a 
              href="#pricing"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-semibold text-lg transition"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Problem */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-red-800 mb-4">The Challenge</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✕</span>
                  Finding qualified barbers is hard
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✕</span>
                  Training is time-consuming and inconsistent
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✕</span>
                  State compliance documentation is complex
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✕</span>
                  Tracking apprentice hours is manual
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-green-800 mb-4">The Solution</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  Complete RTI curriculum (500 hours ready)
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  Interactive lessons with quizzes and scenarios
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  DOL-compliant documentation built in
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  Automatic RTI/OJL hour tracking
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">What's Included</h2>
          <p className="text-slate-600 text-center mb-12">
            Everything you need for a successful apprenticeship program.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border rounded-2xl p-6">
              <div className="text-3xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-2">RTI Curriculum</h3>
              <p className="text-slate-600 text-sm">
                500 hours of Related Technical Instruction. 8 modules, 50 lessons with 
                interactive content, quizzes, and scenarios.
              </p>
            </div>

            <div className="border rounded-2xl p-6">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">OJL Tracking</h3>
              <p className="text-slate-600 text-sm">
                Built-in On-the-Job Learning tracking. 1,500 OJL hours with employer 
                verification and competency sign-offs.
              </p>
            </div>

            <div className="border rounded-2xl p-6">
              <div className="text-3xl mb-4">🏢</div>
              <h3 className="text-xl font-bold mb-2">Employer Portal</h3>
              <p className="text-slate-600 text-sm">
                Give employers visibility. Evaluation forms, skill sign-off workflow, 
                progress visibility, and RAPIDS reporting.
              </p>
            </div>

            <div className="border rounded-2xl p-6">
              <div className="text-3xl mb-4">✓</div>
              <h3 className="text-xl font-bold mb-2">Practice Exams</h3>
              <p className="text-slate-600 text-sm">
                Domain-based practice tests with weak area detection. 
                Exam readiness scoring included.
              </p>
            </div>

            <div className="border rounded-2xl p-6">
              <div className="text-3xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-bold mb-2">Instructor Resources</h3>
              <p className="text-slate-600 text-sm">
                Complete package with lesson plans, answer keys, 
                lab guides, and rubrics.
              </p>
            </div>

            <div className="border rounded-2xl p-6">
              <div className="text-3xl mb-4">🎧</div>
              <h3 className="text-xl font-bold mb-2">Ongoing Support</h3>
              <p className="text-slate-600 text-sm">
                Email, phone support, and quarterly check-ins. 
                Curriculum updates included.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Who It's For</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="font-bold mb-2">Salon Owners</h3>
              <p className="text-slate-300 text-sm">
                Train apprentices without hiring curriculum developers.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="font-bold mb-2">Workforce Boards</h3>
              <p className="text-slate-300 text-sm">
                Fund compliant programs with RTI/OJL tracking built in.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="font-bold mb-2">Community Colleges</h3>
              <p className="text-slate-300 text-sm">
                Add apprenticeship pathways with state-approved curriculum.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="font-bold mb-2">Barber Associations</h3>
              <p className="text-slate-300 text-sm">
                Offer members a complete training system.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="font-bold mb-2">Reentry Programs</h3>
              <p className="text-slate-300 text-sm">
                Structured training with clear milestones.
              </p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="font-bold mb-2">Union Training</h3>
              <p className="text-slate-300 text-sm">
                Standardized curriculum across your organization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-3xl p-8 md:p-12">
            <div className="text-center mb-8">
              <span className="text-orange-400 font-medium">Apprenticeship License</span>
              <div className="flex items-baseline justify-center gap-1 mt-2">
                <span className="text-5xl font-bold">$399</span>
                <span className="text-slate-400">/month</span>
              </div>
              <p className="text-slate-400 mt-2">+ $5,000 setup fee</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-bold mb-3">Included</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited apprentices</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 500 hours RTI curriculum</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 1,500 hours OJL tracking</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Employer portal</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> RAPIDS-ready reporting</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Practice exams</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Instructor resources</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Support included</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3">Add-Ons</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>Additional instructors: $49/mo</li>
                  <li>White labeling: +$1,000/mo</li>
                  <li>Customization: $150/hr</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <a 
                href="#demo"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition"
              >
                Get Started
              </a>
              <p className="text-slate-400 text-sm mt-4">
                12-month minimum term. Cancel anytime after.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Form */}
      <section id="demo" className="py-16 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Request a Demo</h2>
          <p className="text-slate-600 text-center mb-8">
            See the Barber Apprenticeship System in action.
          </p>

          <form className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" required className="w-full border rounded-lg px-4 py-2" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" required className="w-full border rounded-lg px-4 py-2" placeholder="you@org.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organization *</label>
              <input type="text" required className="w-full border rounded-lg px-4 py-2" placeholder="Organization name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organization Type *</label>
              <select required className="w-full border rounded-lg px-4 py-2">
                <option value="">Select...</option>
                <option value="salon">Salon / Barbershop</option>
                <option value="workforce">Workforce Development Board</option>
                <option value="college">Community College</option>
                <option value="association">Barber Association</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">When do you want to start?</label>
              <select className="w-full border rounded-lg px-4 py-2">
                <option value="">Select...</option>
                <option value="immediately">Immediately</option>
                <option value="1-3months">1-3 months</option>
                <option value="exploring">Just exploring</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition">
              Request Demo
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-lg font-bold mb-2">Elevate Course Factory</p>
          <p className="text-slate-400 text-sm">
            © 2026 Elevate for Humanity. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
