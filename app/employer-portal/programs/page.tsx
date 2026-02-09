import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import Link from 'next/link';
import { Award, DollarSign, Users, Clock, ArrowRight, CheckCircle, Briefcase, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employer Programs | Employer Portal',
  description: 'Explore tax credit programs, apprenticeships, and workforce development opportunities.',
  robots: { index: false, follow: false },
};

const programs = [
  {
    id: 'wotc',
    name: 'Work Opportunity Tax Credit',
    description: 'Earn up to $9,600 per eligible hire through federal tax credits for hiring from target groups.',
    image: '/images/heroes-hq/career-services-hero.jpg',
    savings: 'Up to $9,600/hire',
    eligibility: ['Veterans', 'SNAP Recipients', 'Ex-Felons', 'Long-term Unemployed'],
    status: 'Active',
  },
  {
    id: 'apprenticeship',
    name: 'Registered Apprenticeship',
    description: 'Build your talent pipeline with earn-and-learn programs. We handle compliance and curriculum.',
    image: '/images/community/community-hero.jpg',
    savings: 'Reduce training costs 50%',
    eligibility: ['All Industries', 'DOL Registered', 'State Approved'],
    status: 'Active',
  },
  {
    id: 'ojt',
    name: 'On-the-Job Training',
    description: 'Get reimbursed up to 75% of wages during training period for eligible WIOA participants.',
    image: '/images/heroes-hq/employer-hero.jpg',
    savings: '50-75% wage reimbursement',
    eligibility: ['WIOA Eligible', 'New Hires', 'Skill Development'],
    status: 'Active',
  },
  {
    id: 'fidelity-bond',
    name: 'Federal Bonding Program',
    description: 'Free fidelity bonds for at-risk hires, protecting your business from employee dishonesty.',
    image: '/images/heroes-hq/success-hero.jpg',
    savings: 'Free $5,000-$25,000 bonds',
    eligibility: ['Ex-Offenders', 'Recovering Addicts', 'Welfare Recipients'],
    status: 'Active',
  },
];

export default function EmployerProgramsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Programs" }]} />
<div className="relative h-64 bg-purple-800">
        <Image
          src="/images/community/community-hero.jpg"
          alt="Employer programs"
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <h1 className="text-4xl font-bold text-white mb-4">Employer Programs</h1>
            <p className="text-xl text-blue-200">Tax credits, apprenticeships, and workforce incentives</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: DollarSign, label: 'Total Savings Available', value: '$50,000+', color: 'green' },
            { icon: Users, label: 'Eligible Candidates', value: '2,500+', color: 'blue' },
            { icon: Award, label: 'Active Programs', value: '4', color: 'purple' },
            { icon: Clock, label: 'Avg. Processing Time', value: '2-4 weeks', color: 'orange' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <stat.icon className={`w-8 h-8 text-${stat.color}-600 mb-3`} />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          {programs.map((program) => (
            <div key={program.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3 relative h-64 md:h-auto">
                  <Image
                    src={program.image}
                    alt={program.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="md:w-2/3 p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{program.name}</h2>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      {program.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-6">{program.description}</p>
                  
                  <div className="flex items-center gap-8 mb-6">
                    <div>
                      <p className="text-sm text-gray-500">Potential Savings</p>
                      <p className="text-xl font-bold text-green-600">{program.savings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Eligibility</p>
                      <div className="flex flex-wrap gap-2">
                        {program.eligibility.map((item, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Link
                      href={`/employer-portal/programs/${program.id}`}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      Learn More <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-600 rounded-2xl p-8 text-white">
          <div className="md:flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need Help Choosing a Program?</h3>
              <p className="text-blue-200">Our team can analyze your hiring needs and recommend the best incentives.</p>
            </div>
            <Link
              href="/contact"
              className="mt-4 md:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              Schedule Consultation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
