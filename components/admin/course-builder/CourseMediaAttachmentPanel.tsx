'use client';

import AdvancedVideoUploader from '@/components/admin/video/AdvancedVideoUploader';
import { UploadCloud } from 'lucide-react';

export default function CourseMediaAttachmentPanel({ courseId }: { courseId: string }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
          <UploadCloud className="h-4 w-4" /> Direct media upload
        </div>
        <h2 className="mt-1 text-xl font-bold text-white">Upload + attach course video</h2>
        <p className="mt-1 text-sm text-slate-400">
          Preserves the Course Studio media uploader for operator-supplied video. AI video generation
          and production rendering remain separate capabilities.
        </p>
      </div>
      <div className="rounded-xl bg-white p-4 text-slate-900">
        <AdvancedVideoUploader courseId={courseId} />
      </div>
    </section>
  );
}
