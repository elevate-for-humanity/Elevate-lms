// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import PageAvatar from '@/components/PageAvatar';
import { 
  CheckCircle, Clock, Award, ArrowRight, Heart, 
  Users, Shield, Phone, Calendar, Building, Briefcase
} from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'CPR & First Aid Certification (HSI) | Indianapolis | Elevate',
  description: 'Get CPR, AED, and First Aid certified in one day. HSI-certified courses for healthcare, workplace, and community. American Heart Association aligned.',
  alternates: { canonical: `${SITE_URL}/programs/cpr-first-aid-hsi` },
  keywords: [
    'CPR certification Indianapolis',
    'First Aid training Indiana',
    'HSI CPR course',
    'AED certification',
    'BLS certification Indianapolis',
    'CPR classes near me',
    'workplace CPR training',
    'healthcare CPR certification',
    'American Heart Association CPR',
    'CPR recertification Indiana',
    'first aid classes Indianapolis',
    'emergency response training',
    'CPR AED First Aid combo',
    'group CPR training',
  ],
  openGraph: {
    title: 'CPR & First Aid Certification (HSI) | Indianapolis',
    description: 'Get CPR, AED, and First Aid certified in one day. HSI-certified courses.',
    url: `${SITE_URL}/programs/cpr-first-aid-hsi`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/healthcare/cpr-certification-group.jpg`, width: 1200, height: 630, alt: 'CPR First Aid Training' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CPR & First Aid Certification (HSI)',
    description: 'Get CPR, AED, and First Aid certified in one day.',
    images: [`${SITE_URL}/images/healthcare/cpr-certification-group.jpg`],
  },
};

const courses = [
  {
    title: 'CPR/AED/First Aid',
    duration: '4-5 hours',
    price: '$75',
    certification: '2-year certification',
    desc: 'Complete training for workplace and community responders',
    skills: ['Adult CPR', 'AED operation', 'Choking response', 'Wound care', 'Shock management'],
  },
  {
    title: 'BLS for Healthcare Providers',
    duration: '4 hours',
    price: '$85',
    certification: '2-year certification',
    desc: 'Advanced life support for medical professionals',
    skills: ['Adult/Child/Infant CPR', 'Bag-valve mask', 'Team resuscitation', 'AED protocols'],
  },
  {
    title: 'Heartsaver CPR/AED',
    duration: '3 hours',
    price: '$65',
    certification: '2-year certification',
    desc: 'Basic CPR and AED for non-healthcare workers',
    skills: ['Adult CPR', 'AED use', 'Choking relief', 'Emergency response'],
  },
  {
    title: 'First Aid Only',
    duration: '3 hours',
    price: '$55',
    certification: '2-year certification',
    desc: 'Injury and illness response without CPR',
    skills: ['Bleeding control', 'Burns', 'Fractures', 'Medical emergencies'],
  },
];

const whoNeeds = [
  { icon: Building, title: 'Workplaces', desc: 'OSHA compliance, safety teams' },
  { icon: Heart, title: 'Healthcare', desc: 'CNAs, nurses, medical staff' },
  { icon: Users, title: 'Schools', desc: 'Teachers, coaches, staff' },
  { icon: Briefcase, title: 'Childcare', desc: 'Daycare, nannies, babysitters' },
  { icon: Shield, title: 'Security', desc: 'Guards, event staff' },
  { icon: Calendar, title: 'Community', desc: 'Parents, volunteers, anyone' },
];

export default function CPRFirstAidPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' }, 
            { label: 'Healthcare', href: '/programs/healthcare' }, 
            { label: 'CPR & First Aid (HSI)' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px]">
        <Image 
          src="/images/healthcare/cpr-certification-group.jpg" 
          alt="CPR First Aid Training" 
          fill sizes="100vw"
          className="object-cover" 
          priority 
        />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Heart className="w-4 h-4" /> HSI Certified Training
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              CPR & First Aid
            </h1>
            <p className="text-xl text-white/90 max-w-xl mb-6">
              Get certified in one day. Learn life-saving skills that could help you save a coworker, family member, or stranger.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/inquiry?program=cpr-first-aid-hsi" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
                Schedule a Class <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="tel:+13173143757" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-full font-bold text-lg transition-all border border-white/40">
                <Phone className="w-5 h-5" /> (317) 314-3757
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/avatars/healthcare-guide.mp4" 
        title="CPR & First Aid Guide" 
      />

      {/* Quick Stats */}
      <section className="py-8 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">3-5 Hours</div>
              <div className="text-slate-400 text-sm">Class Length</div>
            </div>
            <div>
              <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">2 Years</div>
              <div className="text-slate-400 text-sm">Certification Valid</div>
            </div>
            <div>
              <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">HSI</div>
              <div className="text-slate-400 text-sm">Certified Provider</div>
            </div>
            <div>
              <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">On-Site</div>
              <div className="text-slate-400 text-sm">Group Training</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why CPR Matters */}
      <section className="py-16 bg-red-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Why CPR Training Matters</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">350,000 cardiac arrests happen outside hospitals each year</h3>
                    <p className="text-slate-600">Most occur at home, work, or in public places.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">CPR can double or triple survival chances</h3>
                    <p className="text-slate-600">Immediate CPR keeps blood flowing to vital organs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Only 46% of people receive bystander CPR</h3>
                    <p className="text-slate-600">More trained responders means more lives saved.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
              <Image 
                src="/images/healthcare/cpr-individual-practice.jpg" 
                alt="CPR practice on mannequin" 
                fill sizes="100vw"
                className="object-cover" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course Options */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Course Options</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Choose the certification that fits your needs. All courses include hands-on practice and certification card.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-slate-900">{course.title}</h3>
                    <p className="text-slate-600 text-sm">{course.desc}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">{course.price}</div>
                    <div className="text-slate-500 text-sm">{course.duration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                  <Award className="w-4 h-4" />
                  <span>{course.certification}</span>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Skills Covered:</p>
                  <div className="flex flex-wrap gap-2">
                    {course.skills.map((skill, j) => (
                      <span key={j} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Needs This */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Who Needs CPR/First Aid?</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Many jobs require CPR certification. Even if not required, these skills can save lives.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whoNeeds.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Group Training */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-black mb-6">Group & On-Site Training</h2>
              <p className="text-blue-100 mb-6">
                We come to your location. Perfect for businesses, schools, churches, and organizations 
                needing to train multiple people.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Minimum 6 participants',
                  'Discounted group rates',
                  'Flexible scheduling',
                  'All equipment provided',
                  'Certificates issued same day',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-200" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/employers" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all">
                Request Group Training <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
              <Image 
                src="/images/healthcare/cpr-group-training-session.jpg" 
                alt="Group CPR training session" 
                fill sizes="100vw"
                className="object-cover" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">What to Expect</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: 1, title: 'Check In', desc: 'Arrive 10 minutes early, sign waivers' },
              { num: 2, title: 'Learn', desc: 'Video instruction and discussion' },
              { num: 3, title: 'Practice', desc: 'Hands-on skills with mannequins' },
              { num: 4, title: 'Certify', desc: 'Pass skills check, get your card' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Get Certified Today
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Classes available weekly. Group training by appointment.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/inquiry?program=cpr-first-aid-hsi" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Schedule a Class <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+13173143757" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              <Phone className="w-5 h-5" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
