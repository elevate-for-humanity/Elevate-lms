"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Clock, BookOpen, ChevronRight } from 'lucide-react';

interface MobileCourseCardProps {
  id: string;
  title: string;
  description: string;
  progress: number;
  duration: string;
  lessons: number;
  thumbnail?: string;
}

export default function MobileCourseCard({
  id,
  title,
  description,
  progress,
  duration,
  lessons,
  thumbnail,
}: MobileCourseCardProps) {
  return (
    <Link
      href={`/lms/courses/${id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden active:scale-98 transition-transform"
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div className="relative h-40">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {progress > 0 && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-2 rounded-full text-xs font-semibold text-brand-orange-600">
              {progress}%
            </div>
          )}
        </div>
      )}
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-black mb-2 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-black mb-3 line-clamp-2">{description}</p>
        {/* Progress Bar */}
        {progress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-black mb-1">
              <span>Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full    transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-black mb-3">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen size={14} />
            <span>{lessons} lessons</span>
          </div>
        </div>
        {/* Action */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-brand-orange-600">
            {progress > 0 ? 'Continue Learning' : 'Start Course'}
          </span>
          <ChevronRight size={20} className="text-brand-orange-600" />
        </div>
      </div>
    </Link>
  );
}
