'use client';

import Image from 'next/image';
import { Target, Heart, History, Users, Award, Sparkles } from 'lucide-react';

export default function BeautyAboutSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Our DNA Header */}
        <div className="text-center mb-16">
          <span className="text-amber-600 text-sm font-bold uppercase tracking-widest">
            Our DNA
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
            <span className="text-amber-600">Innovation</span> | <span className="text-teal-600">Impact</span> | <span className="text-gray-600">Heritage</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            We believe everyone deserves access to meaningful career training that leads to 
            lifelong careers, strong communities, and economic mobility.
          </p>
        </div>

        {/* Three Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {/* Vision */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-50 rounded-3xl transform rotate-1 group-hover:rotate-2 transition-transform" />
            <div className="relative bg-white rounded-3xl p-8 shadow-lg h-full border border-amber-100">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                A future where every aspiring beauty professional has access to meaningful 
                apprenticeship opportunities that lead to lifelong careers, strong communities, 
                and the ability to give back.
              </p>
              <div className="mt-6 pt-6 border-t border-amber-100">
                <p className="text-amber-600 font-medium italic">
                  "Career pathways, not dead ends."
                </p>
              </div>
            </div>
          </div>

          {/* Mission */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-teal-50 rounded-3xl transform -rotate-1 group-hover:-rotate-2 transition-transform" />
            <div className="relative bg-white rounded-3xl p-8 shadow-lg h-full border border-teal-100">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                We expand access to beauty industry careers through registered apprenticeship. 
                We empower individuals and employers to grow together through innovation, 
                mentorship, and a shared commitment to excellence and community impact.
              </p>
              <div className="mt-6 pt-6 border-t border-teal-100">
                <p className="text-teal-600 font-medium italic">
                  "Training that transforms lives."
                </p>
              </div>
            </div>
          </div>

          {/* Heritage */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl transform rotate-1 group-hover:rotate-2 transition-transform" />
            <div className="relative bg-white rounded-3xl p-8 shadow-lg h-full border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                <History className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Heritage</h3>
              <p className="text-gray-600 leading-relaxed">
                Born from the belief that the best beauty professionals are trained in real 
                salon conditions. We partner with mentoring salons, spas, and barbershops 
                to provide structured oversight and foundational education.
              </p>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-gray-600 font-medium italic">
                  "Built by industry, for industry."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diversity Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">
                  Diversity & Inclusion
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Every Person Belongs Here
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6">
                We are an equal opportunity employer committed to creating spaces where anyone 
                can build a career and feel valued. Our partner salons, barbershops, and spas 
                reflect the rich mix of cultures and experiences found in the communities we serve.
              </p>
              <p className="text-gray-300 leading-relaxed mb-6">
                When we listen to different perspectives and honor every voice, we grow as people 
                and as professionals. We reject discrimination in all forms and celebrate 
                individuality across race, gender, age, identity, religion, and lived experience.
              </p>
              <div className="border-l-4 border-amber-400 pl-4">
                <p className="text-white font-medium italic">
                  "Diversity of experience. Equity of opportunity. Inclusivity in action."
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden">
                <Image sizes="100vw"
                  src="/images/pages/barber-shop-interior.webp"
                  alt="Diverse team of beauty professionals"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-amber-500 text-black p-6 rounded-2xl shadow-xl">
                <Award className="w-10 h-10 mb-2" />
                <p className="text-sm font-bold">Equal Opportunity</p>
                <p className="text-xs">Employer M/F/Disability/Vet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="text-center mb-12">
          <span className="text-amber-600 text-sm font-bold uppercase tracking-widest">
            Why Choose Elevate
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            The Elevate Difference
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Sparkles className="w-6 h-6" />,
              title: 'DOL Registered',
              desc: 'Federally approved apprenticeship program with national credentials.',
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: 'Employer Partners',
              desc: 'Network of licensed host shops ready to train you.',
            },
            {
              icon: <Award className="w-6 h-6" />,
              title: 'ETPL Listed',
              desc: 'Approved workforce training provider for WIOA funding.',
            },
            {
              icon: <Heart className="w-6 h-6" />,
              title: 'Student Support',
              desc: 'Advisors, tutors, and career services throughout your journey.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-2xl p-6 text-center hover:bg-amber-50 transition-colors"
            >
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-amber-600">
                {item.icon}
              </div>
              <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
