import Image from 'next/image';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import VideoUploadClient from './VideoUploadClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://admin.elevateforhumanity.org/videos/upload' },
  title: 'Upload Videos | Elevate For Humanity',
  description: 'Upload verified production video content for the public library or course lessons.',
};

export default async function UploadVideosPage() {
  await requireRole(['admin']);

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image
          src="/images/pages/admin-videos-upload-hero.webp"
          alt="Upload production videos"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <nav className="mb-4 text-sm">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li><Link href="/" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/videos" className="hover:text-primary">Videos</Link></li>
              <li>/</li>
              <li className="font-medium text-slate-900">Upload</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Upload Production Video</h1>
          <p className="mt-2 text-slate-700">
            Public videos are published only after a real playable file is stored. Course and lesson videos are stored privately and returned through signed playback URLs.
          </p>
        </div>
        <VideoUploadClient />
      </div>
    </div>
  );
}
