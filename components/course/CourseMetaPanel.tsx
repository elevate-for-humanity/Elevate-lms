import Image from 'next/image';

type CourseMetaPanelProps = {
  course: {
    id: string;
    title: string;
    summary?: string | null;
    description?: string | null;
    difficulty?: string | null;
    category?: string | null;
    duration_hours?: number | null;
    learning_outcomes?: string[] | null;
    skills?: string[] | null;
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

export function CourseMetaPanel({
  course,
  instructor,
  averageRating,
  ratingCount,
  enrollmentCount,
}: CourseMetaPanelProps) {
  return (
    <div className="space-y-6 rounded-xl border bg-white p-5 shadow-sm">
      {/* Top badges / rating */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {course.difficulty && (
          <span className="rounded-full bg-brand-red-50 px-3 py-2 font-semibold text-brand-red-700">
            {course.difficulty}
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
        {course.duration_hours && course.duration_hours > 0 && (
          <span className="rounded-full bg-slate-100 px-3 py-2 font-semibold text-black">
            ~{course.duration_hours} hours
          </span>
        )}
      </div>

      {/* What you'll learn */}
      {course.learning_outcomes && course.learning_outcomes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">What you&apos;ll learn</h3>
          <ul className="mt-2 grid gap-2 text-xs text-black md:grid-cols-2">
            {course.learning_outcomes.map((item, idx) => (
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
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold">
              {(instructor.full_name || "EFH")
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {instructor.full_name || "Elevate For Humanity Instructor"}
            </p>
            {instructor.bio && (
              <p className="line-clamp-3 text-xs text-black">
                {instructor.bio}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
