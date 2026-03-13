import type { Metadata } from 'next';
import Image from 'next/image';
import AICareerCounseling from '@/components/AICareerCounseling';
import PageVideoHero from '@/components/ui/PageVideoHero';

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

      <PageVideoHero
        videoSrc="/videos/career-services-hero.mp4"
        posterSrc="/images/pages/career-counseling.jpg"
        posterAlt="Career Counseling — Elevate for Humanity"
        audioSrc="/audio/heroes/career-services.mp3"
        size="marketing"
      />
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/career-counseling-page-1.jpg" alt="Career counseling and job placement" fill sizes="100vw" className="object-cover" priority />
      </section>
      <AICareerCounseling />
    </div>
  );
}
