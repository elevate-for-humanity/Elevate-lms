'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Video,
  FileText,
  ClipboardCheck,
  Wrench,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Clock,
  Award,
  Shield,
  Users,
  ArrowLeft,
  Play,
} from 'lucide-react';
import type { CourseDefinition, CourseLesson, CourseModule } from '@/lib/courses/definitions';

/* ------------------------------------------------------------------ */
/*  LMS routing                                                        */
/* ------------------------------------------------------------------ */

const HVAC_COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';
const FIRST_LESSON_ID = '2f172cb2-4657-5460-9b93-f9b062ad8dd2';

/** All 94 lesson IDs from the seed migration, keyed by definition id */
const LESSON_UUID: Record<string, string> = {
  'hvac-01-01': '2f172cb2-4657-5460-9b93-f9b062ad8dd2',
  'hvac-01-02': '96576bf0-cbd5-581f-99aa-f36e48e694fd',
  'hvac-01-03': '5c5b516c-2e7c-5cae-8231-1f4483c1a912',
  'hvac-01-04': '4097148b-7a06-5784-9807-5e3470d4c091',
  'hvac-02-01': 'ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56',
  'hvac-02-02': 'fea2c0e6-ac93-518e-ae22-9528daa1ec3f',
  'hvac-02-03': 'f2878977-fe02-568e-afdf-7d6fcf67b375',
  'hvac-02-04': '317fd364-2d8c-5d5f-9ade-e096ec30ab26',
  'hvac-02-05': 'b38d2dfa-ad67-5664-98a1-f831d3d7ea07',
  'hvac-03-01': 'dba03432-fb85-5f6f-bc69-4cc785a7904a',
  'hvac-03-02': 'ba8f7e3f-af6b-50bc-9564-f2bb0b303349',
  'hvac-03-03': '598c6f54-1ea9-5e73-ac5b-f8e29a556110',
  'hvac-03-04': '1020f5bf-0d4f-5f87-b43b-da658cb24fab',
  'hvac-03-05': 'b23ca62f-295e-5c2c-aa00-783f16e91ed9',
  'hvac-04-01': 'baed04b3-35ae-51c7-a325-c678fbd0e725',
  'hvac-04-02': '9bfa7972-4169-5360-9b82-84aef75ce4d4',
  'hvac-04-03': 'b84ebdfa-ff58-53c2-96eb-5975e584cbc1',
  'hvac-04-04': '26bfd436-bfa9-587a-a98a-93a89ae0af22',
  'hvac-04-05': '9a82e78f-eb1c-5592-a013-c7fe58033531',
  'hvac-04-06': 'ca5df4d7-f2c4-5f91-aa9a-a4d9b2730c03',
  'hvac-05-01': '3b753cee-2a4f-5702-9661-23d48f475b7b',
  'hvac-05-02': 'cad2cb2e-8551-56ed-95ed-bfc0d6cb9c27',
  'hvac-05-03': '866b89da-dbff-58c5-9fd3-2d3c8ccffa4a',
  'hvac-05-04': '41d3a7f1-2d0d-5034-96d6-fa0f44b58182',
  'hvac-05-05': 'daf39e52-5588-5643-9638-3e990ddd4fda',
  'hvac-05-06': '8e4dbcd2-39b0-5bbc-a8eb-a7f880335a2c',
  'hvac-06-01': '785652db-1125-5e78-a1c9-de65f2aa331a',
  'hvac-06-02': 'e732905c-bd0a-5232-b019-9cd5c77273b7',
  'hvac-06-03': '6bbfccf1-ca8b-5167-b911-33780e89c4cc',
  'hvac-06-04': '3325947e-f78e-5157-94f1-bb4b466cc2e4',
  'hvac-06-05': '725fb861-b9ea-5e47-8de5-208923ed315a',
  'hvac-06-06': 'ad1bdab2-b5b3-525a-bcff-8baecc08a99f',
  'hvac-06-07': 'f9bba6db-e8f3-5abe-b1bf-7a193851bd7b',
  'hvac-06-08': '23fe3eb2-9acf-5deb-a5e1-ecfb100564f3',
  'hvac-07-01': '6116718a-264f-5d03-8e12-8b141debcd9d',
  'hvac-07-02': '4699611d-28a6-51ea-ad08-71715ef53a7b',
  'hvac-07-03': '597e92fe-4690-530f-839e-73099714e96e',
  'hvac-07-04': 'c858274b-b270-5362-9203-25ee6d79398a',
  'hvac-07-05': 'd0a9f517-8ed8-59ac-8ab0-4dc5c5b249a6',
  'hvac-08-01': '97b819f5-81ff-5e3a-a165-911b207121d5',
  'hvac-08-02': '6e675133-b0f8-5a85-ab4c-d0cf7bbf9f8e',
  'hvac-08-03': '380699d9-f6a0-5d7e-a09a-2b69bb4aff76',
  'hvac-08-04': '6fd12be2-26ff-5def-be3c-82af250b6441',
  'hvac-08-05': 'c0d9690c-2ba4-5c77-944f-83bc18d076a8',
  'hvac-08-06': '22f4cbd7-49ea-5fb4-99d0-5d70a9cb876c',
  'hvac-08-07': 'bdb91a6e-6f15-5f4c-bb28-fd7260525f57',
  'hvac-09-01': '68964a49-cfe1-5a4a-8e57-41a1dc3290e2',
  'hvac-09-02': '45de4da6-e35e-531f-bfc5-bc99501e7acd',
  'hvac-09-03': 'cffd498d-d142-59c7-ac7d-fda4bab63015',
  'hvac-09-04': 'bdde231a-d6e5-5ab6-9e59-1369423d23b0',
  'hvac-09-05': '29c86322-2428-55f6-b6b3-2c8044dfa00d',
  'hvac-09-06': '585091b8-0a4f-5074-9374-1b552d98c413',
  'hvac-10-01': '1482eb8f-9259-5f81-9871-50ba2998593d',
  'hvac-10-02': 'a5da3faf-794d-5829-b0e2-e327c2fa021f',
  'hvac-10-03': 'e17d20d8-9499-5e2b-b07a-ea14491a6872',
  'hvac-10-04': '89bf59f3-5aaa-5df2-83f3-5d32c91b5d83',
  'hvac-10-05': 'a59e3c1a-7b8e-5ddd-8bc0-17ec3cdf5c34',
  'hvac-10-06': 'b31efdba-26b4-56f0-8138-43822d35ae81',
  'hvac-10-07': 'efae33d2-641f-56bc-9ad2-784129db4516',
  'hvac-11-01': '0f05573b-f248-5a46-8089-fecbdb568ed9',
  'hvac-11-02': 'de9cc92e-d9cf-5e65-bc33-e6be44c0d0d2',
  'hvac-11-03': '14d196dc-5ed3-54c7-8ac7-5657ccc4abdf',
  'hvac-11-04': '09b1654c-b197-5edb-abc1-97b1481f5cd6',
  'hvac-11-05': '570baadf-be07-57b7-8d5b-bcb8f8c23dfe',
  'hvac-12-01': 'd14effbf-eb31-5686-aa9c-a83a6e4c9ce9',
  'hvac-12-02': '25fbe08b-6111-54ef-911c-d753dd71d748',
  'hvac-12-03': '42151711-0da4-5579-99e2-0fa907d88a5c',
  'hvac-12-04': '60d1c15b-56c9-59cd-bda0-cdb6c1490e55',
  'hvac-12-05': '15c1c957-28df-5cb2-bb8a-dd8f0792468f',
  'hvac-12-06': 'f5222938-3bf3-5cc8-8e5f-764043881d89',
  'hvac-13-01': '9b8de967-157d-5a9f-b3a5-f64ec6ca306d',
  'hvac-13-02': '3c9f427e-001c-557e-b777-eb488fbcea8a',
  'hvac-13-03': '7d0523bb-3662-5d4f-ba73-c7080059d8a2',
  'hvac-13-04': 'd574fdc2-314c-5f22-9c84-1e4658a93bf5',
  'hvac-13-05': '5d6a053f-0690-567a-93e3-2ca9642f04ac',
  'hvac-13-06': 'b1c254a5-4216-5700-a420-f9c114265fbd',
  'hvac-14-01': 'ce416471-0243-53cb-99af-8f4cb883c9f5',
  'hvac-14-02': '8677ede9-251e-5f3d-b7e6-677c1740bffd',
  'hvac-14-03': '90fadab8-d9ba-57d5-92e2-8ba2d8b7bb99',
  'hvac-14-04': '798b6baa-28aa-5a06-b981-c88312fa4b1d',
  'hvac-14-05': '23576f29-5103-59f8-ae9e-05e0a8013aee',
  'hvac-14-06': '58ff8848-0bcf-5a64-88b6-8c51dcd9057e',
  'hvac-14-07': 'e46831ad-a473-5d6a-b189-ae287ce02f42',
  'hvac-14-08': 'cacd86ff-f6f0-5919-918b-94ce7f37a621',
  'hvac-15-01': '93ae75c1-65e2-57cd-99a3-3a3f91cd5733',
  'hvac-15-02': '685318ed-cfd1-5381-b546-4cdeec132928',
  'hvac-15-03': '30d609ca-1605-57ab-8864-8d81fc9f5707',
  'hvac-15-04': 'b7d10a5e-6896-524f-847c-f6e9978b144b',
  'hvac-15-05': 'a7af0014-c14c-53c3-84df-cd3c0398e017',
  'hvac-16-01': '15d76752-0478-53f3-85c5-31c201cc9b09',
  'hvac-16-02': '8c59f3f2-0ef4-5db2-a9fb-4ed571ae4d05',
  'hvac-16-03': '40da8479-1a3a-560c-bfce-16937d1b94db',
  'hvac-16-04': 'b9bceecd-9ea5-5665-90e7-d5e01b3f7c7c',
  'hvac-16-05': 'ec1cbfea-55f5-5083-9a28-8d59248b676a',
};

