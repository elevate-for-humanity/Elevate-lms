import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const revalidate = 600;

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/funding/wioa',
  },
  title: 'WIOA Funded Training | Elevate For Humanity',
  description:
    'Get Funded career training through WIOA (Workforce Innovation and Opportunity Act). For unemployed, underemployed, and workers facing barriers.',
};

export default async function WioaPage() {
  let wioaInfo = null;

  try {
    const supabase = createPublicClient();
    if (supabase) {
      const { data } = await supabase
        .from('funding_options')
        .select('*')
        .eq('type', 'wioa')
        .single();
      wioaInfo = data;
    }
  } catch (error) {
    console.error('Error fetching WIOA info:', error);
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'WIOA' }]} />
        </div>
      </div>

      {/* Hero Section - Image Only */}
      <section className="relative h-[400px] overflow-hidden">
        <Image
          src="/images/pages/funding-page-5.jpg"
          alt="WIOA Success Story"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-base md:text-lg text-black mb-6 leading-relaxed">
            James worked at a factory for 8 years. Then the plant closed. No
            warning. No severance. Just... gone.
          </p>
          <p className="text-lg text-black mb-6">
            He applied everywhere. Fast food. Warehouses. Retail. But without
            new skills, he couldn't find anything that paid more than $12/hour.
            He had a mortgage. Two kids. Bills piling up.
          </p>
          <p className="text-lg text-black mb-6">
            Then his WorkOne advisor told him about WIOA. The government would
            pay for him to learn HVAC repair—a skill that's in high demand.
            Tuition: $5,000. Books: $300. Gas money to get to class: covered.
            All free.
          </p>
          <p className="text-lg text-black mb-6">
            60 days later, James graduated with 6 certifications. He got hired
            at $55,000/year with benefits. "WIOA saved my family," he says.
          </p>
        </div>
      </section>

      {/* What is WIOA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">What is WIOA?</h2>

          <p className="text-lg text-black mb-6">
            WIOA stands for{' '}
            <strong>Workforce Innovation and Opportunity Act</strong>. It's a
            federal program that provides free job training to people who are:
          </p>

          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-base">
                •
              </span>
              <span className="text-black">
                <strong>Unemployed</strong> (lost your job, can't find work)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-base">
                •
              </span>
              <span className="text-black">
                <strong>Underemployed</strong> (working part-time, low wages, no
                benefits)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-base">
                •
              </span>
              <span className="text-black">
                <strong>Facing barriers</strong> (disability, low income,
                justice involvement, lack of education)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-base">
                •
              </span>
              <span className="text-black">
                <strong>Dislocated workers</strong> (laid off, plant closure,
                industry decline)
              </span>
            </li>
          </ul>

          <p className="text-lg text-black">
            WIOA is run through your local <strong>WorkOne center</strong>. They
            connect you with training providers (like us), help you apply for
            funding, and support you through the entire process.
          </p>
        </div>
      </section>

      {/* What WIOA Covers */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            What Does WIOA Cover?
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-brand-green-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-brand-green-900">
                • Tuition
              </h3>
              <p className="text-black">
                100% of training costs. Whether it's a 3-week CNA program or a
                12-month HVAC apprenticeship, WIOA pays for it.
              </p>
            </div>

            <div className="bg-brand-green-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-brand-green-900">
                • Books & Materials
              </h3>
              <p className="text-black">
                Textbooks, workbooks, uniforms, tools—whatever you need for
                training.
              </p>
            </div>

            <div className="bg-brand-green-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-brand-green-900">
                • Transportation
              </h3>
              <p className="text-black">
                Gas money, bus passes, or mileage reimbursement to get to class.
              </p>
            </div>

            <div className="bg-brand-green-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-brand-green-900">
                • Childcare
              </h3>
              <p className="text-black">
                If you need childcare while you're in training, WIOA can help
                cover it.
              </p>
            </div>

            <div className="bg-brand-green-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-brand-green-900">
                • Support Services
              </h3>
              <p className="text-black">
                Work clothes, internet access, even emergency assistance if
                you're struggling.
              </p>
            </div>

            <div className="bg-brand-green-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-brand-green-900">
                • Job Placement Help
              </h3>
              <p className="text-black">
                Resume writing, interview prep, and connections to employers
                hiring in your field.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Qualify */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            How Do I Qualify?
          </h2>

          <p className="text-lg text-black mb-6">
            WIOA eligibility depends on your situation. Here are the most common
            ways people qualify:
          </p>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">1. You Lost Your Job</h3>
              <p className="text-black">
                Laid off, fired, plant closure, company downsizing—if you're
                unemployed through no fault of your own, you likely qualify.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">
                2. You're Working But Struggling
              </h3>
              <p className="text-black">
                Part-time hours, low wages (under $15/hour), no benefits,
                unstable work—WIOA helps underemployed workers upgrade their
                skills.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">
                3. You Face Barriers to Employment
              </h3>
              <p className="text-black">
                Disability, low income, lack of high school diploma, English as
                a second language, justice involvement, homelessness—WIOA is
                designed to help people overcome barriers.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">4. You're a Veteran</h3>
              <p className="text-black">
                Veterans get priority for WIOA services. If you served, you're
                likely eligible.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-brand-blue-50 rounded-lg p-6">
            <p className="text-brand-blue-900">
              <strong>Not sure if you qualify?</strong> Contact us. We'll
              connect you with your local WorkOne center and help you through
              the application process.
            </p>
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            How to Apply for WIOA
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">
                  Contact Your Local WorkOne Center
                </h3>
                <p className="text-black">
                  Find your nearest WorkOne at{' '}
                  <a
                    href="https://www.in.gov/dwd/workone-centers/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue-600 underline"
                  >
                    in.gov/dwd/workone-centers
                  </a>
                  . Call or walk in. Tell them you're interested in WIOA
                  training.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">
                  Meet with a Career Advisor
                </h3>
                <p className="text-black">
                  They'll assess your eligibility, discuss your career goals,
                  and help you choose a training program.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">
                  Choose Elevate For Humanity
                </h3>
                <p className="text-black">
                  Tell your advisor you want to train with us. We're an approved
                  WIOA provider. We'll handle the enrollment paperwork.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">
                  Start Training (For Free)
                </h3>
                <p className="text-black">
                  Once approved, you start immediately. No tuition bills. No
                  loans. Just focus on learning.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-brand-orange-50 rounded-lg p-6">
            <p className="text-brand-orange-900 mb-4">
              <strong>Need help navigating the process?</strong> We work with
              WorkOne centers every day. Contact us at{' '}
              <a href="/support" className="font-bold underline">
                317-314-3757
              </a>{' '}
              and we'll guide you through it.
            </p>
          </div>
        </div>
      </section>

      {/* Real Stories */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            Real WIOA Success Stories
          </h2>

          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6">
              <p className="text-lg text-black mb-4">
                <strong>Sarah, 32 - Medical Assistant</strong>
              </p>
              <p className="text-black">
                "I was working at Walmart for $13/hour. Single mom, two kids,
                barely making rent. My WorkOne advisor told me about WIOA. They
                paid for my Medical Assistant training—21 days, completely free.
                Now I work at a clinic making $42,000/year with health
                insurance. My kids have stability. WIOA changed everything."
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <p className="text-lg text-black mb-4">
                <strong>Graduate, 45 - HVAC Technician</strong>
              </p>
              <p className="text-black">
                "I got laid off after 15 years in manufacturing. I was 45 years
                old with no college degree. I thought my career was over. WIOA
                paid for my HVAC training—60 days, 6 certifications. I got hired
                before I even graduated. Now I'm making $55K with benefits and
                overtime. I'm 50 now and I've never been more financially
                secure."
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <p className="text-lg text-black mb-4">
                <strong>Keisha, 26 - Peer Recovery Coach</strong>
              </p>
              <p className="text-black">
                "I'm in recovery. I have a record. Nobody would hire me. WIOA
                gave me a chance. They paid for my Peer Recovery Coach training.
                Now I work at a treatment center helping people like me. I make
                $38K/year and I'm saving lives. WIOA didn't just give me a
                job—it gave me purpose."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Apply for WIOA?
          </h2>
          <p className="text-base md:text-lg mb-8">
            We'll help you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block px-10 py-5 bg-white text-brand-blue-600 font-bold rounded-lg hover:bg-white transition-all text-lg shadow-xl"
            >
              Contact Us
            </Link>
            <a
              href="https://www.in.gov/dwd/workone-centers/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-10 py-5 bg-brand-blue-700 text-white font-bold rounded-lg hover:bg-brand-blue-800 border-2 border-white transition-all text-lg shadow-xl"
            >
              Find Your WorkOne Center
            </a>
          </div>
          <p className="mt-6 text-black">
            Questions? Call{' '}
            <a href="/support" className="font-bold underline">
              317-314-3757
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
