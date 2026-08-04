import { Users, BarChart3, FileCheck, AlertTriangle, TrendingUp, Shield } from 'lucide-react'

export default function WorkforcePortal() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <Users className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Workforce Development</h1>
              <p className="text-violet-100 text-lg mt-2">Manage participants, track outcomes, ensure compliance</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">1,200+</div>
              <div className="text-violet-100">Active Participants</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">87%</div>
              <div className="text-violet-100">Completion Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">95%</div>
              <div className="text-violet-100">Compliance Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">$2.4M</div>
              <div className="text-violet-100">WIOA Funding</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <a href="/workforce/dashboard" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-violet-200 transition-all">
            <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-600 transition-colors">
              <BarChart3 className="w-7 h-7 text-violet-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Dashboard</h3>
            <p className="text-gray-600">View program metrics, participant progress, and outcome tracking at a glance.</p>
          </a>
          
          <a href="/workforce/participants" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-violet-200 transition-all">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
              <Users className="w-7 h-7 text-purple-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Participants</h3>
            <p className="text-gray-600">Manage participant records, enrollment status, and service delivery.</p>
          </a>
        </div>
      </div>

      {/* Program Areas */}
      <div className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Program Areas</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <FileCheck className="w-10 h-10 text-emerald-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">WIOA Programs</h3>
              <p className="text-gray-600 text-sm mb-4">Workforce Innovation and Opportunity Act compliance tracking and reporting.</p>
              <a href="/workforce/participants" className="text-emerald-600 font-medium hover:underline">View Participants →</a>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <Shield className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Compliance</h3>
              <p className="text-gray-600 text-sm mb-4">Federal and state workforce compliance monitoring and audit support.</p>
              <a href="/workforce/compliance" className="text-blue-600 font-medium hover:underline">View Compliance →</a>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <TrendingUp className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Outcomes</h3>
              <p className="text-gray-600 text-sm mb-4">Track employment outcomes, credential attainment, and wage progression.</p>
              <a href="/workforce/outcomes" className="text-orange-600 font-medium hover:underline">View Outcomes →</a>
            </div>
          </div>
        </div>
      </div>

      {/* Reports */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Reporting & Analytics</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <a href="/workforce/reports" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <BarChart3 className="w-8 h-8 text-violet-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Performance Reports</h3>
            <p className="text-gray-600 text-sm">Generate reports on participant outcomes, program effectiveness, and ROI.</p>
          </a>
          
          <a href="/workforce/cases" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <AlertTriangle className="w-8 h-8 text-amber-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">At-Risk Cases</h3>
            <p className="text-gray-600 text-sm">Monitor participants who need additional support or intervention.</p>
          </a>
        </div>
      </div>

      {/* Funding Sources */}
      <div className="bg-violet-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Funding & Grants</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Active Grants</h3>
              <ul className="space-y-3">
                <li className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">WIOA Adult</span>
                  <span className="font-medium text-emerald-600">$850,000</span>
                </li>
                <li className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">WIOA Youth</span>
                  <span className="font-medium text-emerald-600">$620,000</span>
                </li>
                <li className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-700">Trade Adjustment Act</span>
                  <span className="font-medium text-emerald-600">$450,000</span>
                </li>
                <li className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Perkins Grant</span>
                  <span className="font-medium text-emerald-600">$380,000</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Service Statistics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Enrolled vs. Goal</span>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-violet-600 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Placement Rate</span>
                    <span className="text-sm font-medium">82%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-emerald-600 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Credential Rate</span>
                    <span className="text-sm font-medium">91%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-600 rounded-full" style={{ width: '91%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
