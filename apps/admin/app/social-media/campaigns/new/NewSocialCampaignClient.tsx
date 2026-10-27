'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Instagram,
  Loader2,
  Save,
  ShieldCheck,
  Video,
} from 'lucide-react';

interface Program {
  id: string;
  title: string;
  slug: string;
}
interface BlogSource {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
}
interface GeneratedPost {
  blogId: string;
  caption: string;
  reel: {
    hook: string;
    voiceover: string;
    scenes: Array<{ seconds: number; visual: string; overlay: string }>;
    hashtags: string[];
    cta: string;
  };
}

const destinations = [
  {
    id: 'facebook',
    name: 'Facebook Page',
    detail: 'Article link, approved image or Reel',
    icon: FileText,
  },
  {
    id: 'instagram',
    name: 'Instagram Business',
    detail: 'Approved image, carousel or Reel',
    icon: Instagram,
  },
] as const;

export default function NewSocialCampaignClient({
  programs = [],
  blogs = [],
}: {
  programs?: Program[];
  blogs?: BlogSource[];
}) {
  const router = useRouter();
  const [name, setName] = useState('Elevate weekly career update');
  const [program, setProgram] = useState('all');
  const [platforms, setPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [duration, setDuration] = useState('30');
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [selectedPreview, setSelectedPreview] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const plannedCount = useMemo(() => {
    const days = Math.max(1, Number(duration) || 1);
    return frequency === 'daily' ? Math.min(days, 90) : Math.min(Math.ceil(days / 7), 13);
  }, [duration, frequency]);

  const togglePlatform = (platform: string) => {
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  };

  const generateDrafts = async () => {
    if (!name.trim() || platforms.length === 0) return;
    setGenerating(true);
    try {
      const response = await fetch('/api/social-media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program, count: plannedCount, contentSource: 'blog' }),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error || 'Draft generation failed');
      setGeneratedPosts(result.posts ?? []);
      setSelectedPreview(0);
      toast.success(`${result.posts?.length ?? 0} approval-ready packages created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Draft generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/social-media/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contentSource: 'blog',
          platforms,
          frequency,
          times: ['09:00'],
          program,
          duration,
          status: 'draft',
          sourceBlogIds: generatedPosts.map((post) => post.blogId),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Campaign could not be saved');
      toast.success('Campaign saved as a draft');
      router.push('/social-media');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Campaign could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const preview = generatedPosts[selectedPreview];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,.35),_transparent_35%),linear-gradient(135deg,#020617,#0f172a)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/social-media"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-200 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Social operations
          </Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.25em] text-blue-300">
                Elevate editorial studio
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                Turn real Elevate stories into platform-ready content.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Use published articles and approved media to create captions, Reel scripts, scene
                directions and calls to action. Every external post stays in review until an
                administrator approves it.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <div className="flex items-center gap-3 text-emerald-200">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-bold">Safe production defaults</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Deterministic generation only. No GPU, paid AI, automatic activation or unapproved
                public publishing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)] lg:px-8">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">
                  1 · Campaign brief
                </p>
                <h2 className="mt-2 text-2xl font-black">Choose the story and cadence</h2>
              </div>
              <FileText className="h-8 w-8 text-blue-700" />
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-bold">Campaign name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label>
                <span className="text-sm font-bold">Program focus</span>
                <select
                  value={program}
                  onChange={(event) => setProgram(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                >
                  <option value="all">All Elevate programs</option>
                  {programs.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-bold">Cadence</span>
                <select
                  value={frequency}
                  onChange={(event) => setFrequency(event.target.value as 'daily' | 'weekly')}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                >
                  <option value="weekly">Weekly editorial post</option>
                  <option value="daily">Daily editorial post</option>
                </select>
              </label>
              <label>
                <span className="text-sm font-bold">Campaign length</span>
                <div className="relative mt-2">
                  <input
                    type="number"
                    min="7"
                    max="90"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-16"
                  />
                  <span className="absolute right-4 top-3 text-sm text-slate-500">days</span>
                </div>
              </label>
              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Available source library
                </p>
                <p className="mt-1 text-2xl font-black">{blogs.length}</p>
                <p className="text-sm text-slate-600">published, social-enabled articles</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 text-slate-950">
            <p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">
              2 · Destinations
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {destinations.map(({ id, name: destinationName, detail, icon: Icon }) => {
                const selected = platforms.includes(id);
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => togglePlatform(id)}
                    className={`rounded-2xl border-2 p-4 text-left transition ${selected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-400'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Icon
                        className={`h-6 w-6 ${selected ? 'text-blue-700' : 'text-slate-400'}`}
                      />
                      {selected && (
                        <span className="rounded-full bg-blue-700 p-1 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <p className="mt-4 font-black">{destinationName}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{detail}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-blue-300">
                  3 · Draft packages
                </p>
                <h2 className="mt-2 text-2xl font-black">Captions + Reel storyboards</h2>
              </div>
              <button
                onClick={generateDrafts}
                disabled={generating || !name.trim() || platforms.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black hover:bg-blue-500 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                {generating ? 'Building packages…' : `Build ${plannedCount} packages`}
              </button>
            </div>
            {generatedPosts.length ? (
              <div className="mt-6 space-y-2">
                {generatedPosts.map((post, index) => (
                  <button
                    key={`${post.blogId}-${index}`}
                    onClick={() => setSelectedPreview(index)}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left ${selectedPreview === index ? 'border-blue-400 bg-blue-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">{post.reel.hook}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {post.reel.scenes.length} scenes · deterministic Elevate template
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
                <Video className="mx-auto h-9 w-9 text-slate-500" />
                <p className="mt-3 font-bold">No drafts built yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  Packages use the newest approved articles from the Elevate blog.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="sticky top-6 rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-2.5">
                <ImageIcon className="h-5 w-5 text-violet-700" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-violet-700">
                  Editorial preview
                </p>
                <h2 className="font-black">
                  {preview ? preview.reel.hook : 'Select a draft package'}
                </h2>
              </div>
            </div>
            {preview ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl bg-slate-950 p-5 text-white">
                  <p className="whitespace-pre-line text-sm leading-6">{preview.caption}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Voiceover
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{preview.reel.voiceover}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Reel scenes
                  </p>
                  <ol className="mt-3 space-y-3">
                    {preview.reel.scenes.map((scene, index) => (
                      <li
                        key={`${scene.overlay}-${index}`}
                        className="grid grid-cols-[42px_1fr] gap-3"
                      >
                        <span className="rounded-lg bg-blue-100 px-2 py-2 text-center text-xs font-black text-blue-800">
                          {scene.seconds}s
                        </span>
                        <div>
                          <p className="text-sm font-bold">{scene.overlay}</p>
                          <p className="text-xs leading-5 text-slate-500">{scene.visual}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-slate-100 p-8 text-center text-sm text-slate-500">
                Build packages to preview the exact caption, voiceover and scene plan before
                approval.
              </div>
            )}
            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <CalendarClock className="h-4 w-4 text-blue-700" />
                {plannedCount} planned packages over {duration || 0} days
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Saving creates a campaign record only. Publishing remains blocked until each
                destination is connected and each post is approved.
              </p>
              <button
                onClick={saveDraft}
                disabled={saving || !name.trim() || platforms.length === 0}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save campaign draft
              </button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
