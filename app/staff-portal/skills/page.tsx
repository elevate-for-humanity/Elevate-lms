import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Circle, Star, BookOpen, Award, ChevronRight, TrendingUp } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Staff Skills | Elevate For Humanity',
  description: 'Track and develop your professional skills.',
  robots: { index: false, follow: false },
};

// Static skill categories — seeded here since skills_checklist table is empty
const SKILL_CATEGORIES = [
  {
    id: 'platform',
    title: 'Platform & Systems',
    icon: BookOpen,
    color: 'brand-blue',
    skills: [
      { id: 'lms-navigation', label: 'Navigate the LMS (courses, lessons, quizzes)' },
      { id: 'student-enrollment', label: 'Enroll and manage students in programs' },
      { id: 'attendance-tracking', label: 'Record and export attendance' },
      { id: 'progress-reports', label: 'Generate student progress reports' },
      { id: 'document-upload', label: 'Upload and manage student documents' },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance & FERPA',
    icon: Award,
    color: 'brand-red',
    skills: [
      { id: 'ferpa-basics', label: 'Understand FERPA student privacy requirements' },
      { id: 'wioa-eligibility', label: 'Verify WIOA eligibility documentation' },
      { id: 'grievance-process', label: 'Handle student grievances per policy' },
      { id: 'incident-reporting', label: 'Report workplace incidents within 24 hours' },
      { id: 'data-handling', label: 'Handle PII data per security policy' },
    ],
  },
  {
    id: 'student-support',
    title: 'Student Support',
    icon: Star,
    color: 'brand-orange',
    skills: [
      { id: 'intake-interview', label: 'Conduct student intake interviews' },
      { id: 'barrier-assessment', label: 'Identify and document student barriers' },
      { id: 'referral-process', label: 'Make appropriate community referrals' },
      { id: 'case-notes', label: 'Write clear, professional case notes' },
      { id: 'crisis-response', label: 'Respond to student crisis situations' },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    icon: TrendingUp,
    color: 'brand-green',
    skills: [
      { id: 'email-professional', label: 'Write professional emails to students and partners' },
      { id: 'zoom-facilitation', label: 'Facilitate Zoom meetings and orientations' },
      { id: 'employer-outreach', label: 'Conduct employer outreach and follow-up' },
      { id: 'conflict-resolution', label: 'De-escalate and resolve conflicts' },
      { id: 'public-speaking', label: 'Present to groups of 10+ people' },
    ],
  },
];

export default async function StaffSkillsPage() {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/staff-portal/skills');

  // Fetch completed skills for this user
  const { data: userSkills } = await db
    .from('user_skills')
    .select('skill_name, verified, verified_at')
    .eq('user_id', user.id);

  const completedIds = new Set((userSkills ?? []).map((s: any) => s.skill_name));
  const verifiedIds = new Set((userSkills ?? []).filter((s: any) => s.verified).map((s: any) => s.skill_name));

  const totalSkills = SKILL_CATEGORIES.reduce((s, c) => s + c.skills.length, 0);
  const completedCount = SKILL_CATEGORIES.reduce((s, c) =>
    s + c.skills.filter(sk => completedIds.has(sk.id)).length, 0);
  const pct = totalSkills > 0 ? Math.round((completedCount / totalSkills) * 100) : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal', href: '/staff-portal' }, { label: 'Skills' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white text-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-1">Staff Skills Checklist</h1>
          <p className="text-slate-400 text-sm mb-6">Track your professional development and competencies</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white rounded-full h-3">
              <div className="bg-white h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-bold text-brand-green-400 w-16 text-right">{completedCount}/{totalSkills}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{pct}% complete</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {SKILL_CATEGORIES.map(cat => {
          const catCompleted = cat.skills.filter(s => completedIds.has(s.id)).length;
          return (
            <div key={cat.id} className="bg-white rounded-xl border overflow-hidden">
              <div className="px-6 py-4 border-b bg-white flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg bg-${cat.color}-100 flex items-center justify-center`}>
                  <cat.icon className={`w-5 h-5 text-${cat.color}-600`} />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-slate-900">{cat.title}</h2>
                  <p className="text-xs text-slate-400">{catCompleted}/{cat.skills.length} completed</p>
                </div>
                <div className="w-24 bg-slate-200 rounded-full h-1.5">
                  <div className={`bg-${cat.color}-500 h-1.5 rounded-full`}
                    style={{ width: `${cat.skills.length > 0 ? (catCompleted / cat.skills.length) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="divide-y">
                {cat.skills.map(skill => {
                  const done = completedIds.has(skill.id);
                  const verified = verifiedIds.has(skill.id);
                  return (
                    <div key={skill.id} className="px-6 py-3.5 flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        done ? 'bg-brand-green-100' : 'bg-white'
                      }`}>
                        {done
                          ? <CheckCircle className="w-4 h-4 text-brand-green-600" />
                          : <Circle className="w-4 h-4 text-slate-300" />}
                      </div>
                      <span className={`flex-1 text-sm ${done ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {skill.label}
                      </span>
                      {verified && (
                        <span className="text-xs bg-brand-blue-100 text-brand-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Verified
                        </span>
                      )}
                      {!done && (
                        <MarkSkillButton skillId={skill.id} userId={user.id} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* CTA */}
        <div className="bg-white rounded-xl p-6 text-white text-center">
          <Award className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <h3 className="font-bold text-lg mb-1">Skills Verified by Supervisor?</h3>
          <p className="text-brand-blue-100 text-sm mb-4">Ask your manager to verify your completed skills in the admin portal.</p>
          <Link href="/staff-portal/training"
            className="inline-flex items-center gap-2 bg-white text-brand-blue-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-blue-50">
            View Training Resources <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Server-side mark skill button — uses a form action
function MarkSkillButton({ skillId, userId }: { skillId: string; userId: string }) {
  return (
    <form action={`/api/staff/skills/${skillId}/complete`} method="POST">
      <input type="hidden" name="userId" value={userId} />
      <button type="submit"
        className="text-xs text-brand-blue-600 hover:text-brand-blue-800 font-medium border border-brand-blue-200 px-2.5 py-1 rounded-lg hover:bg-brand-blue-50 transition">
        Mark Done
      </button>
    </form>
  );
}
