import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Circle, Target, TrendingUp } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Skills Checklist | Apprentice Portal',
  description: 'Track your skill development and competencies.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeSkillsPage() {
  const supabase = await createClient();
  if (!supabase) { redirect("/login"); }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/skills');
  }

  // Get apprentice profile
  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('*, program:program_id(name)')
    .eq('user_id', user.id)
    .single();

  // Get skill categories and skills
  const { data: skillCategories } = await supabase
    .from('skill_categories')
    .select(`
      *,
      skills:apprentice_skills(
        *,
        progress:apprentice_skill_progress(*)
      )
    `)
    .eq('program_id', apprentice?.program_id)
    .order('order', { ascending: true });

  // Get overall progress
  const { data: progressSummary } = await supabase
    .from('apprentice_skill_progress')
    .select('*')
    .eq('apprentice_id', apprentice?.id);

  const totalSkills = progressSummary?.length || 0;
  const completedSkills = progressSummary?.filter((p: any) => p.status === 'completed').length || 0;
  const progressPercent = totalSkills > 0 ? (completedSkills / totalSkills) * 100 : 0;

  const defaultCategories = [
    {
      name: 'Safety & Compliance',
      skills: [
        { name: 'OSHA Safety Standards', status: 'completed' },
        { name: 'Personal Protective Equipment', status: 'completed' },
        { name: 'Emergency Procedures', status: 'in-progress' },
      ]
    },
    {
      name: 'Technical Skills',
      skills: [
        { name: 'Basic Tool Operation', status: 'completed' },
        { name: 'Equipment Maintenance', status: 'in-progress' },
        { name: 'Quality Control', status: 'not-started' },
      ]
    },
    {
      name: 'Professional Development',
      skills: [
        { name: 'Communication Skills', status: 'in-progress' },
        { name: 'Time Management', status: 'not-started' },
        { name: 'Customer Service', status: 'not-started' },
      ]
    },
  ];

  const displayCategories = skillCategories && skillCategories.length > 0 ? skillCategories : defaultCategories;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <TrendingUp className="w-5 h-5 text-brand-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-brand-blue-100 text-brand-blue-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Apprentice Portal', href: '/apprentice' },
          { label: 'Skills' },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Skills Checklist</h1>
          <p className="text-gray-600">Track your skill development and competencies</p>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Overall Progress</h2>
            <span className="text-2xl font-bold text-brand-blue-600">
              {completedSkills} / {totalSkills || displayCategories.reduce((sum: number, cat: any) => sum + (cat.skills?.length || 0), 0)} skills
            </span>
          </div>
          <div className="bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            {progressPercent.toFixed(0)}% of skills completed
          </p>
        </div>

        {/* Skill Categories */}
        <div className="space-y-6">
          {displayCategories.map((category: any, index: number) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-blue-600" />
                  {category.name}
                </h2>
              </div>
              <div className="divide-y">
                {category.skills?.map((skill: any, skillIndex: number) => (
                  <div key={skillIndex} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(skill.status || skill.progress?.[0]?.status)}
                      <span className="font-medium">{skill.name}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(skill.status || skill.progress?.[0]?.status || 'not-started')}`}>
                      {(skill.status || skill.progress?.[0]?.status || 'not-started').replace('-', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">Status Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-blue-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-gray-300" />
              <span>Not Started</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
