import { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  CheckCircle,
  Search,
  User,
  Clock,
  Check,
  XCircle,
  Image,
  Video,
  FileText,
  ChevronRight,
  Filter,
  Scissors,
  Sparkles,
  Heart,
  Gem,
  Star,
} from 'lucide-react';

// Barber competencies
const barberCompetencies = [
  { name: 'Haircutting', icon: Scissors, total: 45, completed: 38 },
  { name: 'Fades', icon: Scissors, total: 20, completed: 15 },
  { name: 'Razor Shaving', icon: Star, total: 15, completed: 12 },
  { name: 'Beard Design', icon: Star, total: 15, completed: 10 },
  { name: 'Sanitation', icon: CheckCircle, total: 10, completed: 10 },
];

// Cosmetology competencies
const cosmetologyCompetencies = [
  { name: 'Hair Coloring', icon: Sparkles, total: 30, completed: 22 },
  { name: 'Chemical Services', icon: Sparkles, total: 25, completed: 18 },
  { name: 'Styling', icon: Star, total: 20, completed: 16 },
  { name: 'Shampooing', icon: Heart, total: 10, completed: 10 },
];

// Nail Technology competencies
const nailCompetencies = [
  { name: 'Acrylic Application', icon: Gem, total: 20, completed: 15 },
  { name: 'Gel Polish', icon: Gem, total: 15, completed: 12 },
  { name: 'Manicure', icon: Heart, total: 15, completed: 15 },
  { name: 'Pedicure', icon: Heart, total: 15, completed: 10 },
  { name: 'Nail Art', icon: Star, total: 10, completed: 5 },
];

// Esthetics competencies
const estheticsCompetencies = [
  { name: 'Facials', icon: Heart, total: 20, completed: 18 },
  { name: 'Skin Analysis', icon: Star, total: 15, completed: 12 },
  { name: 'Waxing', icon: Scissors, total: 15, completed: 10 },
  { name: 'Makeup', icon: Sparkles, total: 15, completed: 8 },
];

// Demo pending sign-offs
const pendingSignoffs = [
  { id: 1, studentName: 'Marcus Johnson', competency: 'Fade Haircut', category: 'Barber', submittedAt: '2 days ago', evidence: 'photo' },
  { id: 2, studentName: 'DeShawn Williams', competency: 'Beard Design', category: 'Barber', submittedAt: '3 days ago', evidence: 'video' },
  { id: 3, studentName: 'Jaylen Davis', competency: 'Hair Coloring', category: 'Cosmetology', submittedAt: 'Today', evidence: 'photo' },
];

export default function HostShopCompetenciesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/host-shop/dashboard" className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </Link>
              <div>
                <p className="font-bold text-slate-900">Elevate</p>
                <p className="text-xs text-slate-500">Host Shop</p>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Search competencies..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl border-0 focus:ring-2 focus:ring-brand-blue-500 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Competency Sign-Offs</h1>
          <p className="text-slate-500">Review and verify apprentice practical skills</p>
        </div>

        {/* Pending Sign-offs Alert */}
        {pendingSignoffs.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900">{pendingSignoffs.length} Sign-offs Pending Review</p>
                  <p className="text-sm text-amber-700">Review and verify apprentice competency submissions</p>
                </div>
              </div>
              <Link href="#pending" className="bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-amber-600 transition">
                Review Now
              </Link>
            </div>
          </div>
        )}

        {/* Pending Sign-offs List */}
        <div id="pending" className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Pending Reviews</h2>
          </div>
          
          <div className="divide-y divide-slate-100">
            {pendingSignoffs.map((signoff) => (
              <div key={signoff.id} className="p-5 hover:bg-slate-50 transition">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-7 h-7 text-brand-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{signoff.studentName}</h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{signoff.category}</span>
                    </div>
                    <p className="text-slate-600 mb-2">{signoff.competency}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {signoff.submittedAt}
                      </span>
                      <span className="flex items-center gap-1">
                        {signoff.evidence === 'photo' ? (
                          <><Image className="w-4 h-4" /> Photo</>
                        ) : (
                          <><Video className="w-4 h-4" /> Video</>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Notes included
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200 transition">
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 transition">
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competency Categories */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Barber */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-blue-100/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-blue-600" />
                Barber Skills
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {barberCompetencies.map((comp, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <comp.icon className="w-5 h-5 text-slate-400" />
                      <span className="font-medium text-slate-900">{comp.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-blue-600">
                      {comp.completed}/{comp.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      style={{ width: `${(comp.completed / comp.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cosmetology */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-purple-100/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Cosmetology Skills
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {cosmetologyCompetencies.map((comp, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <comp.icon className="w-5 h-5 text-slate-400" />
                      <span className="font-medium text-slate-900">{comp.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-blue-600">
                      {comp.completed}/{comp.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                      style={{ width: `${(comp.completed / comp.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nail Technology */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-pink-50 to-pink-100/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Gem className="w-5 h-5 text-pink-600" />
                Nail Technology
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {nailCompetencies.map((comp, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <comp.icon className="w-5 h-5 text-slate-400" />
                      <span className="font-medium text-slate-900">{comp.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-blue-600">
                      {comp.completed}/{comp.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full"
                      style={{ width: `${(comp.completed / comp.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Esthetics */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-rose-100/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                Esthetics Skills
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {estheticsCompetencies.map((comp, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <comp.icon className="w-5 h-5 text-slate-400" />
                      <span className="font-medium text-slate-900">{comp.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-blue-600">
                      {comp.completed}/{comp.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"
                      style={{ width: `${(comp.completed / comp.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
