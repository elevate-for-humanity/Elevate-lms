import Image from 'next/image';

type CourseOverviewMetaProps = {
  course: {
    id: string;
    title: string;
    summary?: string | null;
    description?: string | null;
    level?: string | null;
    duration_hours?: number | null;
    category?: string | null;
    tags?: string[] | null;
    skills?: string[] | null;
    what_you_learn?: string[] | null;
  };
  instructor?: {
    full_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  } | null;
  averageRating: number;
  ratingCount: number;
  enrollmentCount: number;
};

export function CourseOverviewMeta({
  course,
  instructor,
  averageRating,
  ratingCount,
  enrollmentCount,
}: CourseOverviewMetaProps) {
  return (
    <div className="space-y-6 rounded-xl border bg-white p-5 shadow-sm">
      {/* Top badges / rating */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {course.level && (
          <span className="rounded-full bg-brand-red-50 px-3 py-2 font-semibold text-brand-red-700">
            {course.level}
          </span>
        )}
        {course.category && (
          <span className="rounded-full bg-brand-blue-50 px-3 py-2 font-semibold text-brand-blue-700">
            {course.category}
          </span>
        )}
        {averageRating > 0 && (
          <span className="rounded-full bg-yellow-50 px-3 py-2 font-semibold text-yellow-700">
            ⭐ {averageRating.toFixed(1)} ({ratingCount} reviews)
          </span>
        )}
        <span className="rounded-full bg-slate-100 px-3 py-2 font-semibold text-black">
          {enrollmentCount} learners
        </span>
      </div>

      {/* What you'll learn */}
      {course.what_you_learn && course.what_you_learn.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">What you&apos;ll learn</h3>
          <ul className="mt-2 grid gap-2 text-xs text-black md:grid-cols-2">
            {course.what_you_learn.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-brand-orange-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills */}
      {course.skills && course.skills.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Skills you&apos;ll build</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {course.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-black"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instructor */}
      {instructor && (
        <div className="flex items-start gap-3 border-t pt-4">
          {instructor.avatar_url ? (
            <Image
              src={instructor.avatar_url}
              alt={instructor.full_name || "Instructor"}
              width={40}
              height={40}
              className="mt-1 rounded-full object-cover"
            />
          ) : (
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-black">
              {(instructor.full_name || "I")
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-black">
              {instructor.full_name || "Instructor"}
            </p>
            <p className="mt-1 text-xs text-black">
              {instructor.bio ||
                "Instructor with real-world experience in this field."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
