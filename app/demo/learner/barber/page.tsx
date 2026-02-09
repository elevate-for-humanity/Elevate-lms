import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Award,
  Calendar,
  ArrowRight,
  Circle,
  Info,
  Users,
  DollarSign,
  Play,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  BarChart3,
  Video,
  ClipboardCheck,
  Trophy,
  Star,
  Target,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Download,
  Upload,
  CreditCard,
  Shield,
  Heart,
  Zap
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Barber Apprenticeship Demo | Elevate LMS',
  description: 'Full-featured demo of the Barber Apprenticeship program showing all student portal capabilities.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/demo/learner/barber',
  },
};

export default function BarberApprenticeshipDemoPage() {
  const student = {
    name: 'Marcus Johnson',
    email: 'marcus.j@email.com',
    avatar: '/images/avatars/student-1.jpg',
    enrollmentDate: 'September 15, 2025',
    expectedCompletion: 'December 15, 2026',
    hoursCompleted: 847,
    hoursRequired: 1500,
    gpa: 3.8,
    attendance: 96,
  };

  const program = {
    name: 'Barber Apprenticeship Program',
    duration: '15-17 months',
    format: 'Hybrid (Online + Shop Training)',
    certification: 'Indiana State Barber License',
    fundingSource: 'WIOA Adult Program',
    shopPlacement: "Marcus's Barbershop - Downtown",
    mentor: 'James Williams, Master Barber',
  };

  const modules = [
    { id: 1, name: 'Barbering Fundamentals', status: 'completed', grade: 'A', hours: 120 },
    { id: 2, name: 'Sanitation & Safety', status: 'completed', grade: 'A', hours: 40 },
    { id: 3, name: 'Hair Cutting Techniques', status: 'completed', grade: 'A-', hours: 200 },
    { id: 4, name: 'Facial Hair Grooming', status: 'completed', grade: 'B+', hours: 80 },
    { id: 5, name: 'Chemical Services', status: 'in-progress', grade: '-', hours: 100 },
    { id: 6, name: 'Business & Client Relations', status: 'locked', grade: '-', hours: 60 },
    { id: 7, name: 'Advanced Styling', status: 'locked', grade: '-', hours: 150 },
    { id: 8, name: 'State Board Preparation', status: 'locked', grade: '-', hours: 80 },
  ];

  const upcomingClasses = [
    { day: 'Today', time: '6:00 PM', title: 'Chemical Services Lab', location: 'Training Center Room 204' },
    { day: 'Tomorrow', time: '9:00 AM', title: 'Shop Practicum', location: "Marcus's Barbershop" },
    { day: 'Wed', time: '6:00 PM', title: 'Color Theory Online', location: 'Virtual Classroom' },
  ];

  const recentGrades = [
    { assignment: 'Fade Technique Practical', grade: '95/100', date: 'Jan 12' },
    { assignment: 'Sanitation Quiz #4', grade: '88/100', date: 'Jan 10' },
    { assignment: 'Client Consultation Role Play', grade: '92/100', date: 'Jan 8' },
  ];

  const achievements = [
    { name: 'Perfect Attendance - Month 1', icon: Star, earned: true },
    { name: '100 Hours Milestone', icon: Clock, earned: true },
    { name: '500 Hours Milestone', icon: Trophy, earned: true },
    { name: 'First Client Service', icon: Users, earned: true },
    { name: 'Master Fader', icon: Award, earned: false },
    { name: 'State Board Ready', icon: Shield, earned: false },
  ];

  const fundingDetails = {
    source: 'WIOA Adult Program',
    status: 'Active',
    tuitionCovered: '$8,500',
    suppliesCovered: '$650',
    transportationStipend: '$200/month',
    caseManager: 'Sarah Thompson',
    caseManagerPhone: '(317) 314-3757',
  };

  const careerServices = [
    { name: 'Resume Builder', icon: FileText, status: 'Available' },
    { name: 'Interview Prep', icon: Users, status: 'Scheduled Jan 20' },
    { name: 'Job Board Access', icon: Briefcase, status: '12 new listings' },
    { name: 'Networking Events', icon: Heart, status: 'Next: Jan 25' },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Demo", href: "/demo" }, { label: "Barber" }]} />
      </div>
{/* Demo Mode Banner */}
      <div className="bg-blue-600 text-white py-3 px-4 text-center">
        <Info className="w-4 h-4 inline mr-2" />
        <span className="font-semibold">Full Feature Demo</span> — Barber Apprenticeship Student Portal Experience
        <Link href="/store" className="ml-4 underline hover:no-underline">
          View Licensing Options →
        </Link>
      </div>

      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/demo" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  E
                </div>
                <span className="font-bold text-slate-900">Elevate LMS</span>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <span className="text-sm font-medium text-orange-600 border-b-2 border-orange-600 pb-1 cursor-default">Dashboard</span>
                <span className="text-sm font-medium text-slate-600 cursor-default" title="Demo navigation">Courses</span>
                <span className="text-sm font-medium text-slate-600 cursor-default" title="Demo navigation">Schedule</span>
                <span className="text-sm font-medium text-slate-600 cursor-default" title="Demo navigation">Grades</span>
                <span className="text-sm font-medium text-slate-600 cursor-default" title="Demo navigation">Messages</span>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-slate-600 hover:text-orange-600">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  MJ
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-900">{student.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back, {student.name}! 👋
            </h1>
            <p className="text-slate-600">
              You're <span className="font-semibold text-orange-600">56%</span> through your apprenticeship. Keep up the great work!
            </p>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{student.hoursCompleted}</p>
                  <p className="text-xs text-slate-500">of {student.hoursRequired} hours</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{student.gpa}</p>
                  <p className="text-xs text-slate-500">Current GPA</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Circle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{student.attendance}%</p>
                  <p className="text-xs text-slate-500">Attendance</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">4</p>
                  <p className="text-xs text-slate-500">Achievements</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Program Progress Card */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold mb-1">{program.name}</h2>
                      <p className="text-slate-300 text-sm">{program.format} • {program.duration}</p>
                    </div>
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      ON TRACK
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span className="font-semibold">56%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-3">
                      <div className="bg-orange-500 h-3 rounded-full" style={{ width: '56%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Course Modules</h3>
                  <div className="space-y-3">
                    {modules.map((module) => (
                      <div key={module.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {module.status === 'completed' ? (
                            <Circle className="w-5 h-5 text-green-500" />
                          ) : module.status === 'in-progress' ? (
                            <div className="w-5 h-5 border-2 border-orange-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-slate-300 rounded-full"></div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{module.name}</p>
                            <p className="text-xs text-slate-500">{module.hours} hours</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {module.status === 'completed' && (
                            <span className="text-sm font-semibold text-green-600">{module.grade}</span>
                          )}
                          {module.status === 'in-progress' && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">In Progress</span>
                          )}
                          {module.status === 'locked' && (
                            <span className="text-xs text-slate-400">Locked</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Video Lessons Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Continue Learning</h3>
                  <span className="text-sm text-orange-600 cursor-default" title="Demo link">View All →</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="group cursor-pointer">
                    <div className="relative aspect-video bg-slate-200 rounded-lg overflow-hidden mb-2">
                      <Image src="/hero-images/barber-beauty-category.jpg" alt="Lesson" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">12:34</span>
                    </div>
                    <p className="font-medium text-slate-900 text-sm">Color Mixing Fundamentals</p>
                    <p className="text-xs text-slate-500">Module 5 • Lesson 3</p>
                  </div>
                  <div className="group cursor-pointer">
                    <div className="relative aspect-video bg-slate-200 rounded-lg overflow-hidden mb-2">
                      <Image src="/images/beauty/hero-program-barber.jpg" alt="Lesson" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">18:22</span>
                    </div>
                    <p className="font-medium text-slate-900 text-sm">Chemical Safety Protocols</p>
                    <p className="text-xs text-slate-500">Module 5 • Lesson 4</p>
                  </div>
                </div>
              </div>

              {/* Recent Grades */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Recent Grades</h3>
                  <span className="text-sm text-orange-600 cursor-default" title="Demo link">View All →</span>
                </div>
                <div className="space-y-3">
                  {recentGrades.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{item.assignment}</p>
                        <p className="text-xs text-slate-500">{item.date}</p>
                      </div>
                      <span className="font-bold text-green-600">{item.grade}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Career Services */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Career Services</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {careerServices.map((service, idx) => {
                    const Icon = service.icon;
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <Icon className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{service.name}</p>
                          <p className="text-xs text-slate-500">{service.status}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Shop Placement Card */}
              <div className="bg-orange-500 rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-3">Shop Placement</h3>
                <p className="font-bold text-lg mb-1">{program.shopPlacement}</p>
                <p className="text-orange-100 text-sm mb-4">Mentor: {program.mentor}</p>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>123 Main Street, Indianapolis</span>
                </div>
              </div>

              {/* Upcoming Schedule */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Upcoming Schedule</h3>
                <div className="space-y-4">
                  {upcomingClasses.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-orange-600">{item.day}</p>
                        <p className="text-sm font-bold text-slate-900">{item.time}</p>
                      </div>
                      <div className="flex-1 border-l-2 border-orange-200 pl-3">
                        <p className="font-medium text-slate-900 text-sm">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                  View Full Calendar
                </button>
              </div>

              {/* Funding Status */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-slate-900">Funding Status</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Source</span>
                    <span className="text-sm font-medium text-slate-900">{fundingDetails.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <span className="text-sm font-medium text-green-600">{fundingDetails.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Tuition</span>
                    <span className="text-sm font-medium text-slate-900">{fundingDetails.tuitionCovered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Supplies</span>
                    <span className="text-sm font-medium text-slate-900">{fundingDetails.suppliesCovered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Transport</span>
                    <span className="text-sm font-medium text-slate-900">{fundingDetails.transportationStipend}</span>
                  </div>
                  <hr className="my-2" />
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Case Manager</p>
                    <p className="text-sm font-medium text-slate-900">{fundingDetails.caseManager}</p>
                    <p className="text-xs text-slate-500">{fundingDetails.caseManagerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Achievements</h3>
                <div className="grid grid-cols-3 gap-3">
                  {achievements.map((achievement, idx) => {
                    const Icon = achievement.icon;
                    return (
                      <div 
                        key={idx} 
                        className={`text-center p-3 rounded-lg ${achievement.earned ? 'bg-orange-50' : 'bg-slate-50 opacity-50'}`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-1 ${achievement.earned ? 'text-orange-500' : 'text-slate-400'}`} />
                        <p className="text-xs text-slate-600 leading-tight">{achievement.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition text-left">
                    <Download className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">Download Transcript</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition text-left">
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">Submit Assignment</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition text-left">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">Message Instructor</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition text-left">
                    <Phone className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">Contact Support</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Showcase Banner */}
          <div className="mt-8 bg-slate-800 rounded-xl p-8 text-white">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold mb-4">Full LMS Feature Set Included</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Circle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Video Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Progress Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Certificates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Funding Integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Shop Placements</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Career Services</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Messaging</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Mobile Ready</span>
                </div>
              </div>
              <Link
                href="/store"
                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                View Store & Licensing
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