/** Module-first-lesson mapping for all 16 modules */
const MODULE_FIRST_LESSON: Record<string, string> = {
  'hvac-01': '2f172cb2-4657-5460-9b93-f9b062ad8dd2',
  'hvac-02': 'ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56',
  'hvac-03': 'dba03432-fb85-5f6f-bc69-4cc785a7904a',
  'hvac-04': 'baed04b3-35ae-51c7-a325-c678fbd0e725',
  'hvac-05': '3b753cee-2a4f-5702-9661-23d48f475b7b',
  'hvac-06': '785652db-1125-5e78-a1c9-de65f2aa331a',
  'hvac-07': '6116718a-264f-5d03-8e12-8b141debcd9d',
  'hvac-08': '97b819f5-81ff-5e3a-a165-911b207121d5',
  'hvac-09': '68964a49-cfe1-5a4a-8e57-41a1dc3290e2',
  'hvac-10': '1482eb8f-9259-5f81-9871-50ba2998593d',
  'hvac-11': '0f05573b-f248-5a46-8089-fecbdb568ed9',
  'hvac-12': 'd14effbf-eb31-5686-aa9c-a83a6e4c9ce9',
  'hvac-13': '9b8de967-157d-5a9f-b3a5-f64ec6ca306d',
  'hvac-14': 'ce416471-0243-53cb-99af-8f4cb883c9f5',
  'hvac-15': '93ae75c1-65e2-57cd-99a3-3a3f91cd5733',
  'hvac-16': '15d76752-0478-53f3-85c5-31c201cc9b09',
};

