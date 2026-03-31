import Link from "next/link";
import Image from "next/image";
import { StarRating } from "./StarRating";
import { ProgressBar } from "./ProgressBar";
import { Clock, Users } from "lucide-react";

type CourseCardProps = {
  slug: string;
  title: string;
  provider?: string;
  level?: string;
  thumbnailUrl?: string | null;
  rating?: number;
  ratingCount?: number;
  progress?: number;
  duration?: string;
  enrollments?: number;
};

export function CourseCard(props: CourseCardProps) {
  const {
    slug,
    title,
    provider,
    level,
    thumbnailUrl,
    rating = 0,
    ratingCount = 0,
    progress,
    duration,
    enrollments,
  } = props;

  return (
    <Link
      href={`/courses/${slug}`}
      className="card group flex flex-col overflow-hidden hover:-translate-y-1"
    >
      {thumbnailUrl && (
        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
           sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-500">
            {provider ?? "Elevate for Humanity"}
          </p>
          <h3 className="line-clamp-2 text-base font-semibold text-black group-hover:text-brand-600 transition-colors">
            {title}
          </h3>
          {level && (
            <span className="badge badge-primary text-xs">
              {level}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <StarRating rating={rating} count={ratingCount} size="sm" />
        </div>

        {(duration || enrollments) && (
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{duration}</span>
              </div>
            )}
            {enrollments && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{enrollments.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {typeof progress === "number" && (
          <div className="mt-auto pt-3 border-t border-slate-100">
            <ProgressBar progress={progress} size="sm" />
          </div>
        )}
      </div>
    </Link>
  );
}
