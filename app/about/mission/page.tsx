import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Target, Heart, Users, Briefcase, GraduationCap, HandHeart } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// Force static generation - prevents 10s+ load times

export const metadata: Metadata = {
  title: 'Our Mission | Elevate for Humanity',
  description: 'Our mission is to break the cycle of poverty through free workforce training, connecting underserved communities with career opportunities in Indianapolis and Indiana.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/about/mission',
  },
};

export default function MissionPage() {
  return (
    <div className="min-h-screen bg-white">      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Mission' }]} />
        </div>
      </div>
      
      {/* Hero Section */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/mission-hero.jpg" alt="Elevate for Humanity mission — community empowerment through workforce training" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Our Mission</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Breaking the cycle of poverty through free workforce training and career placement</p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <Target className="w-16 h-16 text-brand-orange-600 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Mission Statement
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed">
              Elevate for Humanity exists to provide free, high-quality workforce training to 
              underserved communities in Indianapolis and throughout Indiana. We believe that 
              everyone deserves access to career opportunities regardless of their background, 
              financial situation, or past circumstances.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Heart className="w-12 h-12 text-brand-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Compassion</h3>
              <p className="text-gray-600">
                We meet people where they are, understanding that everyone&apos;s journey is different. 
                We provide wraparound support services to address barriers to success.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Users className="w-12 h-12 text-brand-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community</h3>
              <p className="text-gray-600">
                We build lasting relationships with students, employers, and community partners. 
                Together, we create pathways to prosperity for all.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <GraduationCap className="w-12 h-12 text-brand-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Excellence</h3>
              <p className="text-gray-600">
                We deliver industry-recognized training that prepares students for real careers. 
                Strong placement outcomes through employer partnerships reflect our commitment to quality.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Briefcase className="w-12 h-12 text-brand-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Opportunity</h3>
              <p className="text-gray-600">
                We connect graduates with employers actively hiring in high-demand fields. 
                Career services continue long after graduation.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <HandHeart className="w-12 h-12 text-brand-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Accessibility</h3>
              <p className="text-gray-600">
                Training funded through WIOA, WRG, and JRI for eligible participants. 
                No tuition for those who qualify. Financial barriers should never prevent career advancement.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Target className="w-12 h-12 text-brand-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Impact</h3>
              <p className="text-gray-600">
                We measure success by lives changed. Hundreds of Indiana residents trained, 
                families supported, and communities strengthened since 2020.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] rounded-xl overflow-hidden">
              <Image
                src="/images/pages/mission-vision-training.jpg"
                alt="Students in hands-on training"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Vision
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                We envision an Indiana where every person has access to the training and 
                support they need to build a sustainable career. Where zip code doesn&apos;t 
                determine destiny, and where employers have access to a skilled, diverse workforce.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                We aim to expand training capacity, deepen employer partnerships, 
                and expand our programs to serve communities across the Midwest.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-brand-orange-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-brand-orange-600">ETPL Listed</div>
                  <div className="text-sm text-gray-600">Students Trained</div>
                </div>
                <div className="bg-brand-orange-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-brand-orange-600">85%</div>
                  <div className="text-sm text-gray-600">Job Placement</div>
                </div>
                <div className="bg-brand-orange-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-brand-orange-600">$0</div>
                  <div className="text-sm text-gray-600">For Eligible Participants</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl text-brand-orange-100 mb-8">
            Whether you&apos;re looking to start a new career, hire skilled workers, or support 
            our community, there&apos;s a place for you at Elevate for Humanity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="px-8 py-4 bg-white text-brand-orange-600 font-bold rounded-full hover:bg-brand-orange-50 transition-all"
            >
              Start Your Training
            </Link>
            <Link
              href="/employers"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-brand-orange-600 transition-all"
            >
              Partner With Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
