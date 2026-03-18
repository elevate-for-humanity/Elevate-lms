import Image from 'next/image';
import { GraduationCap } from 'lucide-react';
import { LMS_HEROES } from '@/lib/lms/image-map';

interface DashboardHeroProps {
  firstName: string;
  courseProgress: number;
  hasActiveEnrollment: boolean;
}

export function DashboardHero({ firstName, courseProgress, hasActiveEnrollment }: DashboardHeroProps) {
  return (
    <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
      <div className="relative h-[200px] sm:h-[280px] md:h-[340px]">
        <Image
          src={LMS_HEROES.dashboard}
          alt="Students celebrating training completion"
          fill
          sizes="100vw"
          className="object-cover"
          quality={100}
          priority
        />
      </div>
      <div className="bg-slate-900 py-8 px-8 md:px-12">
        <div className="flex items-center gap-3 mb-3">
          <GraduationCap className="w-10 h-10 text-white" />
          <h1 className="text-3xl md:text-4xl font-black text-white">
            Welcome Back, {firstName}
          </h1>
        </div>
        <p className="text-base md:text-lg text-white/90 mb-4">
          Start your next lesson, track progress, and complete quizzes and assessments.
        </p>

        {hasActiveEnrollment && (
          <div className="bg-white/15 rounded-xl p-4 border border-white/20 max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-white">Course Progress</span>
              <span className="font-black text-white">{Math.round(courseProgress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${courseProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