function lessonUrl(lessonId: string) {
  return `/courses/${HVAC_COURSE_ID}/lessons/${lessonId}`;
}

function lessonUrlById(definitionId: string) {
  const uuid = LESSON_UUID[definitionId];
  if (uuid) return lessonUrl(uuid);
  // Fallback: route to module's first lesson
  const moduleId = definitionId.replace(/-\d+$/, '');
  return lessonUrl(MODULE_FIRST_LESSON[moduleId] || FIRST_LESSON_ID);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const LESSON_ICONS: Record<CourseLesson['type'], React.ElementType> = {
  video: Video,
  reading: FileText,
  quiz: ClipboardCheck,
  assignment: Wrench,
  lab: FlaskConical,
};

const LESSON_LABELS: Record<CourseLesson['type'], string> = {
  video: 'Video',
  reading: 'Reading',
  quiz: 'Quiz',
  assignment: 'Assignment',
  lab: 'Hands-On Lab',
};

function totalLessons(modules: CourseModule[]) {
  return modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

function totalMinutes(modules: CourseModule[]) {
  return modules.reduce(
    (sum, m) =>
      sum + m.lessons.reduce((ls, l) => ls + (l.durationMinutes ?? 0), 0),
    0,
  );
}

/* ------------------------------------------------------------------ */
/*  Module Accordion                                                   */
/* ------------------------------------------------------------------ */

function ModuleAccordion({
  module,
  index,
  isOpen,
  onToggle,
}: {
  module: CourseModule;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const moduleMins = module.lessons.reduce(
    (s, l) => s + (l.durationMinutes ?? 0),
    0,
  );
  const firstLessonId = MODULE_FIRST_LESSON[module.id];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center text-sm font-semibold">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {module.title}
            </p>
            <p className="text-sm text-gray-500">
              {module.lessons.length} lesson{module.lessons.length !== 1 && 's'}
              {moduleMins > 0 && <> &middot; {moduleMins} min</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {firstLessonId && (
            <Link
              href={lessonUrl(firstLessonId)}
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-colors"
            >
              <Play className="w-3 h-3" />
              Start
            </Link>
          )}
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50 divide-y divide-gray-100">
          {module.lessons.map((lesson) => {
            const Icon = LESSON_ICONS[lesson.type];

            return (
              <Link
                key={lesson.id}
                href={lessonUrlById(lesson.id)}
                className="flex items-start gap-3 px-5 py-3 hover:bg-brand-blue-50 transition-colors group"
              >
                <Icon className="w-4 h-4 mt-0.5 text-brand-blue-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-brand-blue-700">
                    {lesson.title}
                  </p>
                  {lesson.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {lesson.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                    {LESSON_LABELS[lesson.type]}
                  </span>
                  {lesson.durationMinutes && (
                    <span className="text-xs text-gray-400">
                      {lesson.durationMinutes}m
                    </span>
                  )}
                  <Play className="w-3.5 h-3.5 text-brand-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function HvacCourseViewer({
  course,
  isAuthenticated = false,
  userName = null,
  enrollmentStatus = 'not-enrolled',
  enrollmentData = null,
  completedLessonIds = [],
  progressPercent = 0,
  lastLessonId = null,
  lastLessonTitle = null,
  totalTimeSeconds = 0,
}: {
  course: CourseDefinition;
  isAuthenticated?: boolean;
  userName?: string | null;
  enrollmentStatus?: 'not-enrolled' | 'enrolled' | 'in-progress' | 'completed';
  enrollmentData?: any;
  completedLessonIds?: string[];
  progressPercent?: number;
  lastLessonId?: string | null;
  lastLessonTitle?: string | null;
  totalTimeSeconds?: number;
}) {
  const [openModules, setOpenModules] = useState<Set<number>>(
    () => new Set([0]),
  );

  const toggle = (idx: number) =>
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  const expandAll = () =>
    setOpenModules(new Set(course.modules.map((_, i) => i)));
  const collapseAll = () => setOpenModules(new Set());

  const lessons = totalLessons(course.modules);
  const mins = totalMinutes(course.modules);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gray-900 text-white">
        <Image
          src="/images/trades/hero-program-hvac.jpg"
          alt="HVAC technician working on a commercial unit"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24">
          <Link
            href="/programs/hvac-technician"
            className="inline-flex items-center gap-1 text-sm text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to HVAC Program
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {course.title}
          </h1>
          <p className="mt-3 text-lg text-gray-300 max-w-2xl">
            {course.subtitle}
          </p>

          {/* Enrollment Status + Smart CTA */}
          {isAuthenticated && enrollmentStatus !== 'not-enrolled' && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                enrollmentStatus === 'completed'
                  ? 'bg-brand-green-500/20 text-brand-green-300 border border-brand-green-400/30'
                  : enrollmentStatus === 'in-progress'
                    ? 'bg-brand-blue-500/20 text-brand-blue-300 border border-brand-blue-400/30'
                    : 'bg-white/10 text-white border border-white/20'
              }`}>
                {enrollmentStatus === 'completed' ? 'Completed' : enrollmentStatus === 'in-progress' ? 'In Progress' : 'Enrolled'}
              </span>
              {progressPercent > 0 && (
                <span className="text-sm text-gray-300">{progressPercent}% complete</span>
              )}
              {totalTimeSeconds > 0 && (
                <span className="text-sm text-gray-400">
                  {Math.round(totalTimeSeconds / 3600)}h {Math.round((totalTimeSeconds % 3600) / 60)}m logged
                </span>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {isAuthenticated && progressPercent > 0 && (
            <div className="mt-4 max-w-md">
              <div className="w-full bg-white/10 rounded-full h-2.5">
                <div
                  className="bg-brand-green-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {completedLessonIds.length} of {totalLessons(course.modules)} lessons completed
              </p>
            </div>
          )}

          {/* Dynamic CTA based on enrollment state */}
          <div className="mt-6 flex flex-wrap gap-3">
            {enrollmentStatus === 'in-progress' && lastLessonId ? (
              <Link
                href={lessonUrl(lastLessonId)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition-colors"
              >
                <Play className="w-5 h-5" />
                Resume Learning
              </Link>
            ) : enrollmentStatus === 'completed' ? (
              <Link
                href="/credentials"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition-colors"
              >
                <Award className="w-5 h-5" />
                View Certificate
              </Link>
            ) : enrollmentStatus === 'enrolled' ? (
              <Link
                href={lessonUrl(FIRST_LESSON_ID)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Course
              </Link>
            ) : (
              <Link
                href="/programs/hvac-technician/apply"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                Apply for Enrollment
              </Link>
            )}

            {enrollmentStatus === 'in-progress' && lastLessonTitle && (
              <span className="text-sm text-gray-400 self-center">
                Last: {lastLessonTitle}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-blue-400" />
              <span>
                {course.modules.length} modules &middot; {lessons} lessons
              </span>
            </div>
            {mins > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-blue-400" />
                <span>
                  ~{Math.round(mins / 60)} hr {mins % 60} min estimated
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-blue-400" />
              <span>{course.modality}</span>
            </div>
            {course.secondChanceFriendly && (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Second-Chance Friendly</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-blue-400" />
              <span>{course.partner}</span>
            </div>
          </div>

          {/* Workforce tags */}
          {course.workforceTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {course.workforceTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/10 border border-white/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Outcomes */}
      {course.outcomes.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            What You Will Achieve
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {course.outcomes.map((outcome, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <Award className="w-4 h-4 mt-0.5 text-brand-blue-500 flex-shrink-0" />
                {outcome}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Curriculum */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Course Curriculum</h2>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {course.modules.map((mod, idx) => (
            <ModuleAccordion
              key={mod.id}
              module={mod}
              index={idx}
              isOpen={openModules.has(idx)}
              onToggle={() => toggle(idx)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          {enrollmentStatus === 'in-progress' && lastLessonId ? (
            <Link
              href={lessonUrl(lastLessonId)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white font-semibold rounded-lg hover:bg-brand-green-700 transition-colors"
            >
              <Play className="w-5 h-5" />
              Resume Learning
            </Link>
          ) : enrollmentStatus === 'enrolled' ? (
            <Link
              href={lessonUrl(FIRST_LESSON_ID)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Course
            </Link>
          ) : enrollmentStatus === 'not-enrolled' ? (
            <Link
              href="/programs/hvac-technician/apply"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Apply for Enrollment
            </Link>
          ) : null}
          <p className="mt-3 text-sm text-gray-500">
            Approved for workforce-funded participants. Training hours tracked for WIOA compliance reporting.
          </p>
        </div>

        {/* Workforce Compliance Language */}
        <div className="mt-8 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-5">
          <h3 className="font-bold text-brand-blue-900 text-sm mb-2">Workforce Training Compliance</h3>
          <ul className="space-y-1 text-sm text-brand-blue-700">
            <li>• Training hours tracked and reported for workforce partner documentation</li>
            <li>• Case manager progress reporting available upon request</li>
            <li>• Measurable skill gains tracked per WIOA performance standards</li>
            <li>• Completion milestones aligned with credential attainment</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
