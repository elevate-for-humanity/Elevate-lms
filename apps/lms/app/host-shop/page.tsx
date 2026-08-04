import { Scissors, Users, Clock, Award, FileText, Settings, BarChart3, Calendar } from 'lucide-react'

export default function HostShopPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <Scissors className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Host Shop Portal</h1>
              <p className="text-rose-100 text-lg mt-2">Manage apprentices, track hours, oversee competency development</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">120+</div>
              <div className="text-rose-100">Active Apprentices</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">45</div>
              <div className="text-rose-100">Host Shops</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">15,000+</div>
              <div className="text-rose-100">OJT Hours</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">92%</div>
              <div className="text-rose-100">Pass Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <a href="/host-shop/dashboard" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-rose-200 transition-all">
            <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-rose-600 transition-colors">
              <BarChart3 className="w-7 h-7 text-rose-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Dashboard</h3>
            <p className="text-gray-600">View your shop overview, apprentice progress, and key metrics.</p>
          </a>
          
          <a href="/host-shop/login" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-rose-200 transition-all">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
              <Users className="w-7 h-7 text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Login</h3>
            <p className="text-gray-600">Access your host shop account and manage apprentices.</p>
          </a>
          
          <a href="/host-shop/onboarding" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-rose-200 transition-all">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
              <Scissors className="w-7 h-7 text-emerald-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">New Shop Setup</h3>
            <p className="text-gray-600">Register your salon or barbershop as a host shop.</p>
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Manage Your Program</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a href="/host-shop/dashboard/apprentices" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <Users className="w-8 h-8 text-rose-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Apprentices</h3>
              <p className="text-gray-600 text-sm">View and manage your active apprentices and their progress.</p>
            </a>
            
            <a href="/host-shop/dashboard/hours" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <Clock className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Hours Tracking</h3>
              <p className="text-gray-600 text-sm">Log and approve on-the-job training hours weekly.</p>
            </a>
            
            <a href="/host-shop/dashboard/competencies" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <Award className="w-8 h-8 text-amber-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Competencies</h3>
              <p className="text-gray-600 text-sm">Track skill development and verify competency completion.</p>
            </a>
            
            <a href="/host-shop/dashboard/attendance" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <Calendar className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Attendance</h3>
              <p className="text-gray-600 text-sm">Monitor apprentice attendance and punctuality.</p>
            </a>
            
            <a href="/host-shop/dashboard/documents" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <FileText className="w-8 h-8 text-emerald-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Documents</h3>
              <p className="text-gray-600 text-sm">Manage training agreements, forms, and compliance docs.</p>
            </a>
            
            <a href="/host-shop/dashboard/settings" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <Settings className="w-8 h-8 text-gray-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600 text-sm">Update shop profile and notification preferences.</p>
            </a>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Become a Host Shop</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Build Your Team</h3>
              <p className="text-gray-600">Train future professionals who will work at your shop after completing their apprenticeship.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">State Credentials</h3>
              <p className="text-gray-600">Participate in state-recognized apprenticeship programs that produce licensed professionals.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600">Apprentices work around your business hours, providing extra help during peak times.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Tax Incentives</h3>
              <p className="text-gray-600">Access federal and state tax credits for participating in registered apprenticeships.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-rose-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Host Shop Requirements</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Licensed Facility</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Valid cosmetology or barber license
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Business license in good standing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Adequate space for training
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Supervision</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Licensed professional on-site
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Willingness to mentor
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Time for competency reviews
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Commitment</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  12-month minimum commitment
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Weekly hour documentation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">✓</span>
                  Quarterly progress reviews
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
