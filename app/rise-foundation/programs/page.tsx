import Link from 'next/link';
import { GraduationCap, Users, Calendar, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const programs = [
  {
    id: 1,
    name: 'RISE Scholarship',
    description: 'Full tuition coverage for qualifying students pursuing technology careers',
    amount: '$15,000',
    deadline: 'March 31, 2024',
    eligibility: ['GPA 3.0+', 'Financial need', 'US Citizen/Resident'],
    spots: 50,
    filled: 32,
  },
  {
    id: 2,
    name: 'Emergency Education Fund',
    description: 'One-time grants for students facing unexpected financial hardship',
    amount: 'Up to $2,500',
    deadline: 'Rolling',
    eligibility: ['Current enrollment', 'Demonstrated need', 'Good standing'],
    spots: 100,
    filled: 67,
  },
  {
    id: 3,
    name: 'Career Transition Grant',
    description: 'Support for adults changing careers into high-demand fields',
    amount: '$8,000',
    deadline: 'June 15, 2024',
    eligibility: ['Age 25+', 'Career change', 'Completed assessment'],
    spots: 30,
    filled: 12,
  },
  {
    id: 4,
    name: 'Community Leader Fellowship',
    description: 'Leadership development program with mentorship and funding',
    amount: '$20,000',
    deadline: 'April 30, 2024',
    eligibility: ['Community involvement', 'Leadership potential', 'Essay required'],
    spots: 10,
    filled: 4,
  },
];

export default function RiseFoundationProgramsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'RISE Foundation', href: '/rise-foundation' }, { label: 'Programs' }]} />
        </div>
      </div>

      <div className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Foundation Programs</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            The RISE Foundation provides scholarships, grants, and fellowships to support students on their educational journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {programs.map(program => (
            <div key={program.id} className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-brand-orange-600" />
                </div>
                <span className="text-2xl font-bold text-brand-orange-600">{program.amount}</span>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{program.name}</h3>
              <p className="text-gray-600 mb-4">{program.description}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {program.deadline}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {program.spots - program.filled} spots left
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Eligibility:</p>
                <div className="flex flex-wrap gap-2">
                  {program.eligibility.map((req, idx) => (
                    <span key={idx} className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded">
                      <span className="text-slate-400 flex-shrink-0">•</span> {req}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Applications</span>
                  <span>{program.filled}/{program.spots}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full" style={{ width: `${(program.filled / program.spots) * 100}%` }} />
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600">
                Apply Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
