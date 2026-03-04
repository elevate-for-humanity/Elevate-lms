import type { Metadata } from 'next';
import Image from 'next/image';
import AICareerCounseling from '@/components/AICareerCounseling';

export const metadata: Metadata = {
  title: 'AI Career Counseling | Free Career Guidance | Elevate for Humanity',
  description: 'Get personalized career guidance powered by AI. Explore career paths, identify skill gaps, and find the right training program for your goals. Free service from Elevate for Humanity.',
  openGraph: {
    title: 'AI Career Counseling | Elevate for Humanity',
    description: 'Get personalized career guidance powered by AI. Explore career paths and find the right training program.',
  },
};

export default function CareerCounselingPage() {
  return (
    <div>
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/career-counseling-page-1.jpg" alt="Career counseling and job placement" fill sizes="100vw" className="object-cover" priority />
      </section>
      <AICareerCounseling />
    </div>
  );
}
