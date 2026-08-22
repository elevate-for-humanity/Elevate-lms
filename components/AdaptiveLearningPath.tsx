'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Course = {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  recommended: boolean;
  matchScore: number;
  prerequisites: string[];
  skills: string[];
};

type LearningPath = {
  id: string;
  name: string;
  description: string;
  courses: Course[];
  totalDuration: string;
  matchScore: number;
};

function calculateMatchScore(path: any, skills: any[]) {
  if (!skills?.length) return 0;
  const pathSkills: string[] = path.skills ?? path.required_skills ?? [];
  if (!pathSkills.length) return 0;
  const userSkills = new Set(
    skills.map((skill: any) => skill.skill_name ?? skill.skill_id ?? skill.id ?? skill),
  );
  return Math.round(
    (pathSkills.filter((skill) => userSkills.has(skill)).length / pathSkills.length) * 100,
  );
}

export function AdaptiveLearningPath() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function loadPaths() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data: skills } = user
          ? await supabase
              .from('user_skills')
              .select('skill_name, proficiency_level')
              .eq('user_id', user.id)
          : { data: [] as any[] };

        const { data: paths, error } = await supabase
          .from('learning_paths')
          .select('*, learning_path_courses(*, training_programs(*))')
          .eq('is_active', true);

        if (error) throw error;

        setLearningPaths(
          (paths ?? []).map((path: any) => ({
            id: path.id,
            name: path.name,
            description: path.description || '',
            totalDuration: path.total_duration || 'Duration varies',
            matchScore: calculateMatchScore(path, skills || []),
            courses: (path.learning_path_courses || []).map((entry: any) => ({
              id: entry.id,
              title: entry.training_programs?.name || entry.course_name || 'Course',
              difficulty: entry.difficulty || 'intermediate',
              duration: entry.duration || 'Schedule varies',
              recommended: Boolean(entry.recommended ?? true),
              matchScore: Number(entry.match_score ?? 0),
              prerequisites: entry.prerequisites || [],
              skills: entry.skills || [],
            })),
          })),
        );
      } catch (error) {
        logger.error('Error loading adaptive paths', error);
        setLoadError(true);
        setLearningPaths([]);
      } finally {
        setLoading(false);
      }
    }

    void loadPaths();
  }, []);

  async function enrollInPath(pathId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('user_learning_paths').insert({
      user_id: user.id,
      learning_path_id: pathId,
      started_at: new Date().toISOString(),
      status: 'active',
    });

    if (error) {
      logger.error('Unable to start learning path', error);
      return;
    }

    setSelectedPath(pathId);
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-600">Loading learning paths…</div>;
  }

  if (loadError) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-950">Learning paths are temporarily unavailable</h2>
        <p className="mt-2 text-slate-700">
          Your course access is not affected. Personalized recommendations will return when the
          learning-path service is available.
        </p>
      </Card>
    );
  }

  if (learningPaths.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-950">No personalized path is ready yet</h2>
        <p className="mt-2 text-slate-700">
          Recommendations will appear here after an active learning path has been configured from
          real program and skill data.
        </p>
      </Card>
    );
  }

  const selected = learningPaths.find((path) => path.id === selectedPath) ?? null;

  return (
    <section className="bg-white" aria-labelledby="adaptive-paths-heading">
      <div className="mb-6">
        <h2 id="adaptive-paths-heading" className="text-2xl font-bold text-slate-950">
          Personalized learning paths
        </h2>
        <p className="mt-2 text-slate-700">
          Recommendations are based on configured training paths and the skills recorded in your
          learner profile.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {learningPaths.map((path) => (
          <Card
            key={path.id}
            className={`p-6 ${selectedPath === path.id ? 'ring-2 ring-brand-orange-500' : ''}`}
          >
            <div className="flex justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold">{path.name}</h3>
                <p className="mt-2 text-slate-700">{path.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-orange-600">{path.matchScore}%</p>
                <p className="text-xs text-slate-600">Skill match</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              {path.courses.length} courses · {path.totalDuration}
            </p>

            <div className="mt-4 space-y-2">
              {path.courses.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-900">{course.title}</span>
                  <span className="text-slate-600">{course.difficulty}</span>
                </div>
              ))}
            </div>

            <Button className="mt-4 w-full" onClick={() => setSelectedPath(path.id)}>
              {selectedPath === path.id ? 'Selected' : 'Review Path'}
            </Button>
          </Card>
        ))}
      </div>

      {selected ? (
        <Card className="mt-8 p-6">
          <h2 className="text-2xl font-bold">Course sequence: {selected.name}</h2>
          <div className="mt-6 space-y-4">
            {selected.courses.map((course, index) => (
              <div key={course.id} className="rounded-xl bg-slate-50 p-4">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-brand-blue-700">Step {index + 1}</p>
                    <h3 className="text-lg font-bold">{course.title}</h3>
                    <p className="text-sm text-slate-600">{course.duration}</p>
                  </div>
                  {course.matchScore > 0 ? (
                    <p className="font-bold text-brand-orange-600">{course.matchScore}% match</p>
                  ) : null}
                </div>
                {course.prerequisites.length ? (
                  <p className="mt-3 text-xs text-slate-600">
                    Prerequisites: {course.prerequisites.join(', ')}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {course.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-6 w-full" onClick={() => void enrollInPath(selected.id)}>
            Start Learning Path
          </Button>
        </Card>
      ) : null}
    </section>
  );
}

export default AdaptiveLearningPath;
