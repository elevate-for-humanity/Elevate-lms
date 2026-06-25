import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import NewLearningPathClient from './NewLearningPathClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'New Learning Path | Admin | Elevate For Humanity' };

export default async function NewLearningPathPage() {
  await requireRole(['admin', 'staff']);
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
        <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/admin/learning-paths" className="hover:text-slate-700">Learning Paths</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 font-medium">New</span>
      </nav>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">New Learning Path</h1>
      <NewLearningPathClient />
    </div>
  );
}
