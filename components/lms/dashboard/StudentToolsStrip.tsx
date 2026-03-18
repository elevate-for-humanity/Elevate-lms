import Link from 'next/link';
import { BookOpen, CheckCircle, Headphones, Users, FileText, Calendar } from 'lucide-react';

const TOOLS = [
  { icon: BookOpen,    label: 'Study Guides',    href: '/lms/resources' },
  { icon: CheckCircle, label: 'Practice Exams',  href: '/lms/quizzes' },
  { icon: Headphones,  label: 'AI Tutor',        href: '/lms/ai-tutor' },
  { icon: Users,       label: 'Community',       href: '/lms/community' },
  { icon: FileText,    label: 'Certificates',    href: '/lms/certificates' },
  { icon: Calendar,    label: 'Schedule',        href: '/lms/schedule' },
];

export function StudentToolsStrip() {
  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-black mb-4">Student Tools</h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.label}
              href={t.href}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm transition group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-slate-900 flex items-center justify-center transition">
                <Icon className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
              </div>
              <span className="text-xs font-semibold text-slate-900 text-center leading-tight">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
