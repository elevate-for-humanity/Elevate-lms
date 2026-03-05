
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, BookOpen, Users, BarChart3, FileText, Settings, ShieldCheck, ClipboardCheck, Eye, Scale, GraduationCap, Store, Wrench, UserCheck, Clock, Handshake, DollarSign, Ban } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Program Holder Portal | Elevate For Humanity',
  description: 'Manage your training programs, track student progress, and access program management tools.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder',
  },
};

const features = [
  {
    icon: BookOpen,
    title: 'Program Management',
    description: 'Create and manage training programs, curricula, and course content.',
  },
  {
    icon: Users,
    title: 'Student Tracking',
    description: 'Monitor student enrollment, progress, and completion rates.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'View detailed reports on program performance and outcomes.',
  },
  {
    icon: FileText,
    title: 'Compliance Reports',
    description: 'Generate WIOA compliance and funding reports automatically.',
  },
  {
    icon: Building2,
    title: 'Partner Network',
    description: 'Connect with employers and workforce agencies.',
  },
  {
    icon: Settings,
    title: 'Program Settings',
    description: 'Configure program requirements, schedules, and pricing.',
  },
];

export default function ProgramHolderLanding() {

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Program Holder' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-48 md:h-64 flex items-center overflow-hidden bg-teal-800">
        <Image
          src="/images/pages/program-holder-page-2.jpg"
          alt="Program Holder Portal"
          fill
          className="object-cover opacity-30"
          priority
        />
      </section>

      {/* Avatar Guide */}

      {/* Features */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Portal Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border">
                <feature.icon className="w-10 h-10 text-teal-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barber on File — Responsibilities */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-7 h-7 text-teal-700 flex-shrink-0" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Barber on File</h2>
          </div>
          <p className="text-sm text-teal-700 font-semibold uppercase tracking-wide mb-6">Licensed Supervising Barber — Apprenticeship Program</p>

          <p className="text-slate-700 mb-6">
            The barber on file for an apprenticeship program is the licensed professional responsible for supervising and verifying the training of apprentices working in the shop. Even if the shop owner handles the business operations, the barber on file oversees the training side of the apprenticeship.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Eye className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Direct Supervision of Apprentices</h3>
                <p className="text-sm text-slate-600">
                  Supervises apprentices while they perform barber services, ensuring all work is done safely and according to barber board sanitation standards. Guides the apprentice&apos;s skill development in haircutting, shaving, sanitation practices, and professional barbering techniques.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <ClipboardCheck className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Hour Verification &amp; Training Logs</h3>
                <p className="text-sm text-slate-600">
                  Reviews and verifies apprentice hours and training logs, confirms that required service hours are completed, and signs off on progress documentation required for the apprenticeship program and state licensing requirements.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Scale className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Shop Compliance &amp; Barber Board Standards</h3>
                <p className="text-sm text-slate-600">
                  Ensures the shop environment where apprentices train follows barber board regulations, including apprentice-to-barber supervision ratios and proper sanitation procedures.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <GraduationCap className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Progress Evaluation &amp; Completion Sign-Off</h3>
                <p className="text-sm text-slate-600">
                  Participates in periodic evaluations of the apprentice&apos;s progress and confirms when an apprentice has successfully completed the required training and is ready to move forward toward licensing.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-5">
            <p className="text-sm text-slate-700">
              <strong>In short:</strong> The barber on file is responsible for supervising the apprenticeship training and verifying that apprentices are learning the trade correctly while working in the shop.
            </p>
          </div>
        </div>
      </section>

      {/* Shop Owner — Responsibilities */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-7 h-7 text-teal-700 flex-shrink-0" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Shop Owner Responsibilities</h2>
          </div>
          <p className="text-sm text-teal-700 font-semibold uppercase tracking-wide mb-6">Licensed Shop — Apprenticeship Training Site</p>

          <p className="text-slate-700 mb-6">
            As the shop owner hosting apprentices, you are responsible for providing and maintaining the licensed shop environment where apprentices complete their on-the-job training. While the barber on file oversees the training and skill supervision, the shop owner is responsible for the operation, facility, and regulatory compliance of the shop itself.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Scale className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Shop License &amp; Regulatory Compliance</h3>
                <p className="text-sm text-slate-600">
                  Maintain a valid shop license and ensure the shop meets all barber board health, sanitation, and safety regulations at all times. This includes maintaining proper disinfecting procedures, clean workstations, approved sanitation equipment, and compliance with state inspection standards.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Wrench className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Equipment &amp; Workstations</h3>
                <p className="text-sm text-slate-600">
                  Provide the required barber equipment and workstations so apprentices can perform services safely. This typically includes barber chairs, mirrors, sanitation supplies, disinfectant containers, clippers, shears, razors, towels, and other tools necessary for barber services.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Eye className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Licensed Supervision Requirement</h3>
                <p className="text-sm text-slate-600">
                  Ensure apprentices are only working when a licensed barber is present in the shop and that supervision ratios required by the state barber board are followed.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <UserCheck className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Apprentice Registration &amp; Permits</h3>
                <p className="text-sm text-slate-600">
                  Ensure apprentices are properly registered or permitted with the state barber board before they begin performing services and that any required permits or licenses are displayed in the shop as required by state regulation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Training Hours &amp; Scheduling</h3>
                <p className="text-sm text-slate-600">
                  Allow apprentices to complete their required on-the-job training hours in the shop and provide reasonable scheduling so apprentices can obtain the practical experience needed for licensing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Handshake className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Cooperation with Sponsor &amp; Barber on File</h3>
                <p className="text-sm text-slate-600">
                  Cooperate with the apprenticeship sponsor and barber on file by allowing oversight of training activities, supporting accurate tracking of apprentice work hours, and maintaining a professional training environment.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-sm text-slate-700">
              <strong>In summary:</strong> The shop owner is responsible for maintaining the licensed facility, ensuring regulatory compliance, providing the equipment and environment necessary for training, and allowing apprentices to complete their required on-the-job training under licensed supervision.
            </p>
          </div>
        </div>
      </section>

      {/* Apprentice Compensation — Sole Commission Prohibition */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-7 h-7 text-teal-700 flex-shrink-0" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Apprentice Compensation</h2>
          </div>
          <p className="text-sm text-teal-700 font-semibold uppercase tracking-wide mb-6">Pay Structure &amp; Wage Requirements</p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <Ban className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-900 mb-1">Sole Commission Is Not Permitted</h3>
                <p className="text-sm text-red-800">
                  An apprentice barber generally cannot be paid strictly on commission only. In most states, including Indiana, they must at least receive minimum wage for all hours worked, even if they also receive commission on services.
                </p>
              </div>
            </div>
          </div>

          {/* Why sole commission is prohibited */}
          <h3 className="text-lg font-bold text-slate-900 mb-4">Why Sole Commission Is Prohibited</h3>
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">FLSA — Apprentices Are Employees</h4>
                <p className="text-sm text-slate-600">Under the Fair Labor Standards Act (FLSA), apprentices are considered employees, not independent contractors. They must receive at least minimum wage for every hour worked and overtime if applicable. A pure commission structure is only legal if the commission always equals or exceeds minimum wage for the hours worked — most barber apprenticeships cannot reliably guarantee that.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">State Barber Board Requirements</h4>
                <p className="text-sm text-slate-600">Many state barber boards require apprentices to be paid wages, not booth rent or independent contractor income. Apprentices typically cannot legally operate as independent contractors because they are still in training and must work under supervision.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">DOL Progressive Wage Requirement</h4>
                <p className="text-sm text-slate-600">From a registered apprenticeship standpoint, the U.S. Department of Labor expects apprentices to receive progressive wages — wages that increase as the apprentice gains skills and hours. Commission-only pay would usually violate that model.</p>
              </div>
            </div>
          </div>

          {/* Required pay structure */}
          <h3 className="text-lg font-bold text-slate-900 mb-4">Required Pay Structure</h3>
          <div className="space-y-4 mb-8">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 mb-1">Base Hourly Wage (Required)</h4>
              <p className="text-sm text-slate-600">Apprentices must receive an hourly wage at or above the applicable minimum wage for all hours worked, including OJT hours. This is the base compensation and is non-negotiable.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 mb-1">Optional Commission on Services</h4>
              <p className="text-sm text-slate-600">Commission or tips <strong>may supplement</strong> the base hourly wage but <strong>cannot replace it</strong>. The apprentice must receive at least minimum wage before any commission or tip income is considered.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 mb-1">Progressive Wage Increases</h4>
              <p className="text-sm text-slate-600">Wages increase as the apprentice advances through the program, gains skills, and completes training milestones. The wage schedule is defined in the apprenticeship agreement.</p>
            </div>
          </div>

          {/* Example wage structure */}
          <h3 className="text-lg font-bold text-slate-900 mb-4">Example Wage Structure</h3>
          <p className="text-sm text-slate-600 mb-4">This is a common structure used by barber shops hosting apprentices. It protects the shop legally and protects the apprentice from being unpaid when business is slow.</p>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-slate-900">Stage</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-900">Compensation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-white">
                  <td className="px-4 py-3 text-slate-700 font-medium">Starting</td>
                  <td className="px-4 py-3 text-slate-600">Hourly base (e.g., $12–$15/hr depending on state)</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-4 py-3 text-slate-700 font-medium">After competency milestones</td>
                  <td className="px-4 py-3 text-slate-600">Hourly base + commission on services</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 text-slate-700 font-medium">Advanced stage</td>
                  <td className="px-4 py-3 text-slate-600">Higher commission percentage with hourly wage floor</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Two types of apprenticeship */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-5">
            <h3 className="font-bold text-amber-900 mb-2">DOL Registered Apprentice vs. State Barber Board Apprentice</h3>
            <p className="text-sm text-amber-800 mb-3">
              Pay requirements can differ depending on how the apprentice is registered. Elevate for Humanity operates as a <strong>DOL Registered Apprenticeship Sponsor</strong>, which means apprentices in our program are subject to both federal DOL wage standards and Indiana barber board requirements.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">DOL Registered Apprentice</h4>
                <p className="text-xs text-slate-600">Registered through the U.S. Department of Labor (RAPIDS). Subject to federal progressive wage requirements, structured OJT hours, and RTI. Wage schedule defined in the apprenticeship agreement filed with DOL.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">State Barber Board Apprentice</h4>
                <p className="text-xs text-slate-600">Registered through the Indiana Professional Licensing Agency (PLA). Subject to state barber board supervision ratios, hour requirements, and sanitation standards. Pay governed by state labor law and FLSA.</p>
              </div>
            </div>
            <p className="text-sm text-amber-800 mt-3">
              Apprentices in the Elevate barber program are registered under <strong>both</strong> systems. The stricter standard applies in all cases.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-teal-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Expand Your Training Programs?</h2>
          <p className="text-teal-100 mb-8">
            Join our network of training providers and access WIOA-funded students.
          </p>
          <Link href="/partners" className="px-8 py-4 bg-white text-teal-800 font-bold rounded-lg hover:bg-teal-50 inline-block">
            Learn About Partnership
          </Link>
        </div>
      </section>
    </div>
  );
}
