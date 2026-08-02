import { Code, BookOpen, Users, BarChart3, Zap, Globe, Layers, FileText, Video, CheckCircle } from 'lucide-react'

export default function BuilderPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <Code className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Course Builder</h1>
              <p className="text-indigo-100 text-lg mt-2">Create, manage, and deploy professional learning content</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">150+</div>
              <div className="text-indigo-100">Courses Built</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">2,400+</div>
              <div className="text-indigo-100">Lessons Created</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-indigo-100">Completion Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">4.8/5</div>
              <div className="text-indigo-100">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <a href="/admin/studio" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
              <Code className="w-7 h-7 text-indigo-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Dev Studio</h3>
            <p className="text-gray-600">Open the full course builder with AI-powered tools, workflows, and course management.</p>
          </a>
          
          <a href="/lms/courses" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all">
            <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-600 transition-colors">
              <BookOpen className="w-7 h-7 text-violet-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Course Library</h3>
            <p className="text-gray-600">Browse and manage existing courses, view enrollment stats, and track performance.</p>
          </a>
        </div>
      </div>

      {/* Course Types */}
      <div className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Course Types We Support</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <CheckCircle className="w-10 h-10 text-emerald-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Healthcare</h3>
              <p className="text-gray-600 text-sm">Medical Assistant, Phlebotomy, EKG, Pharmacy Tech, and more.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <CheckCircle className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Trades</h3>
              <p className="text-gray-600 text-sm">HVAC, EPA 608, Building Maintenance, CDL preparation.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <CheckCircle className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Beauty</h3>
              <p className="text-gray-600 text-sm">Barber, Cosmetology, Esthetics, Manicurist apprenticeship.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <CheckCircle className="w-10 h-10 text-amber-600 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Workforce</h3>
              <p className="text-gray-600 text-sm">ACT WorkKeys, Certiport, CareerSafe, CPR certifications.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Builder Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <Layers className="w-8 h-8 text-indigo-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Course Structure</h3>
            <p className="text-gray-600 text-sm">Organize with modules, lessons, quizzes, and assignments.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <Video className="w-8 h-8 text-violet-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Video Hosting</h3>
            <p className="text-gray-600 text-sm">Embed videos, create video chapters, and track watch time.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <FileText className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Quizzes & Exams</h3>
            <p className="text-gray-600 text-sm">Multiple choice, true/false, matching, and essay questions.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <BarChart3 className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">Track completion, engagement, and assessment scores.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <Users className="w-8 h-8 text-amber-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Enrollment</h3>
            <p className="text-gray-600 text-sm">Manage student enrollment, progress, and completion.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <Zap className="w-8 h-8 text-rose-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">AI Tools</h3>
            <p className="text-gray-600 text-sm">AI course generator, content improver, and quiz builder.</p>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="bg-indigo-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">AI-Powered Tools</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Course Generator</h3>
              <p className="text-gray-600 mb-4">Enter a topic and AI generates a complete course structure with modules, lessons, and quizzes.</p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> Auto-generates curriculum outline
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> Creates lesson content
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> Adds quiz questions
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Content Improver</h3>
              <p className="text-gray-600 mb-4">AI enhances existing content for better engagement and learning outcomes.</p>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> Improves readability
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> Adds examples and context
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> Suggests supplementary content
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Getting Started</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-indigo-600">1</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Open Dev Studio</h3>
            <p className="text-gray-600 text-sm">Access the full course builder with all tools and features.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-indigo-600">2</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Create Course</h3>
            <p className="text-gray-600 text-sm">Use AI or build manually with our intuitive course editor.</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-indigo-600">3</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Publish & Track</h3>
            <p className="text-gray-600 text-sm">Publish to students and monitor progress with analytics.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
