import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Circle, Target, TrendingUp } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Skills Checklist | Apprentice Portal',
  description: 'Track your skill development and competencies.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeSkillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/skills');
  }

  // Get apprentice profile
  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('*, program:program_id(name)')
    .eq('user_id', user.id)
    .maybeSingle();

  // Get skill categories
  const { data: rawCategories } = await supabase
    .from('skill_categories')
    .select('*')
    .eq('program_id', apprentice?.program_id)
    .order('order', { ascending: true });

  // Get skills with progress (non-fatal if table missing)
  const { data: rawSkills } = await supabase
    .from('apprentice_skills')
    .select('*, progress:apprentice_skill_progress(*)')
    .eq('program_id', apprentice?.program_id);

  // Attach skills to their categories
  const skillCategories = (rawCategories || []).map((cat: any) => ({
    ...cat,
    skills: (rawSkills || []).filter((s: any) => s.category_id === cat.id),
  }));

  // Overall progress from apprentice_skill_progress
  const { data: progressSummary } = await supabase
    .from('apprentice_skill_progress')
    .select('*')
    .eq('apprentice_id', apprentice?.id);

  const totalSkills = progressSummary?.length || 0;
  const completedSkills = progressSummary?.filter((p: any) => p.status === 'completed').length || 0;
  const progressPercent = totalSkills > 0 ? (completedSkills / totalSkills) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-slate-500 flex-shrink-0">•</span>;
      case 'in-progress':
        return <TrendingUp className="w-5 h-5 text-brand-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-slate-700" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-brand-green-100 text-brand-green-700';
      case 'in-progress':
        return 'bg-brand-blue-100 text-brand-blue-700';
      default:
        return 'bg-white text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[{ label: 'Apprentice Portal', href: '/apprentice' }, { label: 'Skills' }]}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Skills Checklist</h1>
          <p className="text-slate-700">Track your skill development and competencies</p>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Overall Progress</h2>
            <span className="text-2xl font-bold text-brand-blue-600">
              {completedSkills} /{' '}
              {totalSkills ||
                skillCategories.reduce(
                  (sum: number, cat: any) => sum + (cat.skills?.length || 0),
                  0,
                )}{' '}
              skills
            </span>
          </div>
          <div className="bg-slate-200 rounded-full h-4 mb-2">
            <div
              className="bg-brand-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-slate-700">{progressPercent.toFixed(0)}% of skills completed</p>
        </div>

        {/* Skill Categories */}
        {skillCategories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-10 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Skills not yet assigned</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Your skill checklist will appear here once your instructor sets up your competency
              plan. Check back after your first session or contact your advisor.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {skillCategories.map((category: any, index: number) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-brand-blue-600" />
                    {category.name}
                  </h2>
                </div>
                <div className="divide-y">
                  {(category.skills ?? []).map((skill: any, skillIndex: number) => (
                    <div
                      key={skillIndex}
                      className="p-4 flex items-center justify-between hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(skill.status || skill.progress?.[0]?.status)}
                        <span className="font-medium">{skill.name}</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          skill.status || skill.progress?.[0]?.status || 'not-started',
                        )}`}
                      >
                        {(skill.status || skill.progress?.[0]?.status || 'not-started').replace(
                          '-',
                          ' ',
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">Status Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 flex-shrink-0">•</span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-blue-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-slate-700" />
              <span>Not Started</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
