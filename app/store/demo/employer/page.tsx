'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Briefcase, 
  Users, 
  FileText, 
  Search,
  MapPin,
  Clock,
  CheckCircle,
  Star,
  MessageCircle,
  Plus
} from 'lucide-react';

// Demo data
const jobPostings = [
  {
    id: 1,
    title: 'Licensed Barber',
    location: 'Indianapolis, IN',
    type: 'Full-time',
    salary: '$45,000 - $65,000',
    applicants: 12,
    posted: '3 days ago',
    status: 'active',
  },
  {
    id: 2,
    title: 'HVAC Technician',
    location: 'Carmel, IN',
    type: 'Full-time',
    salary: '$50,000 - $70,000',
    applicants: 8,
    posted: '1 week ago',
    status: 'active',
  },
];

const candidates = [
  {
    id: 1,
    name: 'Marcus Johnson',
    program: 'Barber Apprenticeship',
    completionDate: 'Jan 2025',
    skills: ['Fades', 'Beard Trimming', 'Customer Service'],
    rating: 4.8,
    image: '/images/testimonials/student-marcus.jpg',
    status: 'Available',
  },
  {
    id: 2,
    name: 'Sarah Williams',
    program: 'HVAC Technician',
    completionDate: 'Dec 2024',
    skills: ['Installation', 'Repair', 'EPA Certified'],
    rating: 4.9,
    image: '/images/testimonials/testimonial-medical-assistant.jpg',
    status: 'Available',
  },
  {
    id: 3,
    name: 'David Chen',
    program: 'CNA Certification',
    completionDate: 'Nov 2024',
    skills: ['Patient Care', 'Vital Signs', 'CPR Certified'],
    rating: 4.7,
    image: '/images/testimonials/student-david.jpg',
    status: 'Interviewing',
  },
];

export default function EmployerDemoPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Employer" }]} />
      </div>
{/* Demo Header */}
      <div className="bg-green-600 text-white py-2 px-4 text-center text-sm">
        <span className="font-bold">DEMO MODE</span> - This is a preview of the employer portal. 
        <Link href="/store/licenses" className="underline ml-2">Get the full platform →</Link>
      </div>

      {/* Employer Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/store/demo" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">Acme Staffing Co.</div>
                  <div className="text-sm text-gray-500">Employer Partner</div>
                </div>
              </div>
            </div>
            
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Post a Job
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
              { id: 'jobs', label: 'My Jobs', icon: FileText },
              { id: 'candidates', label: 'Browse Candidates', icon: Users },
              { id: 'messages', label: 'Messages', icon: MessageCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 font-medium transition ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-green-600">2</div>
                <div className="text-gray-600">Active Jobs</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-blue-600">20</div>
                <div className="text-gray-600">Total Applicants</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-blue-600">5</div>
                <div className="text-gray-600">Interviews Scheduled</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-orange-600">3</div>
                <div className="text-gray-600">Hires This Month</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Active Job Postings</h2>
                <div className="space-y-4">
                  {jobPostings.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-sm text-gray-500">{job.location} • {job.type}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{job.applicants} applicants</div>
                        <div className="text-sm text-gray-500">{job.posted}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Top Candidates</h2>
                <div className="space-y-4">
                  {candidates.slice(0, 3).map((candidate) => (
                    <div key={candidate.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image src={candidate.image} alt={candidate.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{candidate.name}</h3>
                        <p className="text-sm text-gray-500">{candidate.program}</p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-medium">{candidate.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">My Job Postings</h2>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Post New Job
              </button>
            </div>
            <div className="space-y-4">
              {jobPostings.map((job) => (
                <div key={job.id} className="border rounded-lg p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{job.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.type}
                        </span>
                      </div>
                      <p className="text-green-600 font-semibold mt-2">{job.salary}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-500">{job.applicants} applicants • Posted {job.posted}</span>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50">
                        View Applicants
                      </button>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search candidates by skill, program, or name..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  />
                </div>
                <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                  Search
                </button>
              </div>
            </div>

            {/* Candidates Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden">
                        <Image src={candidate.image} alt={candidate.name} fill className="object-cover" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{candidate.name}</h3>
                        <p className="text-sm text-gray-500">{candidate.program}</p>
                        <div className="flex items-center gap-1 text-yellow-500 mt-1">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-medium">{candidate.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-2">Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 rounded text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        candidate.status === 'Available' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {candidate.status}
                      </span>
                      <button className="text-green-600 font-medium hover:underline">
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Messages</h2>
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No messages yet. Start connecting with candidates!</p>
            </div>
          </div>
        )}
      </main>

      {/* CTA Footer */}
      <div className="bg-slate-900 text-white py-8 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Want this employer portal?</h2>
          <p className="text-slate-300 mb-6">The employer portal is included with Enterprise licenses.</p>
          <Link 
            href="/store/licenses" 
            className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-700"
          >
            View Platform Licenses
          </Link>
        </div>
      </div>
    </div>
  );
}
