import { Metadata } from 'next';
import Link from 'next/link';
import { Target, Heart, Users, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Mission | Elevate for Humanity',
  description: 'Learn about Elevate for Humanity\'s mission to connect training, credentials, and employment.',
};

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Mission</h1>
          <p className="text-xl text-blue-100">Building pathways from unemployment to meaningful employment.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 mb-8">
              Elevate for Humanity was founded on a simple belief: everyone deserves the opportunity 
              to build a sustainable career, regardless of their background or circumstances.
            </p>

            <div className="grid md:grid-cols-2 gap-8 my-12">
              <div className="bg-brand-blue-50 rounded-xl p-6">
                <Target className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h2>
                <p className="text-gray-600">
                  A workforce where every individual has access to quality training, 
                  industry-recognized credentials, and meaningful employment opportunities.
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-6">
                <Heart className="w-10 h-10 text-green-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Values</h2>
                <p className="text-gray-600">
                  Integrity, accessibility, excellence, and community impact guide everything we do.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Who We Serve</h2>
            <p className="text-gray-600 mb-6">
              We serve individuals facing barriers to employment, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-8">
              <li>Unemployed and underemployed individuals</li>
              <li>Veterans transitioning to civilian careers</li>
              <li>Justice-involved individuals seeking reentry</li>
              <li>Career changers looking for new opportunities</li>
              <li>Single parents and caregivers</li>
              <li>Individuals with disabilities</li>
            </ul>

            <div className="bg-slate-50 rounded-xl p-6 my-8">
              <Users className="w-10 h-10 text-brand-blue-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Impact</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-blue-700">1,247+</p>
                  <p className="text-sm text-gray-600">Students Served</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-blue-700">92%</p>
                  <p className="text-sm text-gray-600">Graduation Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-blue-700">75+</p>
                  <p className="text-sm text-gray-600">Hiring Partners</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-blue-700">10+</p>
                  <p className="text-sm text-gray-600">Years of Service</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
