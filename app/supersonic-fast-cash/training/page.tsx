import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Video, FileText, Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tax Preparer Training | Supersonic Fast Cash',
  description: 'PTIN-credentialed tax preparer training program. Learn tax preparation and complete your training.',
};

export default async function TrainingPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch training info
  const { data: training } = await supabase
    .from('training_programs')
    .select('*')
    .eq('company', 'supersonic');
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Training" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[400px] w-full overflow-hidden">
        <Image 
          src="/images/business/tax-prep-certification-optimized.jpg" 
          alt="Tax Preparer Training" 
          fill
          className="object-cover" 
          quality={85}
          priority
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Tax Preparer Training
            </h1>
            <p className="text-xl">
              Become an PTIN-credentialed tax professional
            </p>
          </div>
        </div>
      </section>

      {/* Training Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Professional Tax Training</h2>
              <p className="text-black mb-4">
                Our training program prepares you to become an PTIN-credentialed tax preparer. Learn the skills needed to prepare individual and business tax returns accurately and efficiently.
              </p>
              <p className="text-black mb-6">
                Training includes federal tax law, tax software operation, client communication, and ethics requirements.
              </p>
              <Link
                href="/supersonic-fast-cash/careers"
                className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Learn More About Careers
              </Link>
            </div>
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Training Includes</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <span>Federal tax law and regulations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <span>Professional tax software training</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <span>Form preparation and filing</span>
                </li>
                <li className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <span>IRS certification preparation</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
            <h3 className="text-2xl font-bold mb-4">Requirements</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Prerequisites</h4>
                <ul className="list-disc list-inside space-y-1 text-black">
                  <li>High school diploma or equivalent</li>
                  <li>Basic computer skills</li>
                  <li>Strong attention to detail</li>
                  <li>Good communication skills</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Certification</h4>
                <ul className="list-disc list-inside space-y-1 text-black">
                  <li>Complete training program</li>
                  <li>Pass IRS competency test</li>
                  <li>Obtain PTIN (Preparer Tax ID)</li>
                  <li>Annual continuing education</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
