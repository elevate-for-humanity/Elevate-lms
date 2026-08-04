import { Handshake, BarChart3, Users, Building2, FileText, Settings, TrendingUp, Globe } from 'lucide-react'

export default function PartnersPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <Handshake className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Partner Portal</h1>
              <p className="text-amber-100 text-lg mt-2">Manage partnerships, workforce integrations, and collaborative programs</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">85+</div>
              <div className="text-amber-100">Active Partners</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">$4.2M</div>
              <div className="text-amber-100">Partnership Value</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">12</div>
              <div className="text-amber-100">Workforce Partners</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-amber-100">Retention Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <a href="/partners/dashboard" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-600 transition-colors">
              <BarChart3 className="w-7 h-7 text-amber-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Partner Dashboard</h3>
            <p className="text-gray-600">View partnership overview, active agreements, and key metrics.</p>
          </a>
          
          <a href="/partners/workforce" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200 transition-all">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
              <Globe className="w-7 h-7 text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Workforce Partners</h3>
            <p className="text-gray-600">Manage workforce development partnerships and integrations.</p>
          </a>
        </div>
      </div>

      {/* Partner Types */}
      <div className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Partner Categories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Building2 className="w-10 h-10 text-amber-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Employer Partners</h3>
              <p className="text-gray-600 text-sm mb-4">Salons, barbershops, and beauty businesses that host apprentices.</p>
              <span className="text-amber-600 font-medium">45 Active Partners</span>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Globe className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Workforce Agencies</h3>
              <p className="text-gray-600 text-sm mb-4">WIOA, American Job Centers, and workforce development boards.</p>
              <span className="text-blue-600 font-medium">12 Active Partners</span>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <TrendingUp className="w-10 h-10 text-emerald-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Education Partners</h3>
              <p className="text-gray-600 text-sm mb-4">High schools, community colleges, and adult education programs.</p>
              <span className="text-emerald-600 font-medium">18 Active Partners</span>
            </div>
          </div>
        </div>
      </div>

      {/* Management */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Partnership Management</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="/partners/applications" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <Users className="w-8 h-8 text-amber-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Partner Applications</h3>
            <p className="text-gray-600 text-sm">Review and approve new partner applications.</p>
          </a>
          
          <a href="/partners/lms-integrations" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <Globe className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">LMS Integrations</h3>
            <p className="text-gray-600 text-sm">Manage LMS partnerships and technical integrations.</p>
          </a>
          
          <a href="/partners/enrollments" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <FileText className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Partner Enrollments</h3>
            <p className="text-gray-600 text-sm">Track partner-sponsored enrollments and outcomes.</p>
          </a>
          
          <a href="/partners/inquiries" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <Settings className="w-8 h-8 text-gray-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Partner Inquiries</h3>
            <p className="text-gray-600 text-sm">Manage incoming partnership inquiries and requests.</p>
          </a>
          
          <a href="/partners/reports" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <BarChart3 className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Partnership Reports</h3>
            <p className="text-gray-600 text-sm">Generate partnership performance and ROI reports.</p>
          </a>
          
          <a href="/partners/settings" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
            <Settings className="w-8 h-8 text-orange-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Partner Settings</h3>
            <p className="text-gray-600 text-sm">Configure partnership terms and default settings.</p>
          </a>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-amber-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Partner Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Recruitment Pipeline</h3>
                <p className="text-gray-600">Access a steady stream of pre-screened candidates ready for employment.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Performance Analytics</h3>
                <p className="text-gray-600">Detailed dashboards showing apprentice progress and program outcomes.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Handshake className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Dedicated Support</h3>
                <p className="text-gray-600">Assigned partnership coordinator for seamless communication.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Compliance Support</h3>
                <p className="text-gray-600">Automated compliance tracking and reporting for regulatory requirements.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
