import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Carl Brown | Our Team | Elevate for Humanity',
  description: 'Carl Brown — CDL Instructor & Commercial Truck Driver at Elevate for Humanity Career & Technical Institute.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Carl Brown' }]} />
      </div>

      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/about/team" className="inline-flex items-center text-sm text-slate-500 hover:text-brand-red-600 mb-8">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Team
          </Link>

          <div className="grid lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/team/carl-brown.jpg"
                  alt="Carl Brown"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Carl Brown</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-6">CDL Instructor & Commercial Truck Driver</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Carl Brown is an experienced Commercial Truck Driver and Trainer with over 15 years in the transportation and logistics industry, specializing in safety-focused operations, driver training, and fleet logistics. Currently serving at Renascent, Inc. in Indianapolis, Carl provides hands-on instruction to new drivers while conducting daily safety inspections and operating a range of commercial equipment including dump trailers, roll-offs, dump trucks, tractor trailers, and flatbeds.</p>
                <p>Throughout his career, Carl has demonstrated strong leadership, operational planning, and workforce training capabilities across multiple transportation environments, including intermodal, over-the-road (OTR), and delivery logistics. His previous roles with Roadrunner Intermodal, Piazza Produce Inc., and AAA Van Lines reflect a consistent record of supervising operations, maintaining inventory accountability, delivering exceptional customer service, and training employees in safety compliance and professional driving standards.</p>
                <p>In addition to his transportation expertise, Carl brings entrepreneurial experience as a former Owner-Operator of C & S Pressure Washing Services, where he managed business operations and service delivery. He holds a Class A Commercial Driver's License obtained through Chattanooga State Technical Community College and is CPR and First Aid certified, reinforcing his commitment to safety and industry best practices.</p>
                <p>Carl's professional approach is grounded in continued education, leadership, and adherence to evolving transportation regulations and safety protocols. His extensive background in commercial driving, staff training, and operational coordination positions him as a valuable asset in workforce development, logistics operations, and transportation training initiatives.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
