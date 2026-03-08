import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Heart,
  Wrench,
  Truck,
  Scissors,
  Building2,
  Utensils,
  Laptop,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import ModernLandingHero from '@/components/landing/ModernLandingHero';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Industries We Serve | Elevate for Humanity',
  description:
    'Explore career training programs across multiple industries including healthcare, skilled trades, transportation, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/industries',
  },
};

const industries = [
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: Heart,
    description:
      'Train for in-demand healthcare careers including CNA, Medical Assistant, Phlebotomy, and more.',
    programs: ['CNA', 'Medical Assistant', 'Phlebotomy', 'Home Health Aide'],
    href: '/industries/healthcare',
  },
  {
    id: 'skilled-trades',
    name: 'Skilled Trades',
    icon: Wrench,
    description:
      'Learn hands-on skills in HVAC, welding, electrical, plumbing, and construction trades.',
    programs: ['Building Technician', 'Welding', 'Electrical', 'Plumbing'],
    href: '/programs/skilled-trades',
  },
  {
    id: 'transportation',
    name: 'Transportation & Logistics',
    icon: Truck,
    description:
      'Get your CDL and start a career in trucking, delivery, or logistics.',
    programs: ['CDL Class A', 'CDL Class B', 'Forklift Operator'],
    href: '/programs/cdl-transportation',
  },
  {
    id: 'cosmetology',
    name: 'Cosmetology & Barbering',
    icon: Scissors,
    description:
      'Earn while you learn in registered apprenticeship programs for barbers and cosmetologists.',
    programs: ['Barber Apprenticeship', 'Cosmetology', 'Nail Technician'],
    href: '/programs/barber-apprenticeship',
  },
  {
    id: 'business',
    name: 'Business & Office',
    icon: Building2,
    description:
      'Develop professional skills for office administration, customer service, and business operations.',
    programs: [
      'Office Administration',
      'Customer Service',
      'Bookkeeping',
      'QuickBooks',
    ],
    href: '/programs',
  },
  {
    id: 'hospitality',
    name: 'Hospitality & Food Service',
    icon: Utensils,
    description:
      'Start your career in restaurants, hotels, and food service management.',
    programs: [
      'Food Handler Certification',
      'ServSafe',
      'Hospitality Management',
    ],
    href: '/programs',
  },
  {
    id: 'technology',
    name: 'Information Technology',
    icon: Laptop,
    description:
      'Get certified in IT support, networking, cybersecurity, and more.',
    programs: ['IT Specialist — Device Config', 'IT Specialist — Networking', 'IT Specialist — Cybersecurity', 'IT Help Desk'],
    href: '/programs',
  },
  {
    id: 'education',
    name: 'Education & Childcare',
    icon: GraduationCap,
    description:
      'Train to work with children in daycare, preschool, and educational settings.',
    programs: ['Child Development Associate', 'Teacher Assistant', 'Daycare'],
    href: '/programs',
  },
];

export default async function IndustriesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  
  // Fetch industries
  const { data: dbIndustries } = await db
    .from('industries')
    .select('*')
    .order('name');

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Industries" }]} />
      </div>
<ModernLandingHero
        badge="8 High-Demand Industries"
        headline="Industries"
        accentText="We Serve"
        subheadline="Career training across multiple high-demand industries"
        description="Explore programs in healthcare, skilled trades, transportation, technology, and more. All programs are 100% funded for eligible students with industry-recognized credentials."
        imageSrc="/images/pages/programs-page-hero.jpg"
        imageAlt="Industries We Serve"
        primaryCTA={{ text: "Explore Programs", href: "#industries" }}
        secondaryCTA={{ text: "Apply Now", href: "/apply" }}
        features={[
          "8 high-demand industries • 20+ career programs",
          "100% funded training for eligible students",
          "Industry-recognized credentials and certifications"
        ]}
        imageOnRight={true}
      />

      {/* Industries Grid */}
      <section id="industries" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry) => {
              const Icon = industry.icon;
              return (
                <Link
                  key={industry.id}
                  href={industry.href}
                  className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-brand-blue-500 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center group-hover:bg-brand-blue-600 transition-colors">
                      <Icon className="h-11 w-11 text-brand-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-black text-black mb-2 group-hover:text-brand-blue-600 transition-colors">
                        {industry.name}
                      </h2>
                    </div>
                  </div>

                  <p className="text-black mb-6">{industry.description}</p>

                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-black mb-2">
                      Programs Available:
                    </h3>
                    <ul className="space-y-1">
                      {industry.programs.map((program: any) => (
                        <li
                          key={program}
                          className="text-sm text-black flex items-center gap-2"
                        >
                          <span className="text-brand-green-600">•</span>
                          {program}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-2 text-brand-blue-600 font-bold group-hover:gap-4 transition-all">
                    <span>Explore Programs</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-black mb-6">
            Ready to Start Your Career?
          </h2>
          <p className="text-xl text-black mb-8">
            Apply today and we'll help you find the right program for your
            goals.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Apply Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
