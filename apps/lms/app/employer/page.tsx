import { Briefcase, Users, BarChart3, FileText, TrendingUp, Building2 } from 'lucide-react'

export default function EmployerPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <Building2 className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Employer Portal</h1>
              <p className="text-emerald-100 text-lg mt-2">Build your workforce through registered apprenticeships</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-emerald-100">Active Apprentices</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-emerald-100">Completion Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">50+</div>
              <div className="text-emerald-100">Partner Employers</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">12mo</div>
              <div className="text-emerald-100">Avg. Completion</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <a href="/employer/dashboard" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
              <BarChart3 className="w-7 h-7 text-emerald-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Dashboard</h3>
            <p className="text-gray-600">View your program overview, apprentice progress, and key metrics at a glance.</p>
          </a>
          
          <a href="/employer/post-job" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
              <Briefcase className="w-7 h-7 text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Post a Job</h3>
            <p className="text-gray-600">Create apprenticeship positions and reach qualified candidates ready to start.</p>
          </a>
          
          <a href="/employer/apprentices" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-200 transition-all">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
              <Users className="w-7 h-7 text-purple-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Apprentices</h3>
            <p className="text-gray-600">Manage your current apprentices, track hours, and review progress.</p>
          </a>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Manage Your Program</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="/employer/reports" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <FileText className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Reports & Analytics</h3>
            <p className="text-gray-600 text-sm">Generate compliance reports, track outcomes, and export workforce data.</p>
          </a>
          
          <a href="/employer/postings" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <Briefcase className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Active Postings</h3>
            <p className="text-gray-600 text-sm">View and manage your current job postings and applications.</p>
          </a>
          
          <a href="/employer/jobs" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <TrendingUp className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Job Management</h3>
            <p className="text-gray-600 text-sm">Create, edit, and manage apprenticeship job positions.</p>
          </a>
          
          <a href="/employer/applications" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <Users className="w-8 h-8 text-teal-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Applications</h3>
            <p className="text-gray-600 text-sm">Review candidate applications and manage the hiring process.</p>
          </a>
          
          <a href="/employer/hours" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <BarChart3 className="w-8 h-8 text-orange-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Hours Tracking</h3>
            <p className="text-gray-600 text-sm">Monitor apprentice on-the-job training hours and progress.</p>
          </a>
          
          <a href="/employer/company" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <Building2 className="w-8 h-8 text-gray-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Company Profile</h3>
            <p className="text-gray-600 text-sm">Update your company information and employer profile.</p>
          </a>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Partner with Elevate</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Skilled Workforce</h3>
                <p className="text-gray-600">Access pre-screened candidates who have completed foundational training and are ready to contribute.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Tax Credits</h3>
                <p className="text-gray-600">Leverage federal and state apprenticeship tax credits for participating employers.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Dedicated Support</h3>
                <p className="text-gray-600">Get a dedicated workforce coordinator to support your program success.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Compliance Made Easy</h3>
                <p className="text-gray-600">We handle federal and state reporting requirements so you can focus on training.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
