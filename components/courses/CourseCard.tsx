"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Course } from '@/content/courses/catalog';
import manifest from '@/public/generated-images/manifest.json';

type Props = {
  course: Course;
};

export function CourseCard({ course }: Props) {
  const coverSrc =
    (manifest as Record<string, string>)[course.coverImageKey] ??
    '/images/pages/training-classroom.jpg';

  return (
    <Link
      href={course.path}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={coverSrc}
          alt={course.course_name}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-semibold text-black">
          {course.course_name}
        </h3>
        <p className="line-clamp-3 text-sm text-black">
          {course.shortDescription}
        </p>
        <span className="mt-2 inline-flex items-center text-xs font-medium text-brand-orange-600 group-hover:underline">
          View program details
        </span>
      </div>
    </Link>
  );
}

export default CourseCard;
