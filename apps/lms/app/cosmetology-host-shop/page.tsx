import { Sparkles, Scissors, Users, Award, Clock, FileText, BarChart3, CheckCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function CosmetologyHostShop() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sparkles className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Cosmetology Host Shop</h1>
              <p className="text-pink-100 text-lg mt-2">Apprenticeship program for beauty industry professionals</p>
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">85+</div>
              <div className="text-pink-100">Active Apprentices</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">32</div>
              <div className="text-pink-100">Host Shops</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">12mo</div>
              <div className="text-pink-100">Avg Program</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-3xl font-bold">95%</div>
              <div className="text-pink-100">License Pass</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/cosmetology-host-shop/dashboard" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-pink-200 transition-all block">
            <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-pink-600 transition-colors">
              <BarChart3 className="w-7 h-7 text-pink-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Dashboard</h3>
            <p className="text-gray-600">View program overview, apprentice progress, and key metrics.</p>
          </Link>
          <Link href="/host-shop/dashboard" className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-pink-200 transition-all block">
            <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-rose-600 transition-colors">
              <Scissors className="w-7 h-7 text-rose-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Host Shop Portal</h3>
            <p className="text-gray-600">Access the full host shop management portal.</p>
          </Link>
        </div>
      </div>

      <div className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Program Overview</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">What is Cosmetology Apprenticeship?</h3>
              <p className="text-gray-600 mb-4">
                Our cosmetology apprenticeship program combines on-the-job training with related technical instruction. 
                Apprentices work in licensed salons and barbershops while completing their required training hours.
              </p>
              <p className="text-gray-600">
                Upon completion, apprentices are eligible to take the state licensing examination and become licensed cosmetologists.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Program Requirements</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Minimum 18 years old</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">High school diploma or GED</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Valid ID and work authorization</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Pass background check</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Training Requirements</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <Clock className="w-10 h-10 text-pink-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">1,500 Hours</h3>
            <p className="text-gray-600 text-sm">Total on-the-job training required by most states</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <FileText className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">320 Hours</h3>
            <p className="text-gray-600 text-sm">Related technical instruction (RTI) classroom training</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <Award className="w-10 h-10 text-amber-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">State License</h3>
            <p className="text-gray-600 text-sm">Eligibility to sit for state cosmetology licensing exam</p>
          </div>
        </div>
      </div>

      <div className="bg-pink-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Skills You&apos;ll Learn</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <Scissors className="w-8 h-8 text-pink-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Hair Cutting</h3>
              <p className="text-gray-600 text-sm">All hair types and textures</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <Sparkles className="w-8 h-8 text-pink-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Coloring</h3>
              <p className="text-gray-600 text-sm">Color theory and application</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <Award className="w-8 h-8 text-pink-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Styling</h3>
              <p className="text-gray-600 text-sm">All styling techniques</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <Users className="w-8 h-8 text-pink-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Client Services</h3>
              <p className="text-gray-600 text-sm">Customer service excellence</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Apprentice Benefits</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Earn While You Learn</h3>
              <p className="text-gray-600">Get paid for on-the-job training while completing your education.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">No Student Debt</h3>
              <p className="text-gray-600">Avoid thousands in tuition costs with paid apprenticeship training.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Hands-On Experience</h3>
              <p className="text-gray-600">Learn from experienced professionals in real salon environments.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Career Growth</h3>
              <p className="text-gray-600">Build a foundation for salon ownership, teaching, or competition.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
