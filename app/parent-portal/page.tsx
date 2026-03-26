import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  BookOpen,
  BarChart3,
  MessageSquare,
  Calendar,
  Bell,
  ArrowRight,
  Eye,
  Shield,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Parent Portal | Elevate For Humanity',
  description:
    'Monitor your student progress, attendance, grades, and communicate with instructors.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/parent-portal',
  },
};

export default async function ParentPortalPage() {
  const supabase = await createClient();

  
  // Fetch parent portal info
  const { data: portalInfo } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', 'parent_portal')
    .single();

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Parent Portal' },
        ]}
      />
      <section className="bg-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-8">
              <Image
                src="/logo.png"
                alt="Elevate for Humanity"
                width={200}
                height={80}
                className="brightness-0 invert"
              />
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-6">
              <Users className="w-5 h-5" />
              <span className="text-sm font-bold">For Parents & Guardians</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Parent Portal
              <br />
              <span className="text-pink-300">Stay Connected</span>
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 mb-4 leading-relaxed font-medium">
              Monitor your student&apos;s progress, attendance, and grades.
              Communicate with instructors and stay informed.
            </p>
            <p className="text-sm text-white/70 mb-8">
              Available for parents and guardians of minor students enrolled in apprenticeship programs. 
              Contact your student&apos;s program coordinator for access credentials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white text-pink-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white transition shadow-2xl"
              >
                Access Portal
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            Portal Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Eye,
                title: 'Monitor Progress',
                description:
                  'View grades, completion rates, and learning milestones',
              },
              {
                icon: Calendar,
                title: 'Track Attendance',
                description:
                  'See attendance records and receive absence alerts',
              },
              {
                icon: MessageSquare,
                title: 'Message Instructors',
                description: 'Direct communication with teachers and advisors',
              },
              {
                icon: Bell,
                title: 'Get Notifications',
                description:
                  'Receive alerts about grades, attendance, and events',
              },
              {
                icon: BarChart3,
                title: 'View Reports',
                description: 'Access detailed progress and performance reports',
              },
              {
                icon: Shield,
                title: 'Secure Access',
                description: 'Protected portal with privacy controls',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6"
                >
                  <Icon className="w-12 h-12 text-pink-600 mb-4" />
                  <h3 className="text-xl font-bold text-black mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-black">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Ready to Access the Portal?
          </h2>
          <p className="text-xl mb-8">
            Log in to monitor your student's progress
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-pink-600 px-10 py-5 rounded-xl text-lg font-black hover:bg-white transition"
          >
            Access Parent Portal
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </div>
  );
}
