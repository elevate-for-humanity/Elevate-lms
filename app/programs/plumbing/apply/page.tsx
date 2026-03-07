
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import RequestMeeting from '@/components/RequestMeeting';

export const metadata: Metadata = {
  title: 'Apply for Plumbing | Elevate for Humanity',
  description: 'Apply for our Plumbing program. WIOA-funded training available in Indianapolis.',
};

export default function ApplyPage() {

  return (
    <main className="min-h-screen bg-white">
      <div className="relative h-[40vh] min-h-[300px] max-h-[400px] overflow-hidden">
        <Image src="/images/pages/programs-plumbing-apply-hero.jpg" alt="Plumbing" fill sizes="100vw" className="object-cover" priority />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-4">
        <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Plumbing', href: '/programs/plumbing' }, { label: 'Apply' }]} />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <Image src="/images/pages/programs-plumbing-apply-d1.jpg" alt="Plumbing training" width={400} height={300} className="w-full h-48 object-cover" />
            <div className="bg-white p-4 border-t"><p className="font-bold text-lg text-black">Duration</p><p className="text-black">8-12 Weeks</p></div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <Image src="/images/pages/programs-plumbing-apply-d2.jpg" alt="Plumbing program" width={400} height={300} className="w-full h-48 object-cover" />
            <div className="bg-white p-4 border-t"><p className="font-bold text-lg text-black">Cost</p><p className="text-black">Free with WIOA funding</p></div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <Image src="/images/pages/programs-plumbing-apply-d2.jpg" alt="Plumbing career" width={400} height={300} className="w-full h-48 object-cover" />
            <div className="bg-white p-4 border-t"><p className="font-bold text-lg text-black">Format</p><p className="text-black">Rolling enrollment</p></div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Link href="/inquiry?program=plumbing" className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border">
            <Image src="/images/pages/programs-plumbing-apply-d1.jpg" alt="Request information about Plumbing" width={600} height={300} className="w-full h-52 object-cover" />
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-black mb-2">Request Information</h3>
              <p className="text-black mb-4">Get program details, schedules, and eligibility info sent to you.</p>
              <span className="inline-flex items-center px-8 py-4 border-2 border-black text-black text-lg font-bold rounded-full">Get Info</span>
            </div>
          </Link>
          <Link href="/apply/student?program=plumbing" className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border">
            <Image src="/images/pages/programs-plumbing-apply-hero.jpg" alt="Apply for Plumbing" width={600} height={300} className="w-full h-52 object-cover" />
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-black mb-2">Start Application</h3>
              <p className="text-black mb-4">Ready to enroll? Complete your application online now.</p>
              <span className="inline-flex items-center px-8 py-4 bg-brand-green-600 text-white text-lg font-bold rounded-full">Apply Now <ArrowRight className="w-5 h-5 ml-2" /></span>
            </div>
          </Link>
        </div>

        <Link href="/programs/plumbing" className="inline-flex items-center text-lg text-black font-semibold hover:underline">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Plumbing
        </Link>
      </div>
    </main>
  );
}
