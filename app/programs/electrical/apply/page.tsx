export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import RequestMeeting from '@/components/RequestMeeting';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Apply for Electrical | Elevate for Humanity',
  description: 'Apply for our Electrical program. WIOA-funded training available in Indianapolis.',
};

export default async function ApplyPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('programs').select('*').limit(50);

  return (
    <main className="min-h-screen bg-white">
      <div className="relative h-[40vh] min-h-[300px] max-h-[400px]">
        <Image src="/images/trades/electrical-hero.jpg" alt="Electrical" fill sizes="100vw" className="object-cover" priority />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-4">
        <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Electrical', href: '/programs/electrical' }, { label: 'Apply' }]} />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <Image src="/images/trades/electrical.jpg" alt="Electrical training" width={400} height={300} className="w-full h-48 object-cover" />
            <div className="bg-white p-4 border-t"><p className="font-bold text-lg text-black">Duration</p><p className="text-black">8-12 Weeks</p></div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <Image src="/images/trades/hero-program-electrical.jpg" alt="Electrical program" width={400} height={300} className="w-full h-48 object-cover" />
            <div className="bg-white p-4 border-t"><p className="font-bold text-lg text-black">Cost</p><p className="text-black">Free with WIOA funding</p></div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <Image src="/images/trades/program-electrical-training.jpg" alt="Electrical career" width={400} height={300} className="w-full h-48 object-cover" />
            <div className="bg-white p-4 border-t"><p className="font-bold text-lg text-black">Format</p><p className="text-black">Rolling enrollment</p></div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Link href="/inquiry?program=electrical" className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border">
            <Image src="/images/trades/electrical.jpg" alt="Request information about Electrical" width={600} height={300} className="w-full h-52 object-cover" />
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-black mb-2">Request Information</h3>
              <p className="text-black mb-4">Get program details, schedules, and eligibility info sent to you.</p>
              <span className="inline-flex items-center px-8 py-4 border-2 border-black text-black text-lg font-bold rounded-full">Get Info</span>
            </div>
          </Link>
          <Link href="/apply/student?program=electrical" className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border">
            <Image src="/images/trades/hero-program-electrical.jpg" alt="Apply for Electrical" width={600} height={300} className="w-full h-52 object-cover" />
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-black mb-2">Start Application</h3>
              <p className="text-black mb-4">Ready to enroll? Complete your application online now.</p>
              <span className="inline-flex items-center px-8 py-4 bg-brand-green-600 text-white text-lg font-bold rounded-full">Apply Now <ArrowRight className="w-5 h-5 ml-2" /></span>
            </div>
          </Link>
        </div>

        <div className="mt-8">
          <RequestMeeting context="Have questions about the Electrical program or need help applying? Schedule a free meeting with an advisor." />
        </div>

        <Link href="/programs/electrical" className="inline-flex items-center text-lg text-black font-semibold hover:underline">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Electrical
        </Link>
      </div>
    </main>
  );
}
