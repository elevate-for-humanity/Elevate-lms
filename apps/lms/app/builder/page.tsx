import { Code, BookOpen, Users, BarChart3, Zap, Layers, FileText, Video, CheckCircle } from 'lucide-react'

const ADMIN_COURSE_BUILDER = 'https://admin.elevateforhumanity.org/course-builder'

export default function BuilderPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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
            <div className="bg-white/10 backdrop-blur rounded-xl p-6"><div className="text-3xl font-bold">150+</div><div className="text-indigo-100">Courses Built</div></div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6"><div className="text-3xl font-bold">2,400+</div><div className="text-indigo-100">Lessons Created</div></div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6"><div className="text-3xl font-bold">98%</div><div className="text-indigo-100">Completion Rate</div></div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6"><div className="text-3xl font-bold">4.8/5</div><div className="text-indigo-100">Avg Rating</div></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <a href={ADMIN_COURSE_BUILDER} className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
              <Code className="w-7 h-7 text-indigo-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Course Builder</h3>
            <p className="text-gray-600">Open the canonical Admin course builder with AI-powered tools, workflows, media, assessments, and course management.</p>
          </a>
          <a href="/lms/courses" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all">
            <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-600 transition-colors">
              <BookOpen className="w-7 h-7 text-violet-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Course Library</h3>
            <p className="text-gray-600">Browse existing courses, view enrollment stats, and track performance.</p>
          </a>
        </div>
      </div>

      <div className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Course Types We Support</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              ['Healthcare', 'Medical Assistant, Phlebotomy, EKG, Pharmacy Tech, and more.'],
              ['Trades', 'HVAC, EPA 608, Building Maintenance, CDL preparation.'],
              ['Beauty', 'Barber, Cosmetology, Esthetics, Manicurist apprenticeship.'],
              ['Workforce', 'ACT WorkKeys, Certiport, CareerSafe, CPR certifications.'],
            ].map(([title, text]) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Builder Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            [Layers, 'Course Structure', 'Organize with modules, lessons, quizzes, and assignments.'],
            [Video, 'Video Hosting', 'Embed videos, create video chapters, and track watch time.'],
            [FileText, 'Quizzes & Exams', 'Multiple choice, true/false, matching, and essay questions.'],
            [BarChart3, 'Analytics', 'Track completion, engagement, and assessment scores.'],
            [Users, 'Enrollment', 'Manage student enrollment, progress, and completion.'],
            [Zap, 'AI Tools', 'AI course generator, content improver, and quiz builder.'],
          ].map(([Icon, title, text]) => {
            const FeatureIcon = Icon as typeof Layers;
            return (
              <div key={String(title)} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <FeatureIcon className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">{String(title)}</h3>
                <p className="text-gray-600 text-sm">{String(text)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <a href={ADMIN_COURSE_BUILDER} className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700">
          Open Course Builder
        </a>
      </div>
    </div>
  )
}
