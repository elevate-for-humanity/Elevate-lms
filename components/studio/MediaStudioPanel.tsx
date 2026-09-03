'use client';

import {
  FolderOpen,
  ImageIcon,
  Layers3,
  Loader2,
  Mic2,
  MonitorPlay,
  Play,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Video,
  Volume2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

interface MediaAsset {
  id: string;
  org_id: string;
  storage_path: string;
  type: 'video' | 'audio' | 'image' | 'document' | 'other';
  mime_type?: string | null;
  duration_seconds?: number | null;
  title?: string | null;
  transcript?: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

interface MediaResponse {
  ok: boolean;
  assets?: MediaAsset[];
  pagination?: { total: number; limit: number; offset: number };
  error?: { message?: string } | string;
}

type StudioTab = 'create' | 'projects' | 'library';
type CreatorMode = 'image' | 'commercial' | 'voice' | 'hero';

type CommercialPlan = {
  title: string;
  hook: string;
  finalCta: string;
  scenes: Array<{
    id: string;
    title: string;
    narration: string;
    onScreenText: string;
    visualQuery: string;
    visualPrompt: string;
    durationSeconds: number;
  }>;
};

function assetUrl(asset: MediaAsset) {
  const value = asset.metadata?.public_url;
  return typeof value === 'string' ? value : '';
}

function projectName(asset: MediaAsset) {
  const value = asset.metadata?.project_name;
  return typeof value === 'string' && value.trim() ? value : 'Unsorted';
}

function errorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const value = (payload as { error?: unknown }).error;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'message' in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return fallback;
}

function AssetPreview({ asset, className = '' }: { asset: MediaAsset; className?: string }) {
  const url = assetUrl(asset);
  if (!url) {
    return (
      <div className={`grid place-items-center bg-slate-100 text-slate-400 ${className}`}>
        {asset.type === 'video' ? <Video className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
      </div>
    );
  }
  if (asset.type === 'video') {
    return <video src={url} controls preload="metadata" className={`h-full w-full object-cover ${className}`} />;
  }
  if (asset.type === 'audio') {
    return <audio src={url} controls preload="none" className="w-full" />;
  }
  if (asset.type === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={asset.title || 'Media asset'} className={`h-full w-full object-cover ${className}`} />;
  }
  return <div className={`grid place-items-center bg-slate-100 text-sm text-slate-500 ${className}`}>File</div>;
}

export default function MediaStudioPanel() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [tab, setTab] = useState<StudioTab>('create');
  const [mode, setMode] = useState<CreatorMode>('commercial');

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search.trim()) params.set('search', search.trim());
      if (type) params.set('type', type);
      const response = await fetch(`/api/admin/media-assets?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = (await response.json()) as MediaResponse;
      if (!response.ok || !payload.ok) throw new Error(errorMessage(payload, 'Unable to load media assets.'));
      setAssets(payload.assets ?? []);
    } catch (cause) {
      setAssets([]);
      setError(cause instanceof Error ? cause.message : 'Unable to load media assets.');
    } finally {
      setLoading(false);
    }
  }, [search, type]);

  useEffect(() => { void loadAssets(); }, [loadAssets]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested === 'create' || requested === 'projects' || requested === 'library') {
      setTab(requested);
    }
  }, []);

  const projects = useMemo(() => {
    const grouped = new Map<string, MediaAsset[]>();
    for (const asset of assets) {
      const name = projectName(asset);
      grouped.set(name, [...(grouped.get(name) ?? []), asset]);
    }
    return [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [assets]);

  const audioAssets = assets.filter((asset) => asset.type === 'audio' && assetUrl(asset));
  const heroAssets = assets.filter((asset) => ['image', 'video'].includes(asset.type) && assetUrl(asset));

  return (
    <section className="min-h-full bg-gradient-to-b from-cyan-50 via-white to-rose-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-red-700">PARIS Media Studio</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Create the media, then use the same asset everywhere.</h1>
            <p className="mt-1 max-w-3xl text-sm font-medium text-slate-600">
              AI images, commercial storyboards, narrated video, hero treatments, projects and the organization media library share one canonical asset registry.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAssets()}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh library
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Media Studio sections">
          {([
            ['create', 'Create', Sparkles],
            ['projects', 'Projects', FolderOpen],
            ['library', 'Library', Layers3],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition ${tab === id ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>

        {notice ? <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{notice}</div> : null}
        {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</div> : null}

        {tab === 'create' ? (
          <CreateStudio
            mode={mode}
            setMode={setMode}
            assets={assets}
            audioAssets={audioAssets}
            heroAssets={heroAssets}
            onSaved={async (message) => {
              setNotice(message);
              setError('');
              await loadAssets();
            }}
            onError={(message) => {
              setError(message);
              setNotice('');
            }}
          />
        ) : null}

        {tab === 'projects' ? <ProjectsView projects={projects} /> : null}
        {tab === 'library' ? (
          <LibraryView
            assets={assets}
            loading={loading}
            search={search}
            setSearch={setSearch}
            type={type}
            setType={setType}
          />
        ) : null}
      </div>
    </section>
  );
}

function CreateStudio({
  mode,
  setMode,
  assets,
  audioAssets,
  heroAssets,
  onSaved,
  onError,
}: {
  mode: CreatorMode;
  setMode: (mode: CreatorMode) => void;
  assets: MediaAsset[];
  audioAssets: MediaAsset[];
  heroAssets: MediaAsset[];
  onSaved: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <p className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Create</p>
        {([
          ['commercial', 'Commercial video', MonitorPlay],
          ['image', 'AI image', ImageIcon],
          ['voice', 'Voiceover', Mic2],
          ['hero', 'Hero treatment', Sparkles],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-black ${mode === id ? 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </aside>

      <div>
        {mode === 'commercial' ? <CommercialCreator audioAssets={audioAssets} onSaved={onSaved} onError={onError} /> : null}
        {mode === 'image' ? <ImageCreator onSaved={onSaved} onError={onError} /> : null}
        {mode === 'voice' ? <VoiceCreator /> : null}
        {mode === 'hero' ? <HeroCreator assets={heroAssets} onSaved={onSaved} onError={onError} /> : null}
        {assets.length === 0 ? <p className="mt-4 text-xs font-semibold text-slate-500">Generated assets will appear in Projects and Library after they are saved.</p> : null}
      </div>
    </div>
  );
}

function ImageCreator({ onSaved, onError }: { onSaved: (message: string) => Promise<void>; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [projectName, setProjectName] = useState('Website Media');
  const [title, setTitle] = useState('Bright website hero');
  const [prompt, setPrompt] = useState('Bright professional commercial photograph with authentic people, natural daylight, clear subject separation, room for website copy, polished but realistic, no text in the image.');
  const [size, setSize] = useState('1792x1024');
  const [style, setStyle] = useState('natural');
  const [usage, setUsage] = useState('hero');
  const [preview, setPreview] = useState('');

  async function generate() {
    setBusy(true);
    try {
      const response = await fetch('/api/admin/media-studio/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, title, prompt, size, style, usage }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(errorMessage(payload, 'Image generation failed.'));
      setPreview(payload.publicUrl || '');
      await onSaved('Image generated and saved to the organization Media Library.');
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Image generation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-red-700">AI Image</p>
        <h2 className="mt-2 text-2xl font-black">Generate a reusable production asset.</h2>
        <div className="mt-5 grid gap-4">
          <TextField label="Project" value={projectName} onChange={setProjectName} />
          <TextField label="Asset title" value={title} onChange={setTitle} />
          <TextArea label="Describe the image" value={prompt} onChange={setPrompt} rows={7} />
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField label="Size" value={size} onChange={setSize} options={[
              ['1792x1024', 'Landscape / hero'], ['1024x1024', 'Square'], ['1024x1792', 'Portrait / story'],
            ]} />
            <SelectField label="Style" value={style} onChange={setStyle} options={[["natural", 'Natural'], ["vivid", 'Vivid']]} />
            <SelectField label="Use" value={usage} onChange={setUsage} options={[
              ['hero', 'Hero'], ['poster', 'Poster'], ['store-demo', 'Store demo'], ['course', 'Course'], ['general', 'General'],
            ]} />
          </div>
          <button type="button" disabled={busy} onClick={() => void generate()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 font-black text-white hover:bg-brand-red-800 disabled:opacity-50">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {busy ? 'Generating…' : 'Generate and save'}
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-rose-50 p-5 shadow-sm">
        <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-white bg-white shadow-lg">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Generated preview" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="grid min-h-[420px] place-items-center p-8 text-center">
              <div><ImageIcon className="mx-auto h-12 w-12 text-cyan-700" /><p className="mt-4 font-black">Your generated image appears here.</p><p className="mt-2 text-sm font-medium text-slate-600">Landscape, square and portrait outputs are saved to the same Media Library.</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommercialCreator({ audioAssets, onSaved, onError }: { audioAssets: MediaAsset[]; onSaved: (message: string) => Promise<void>; onError: (message: string) => void }) {
  const [busy, setBusy] = useState<'plan' | 'render' | ''>('');
  const [projectName, setProjectName] = useState('Website Builder Commercial');
  const [title, setTitle] = useState('Build your website by talking to PARIS');
  const [prompt, setPrompt] = useState('Show a business owner describing the website they need, PARIS creating the first draft, the user changing colors and services by voice, previewing mobile, and publishing the finished website. Keep it bright, visual, product-focused, and grounded in the real Elevate Website Builder workflow.');
  const [audience, setAudience] = useState('small businesses, training providers, and organizations that need a professional website without coding');
  const [objective, setObjective] = useState('demonstrate the actual product workflow and move the viewer into a 14-day trial');
  const [cta, setCta] = useState('Start the 14-day trial');
  const [durationSeconds, setDurationSeconds] = useState('45');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [sourceMode, setSourceMode] = useState('hybrid');
  const [tone, setTone] = useState('professional');
  const [voice, setVoice] = useState('coral');
  const [musicAssetUrl, setMusicAssetUrl] = useState('');
  const [plan, setPlan] = useState<CommercialPlan | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  async function submit(action: 'plan' | 'render') {
    setBusy(action);
    try {
      const response = await fetch('/api/admin/media-studio/commercial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          projectName,
          title,
          prompt,
          audience,
          objective,
          cta,
          durationSeconds: Number(durationSeconds),
          aspectRatio,
          sourceMode,
          tone,
          voice,
          includeCaptions: true,
          musicAssetUrl: musicAssetUrl || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(errorMessage(payload, 'Commercial generation failed.'));
      setPlan(payload.plan || null);
      if (action === 'render') {
        setVideoUrl(payload.publicUrl || '');
        await onSaved('Commercial rendered, uploaded, and registered in the Media Library.');
      }
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Commercial generation failed.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-red-700">Commercial Generator</p>
          <h2 className="mt-2 text-2xl font-black">Brief → storyboard → visuals → voice → captions → MP4.</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Stock uses Pexels. Generative uses Runway when configured and falls back safely. Hybrid uses generative opening shots and stock for speed and cost control.</p>
          <div className="mt-5 grid gap-4">
            <TextField label="Project" value={projectName} onChange={setProjectName} />
            <TextField label="Commercial title" value={title} onChange={setTitle} />
            <TextArea label="What should the commercial show?" value={prompt} onChange={setPrompt} rows={7} />
            <TextField label="Audience" value={audience} onChange={setAudience} />
            <TextField label="Objective" value={objective} onChange={setObjective} />
            <TextField label="Call to action" value={cta} onChange={setCta} />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <SelectField label="Length" value={durationSeconds} onChange={setDurationSeconds} options={[["15", '15 sec'], ["30", '30 sec'], ["45", '45 sec'], ["60", '60 sec'], ["90", '90 sec']]} />
              <SelectField label="Format" value={aspectRatio} onChange={setAspectRatio} options={[["16:9", 'Landscape 16:9'], ["9:16", 'Vertical 9:16'], ["1:1", 'Square 1:1']]} />
              <SelectField label="Visual source" value={sourceMode} onChange={setSourceMode} options={[["stock", 'Stock'], ["hybrid", 'Hybrid'], ["generative", 'Generative']]} />
              <SelectField label="Tone" value={tone} onChange={setTone} options={[["professional", 'Professional'], ["warm", 'Warm'], ["energetic", 'Energetic'], ["cinematic", 'Cinematic'], ["educational", 'Educational']]} />
              <SelectField label="Voice" value={voice} onChange={setVoice} options={['coral','alloy','ash','ballad','echo','fable','nova','onyx','sage','shimmer'].map((item) => [item, item[0].toUpperCase() + item.slice(1)])} />
              <SelectField label="Music" value={musicAssetUrl} onChange={setMusicAssetUrl} options={[["", 'No music'], ...audioAssets.map((asset) => [assetUrl(asset), asset.title || 'Audio asset'])]} />
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={Boolean(busy)} onClick={() => void submit('plan')} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-5 font-black text-slate-950 hover:bg-slate-50 disabled:opacity-50">
                {busy === 'plan' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Layers3 className="h-5 w-5" />} Plan storyboard
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={() => void submit('render')} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 font-black text-white hover:bg-brand-red-800 disabled:opacity-50">
                {busy === 'render' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />} {busy === 'render' ? 'Rendering…' : 'Render commercial'}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-100 via-white to-rose-100 p-5 shadow-sm">
          <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-xl">
            {videoUrl ? (
              <video src={videoUrl} controls playsInline className="aspect-video w-full bg-black object-contain" />
            ) : (
              <div className="grid aspect-video place-items-center p-8 text-center">
                <div><MonitorPlay className="mx-auto h-12 w-12 text-cyan-800" /><p className="mt-4 text-xl font-black">The finished commercial plays here.</p><p className="mt-2 text-sm font-medium text-slate-600">The storyboard remains editable before you spend rendering time.</p></div>
              </div>
            )}
          </div>
          {plan ? <Storyboard plan={plan} /> : null}
        </div>
      </div>
    </div>
  );
}

function Storyboard({ plan }: { plan: CommercialPlan }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3"><h3 className="font-black">Storyboard</h3><span className="text-xs font-bold text-slate-500">{plan.scenes.length} scenes</span></div>
      <div className="mt-3 max-h-[380px] space-y-2 overflow-auto pr-1">
        {plan.scenes.map((scene, index) => (
          <div key={scene.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-black text-brand-red-700">{index + 1}. {scene.title}</span><span className="text-[11px] font-bold text-slate-500">{scene.durationSeconds}s</span></div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{scene.narration}</p>
            <p className="mt-2 text-[11px] font-bold text-cyan-800">Visual: {scene.visualQuery}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoiceCreator() {
  const voice = useNaturalVoice();
  const [text, setText] = useState('Tell PARIS what you want. Watch the website change. Preview it, publish it, and keep building without code.');
  const [selectedVoice, setSelectedVoice] = useState('coral');
  const [style, setStyle] = useState('commercial');

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-red-700">Voiceover</p>
        <h2 className="mt-2 text-2xl font-black">Preview the same natural voice stack used by Elevate.</h2>
        <div className="mt-5 grid gap-4">
          <TextArea label="Script" value={text} onChange={setText} rows={8} />
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Voice" value={selectedVoice} onChange={setSelectedVoice} options={['coral','alloy','ash','ballad','echo','fable','nova','onyx','sage','shimmer'].map((item) => [item, item[0].toUpperCase() + item.slice(1)])} />
            <SelectField label="Delivery" value={style} onChange={setStyle} options={[["commercial", 'Commercial'], ["assistant", 'Assistant'], ["instructor", 'Instructor'], ["default", 'Natural']]} />
          </div>
          <button
            type="button"
            disabled={voice.isLoading || !text.trim()}
            onClick={() => void voice.play(text, { voice: selectedVoice, style: style as 'commercial' | 'assistant' | 'instructor' | 'default' })}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-800 px-5 font-black text-white hover:bg-cyan-900 disabled:opacity-50"
          >
            {voice.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />} Preview voice
          </button>
          {voice.error ? <p className="text-sm font-bold text-red-700">{voice.error}</p> : null}
        </div>
      </div>
      <div className="grid min-h-[360px] place-items-center rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-100 via-white to-rose-100 p-8 text-center shadow-sm">
        <div><Mic2 className="mx-auto h-14 w-14 text-brand-red-700" /><p className="mt-4 text-2xl font-black">Voice is part of the project, not a separate tool.</p><p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">Commercial rendering uses the selected natural voice automatically. This panel lets you test delivery before rendering video.</p></div>
      </div>
    </div>
  );
}

function HeroCreator({ assets, onSaved, onError }: { assets: MediaAsset[]; onSaved: (message: string) => Promise<void>; onError: (message: string) => void }) {
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [pageKey, setPageKey] = useState('homepage');
  const [desktopX, setDesktopX] = useState(50);
  const [desktopY, setDesktopY] = useState(50);
  const [mobileX, setMobileX] = useState(50);
  const [mobileY, setMobileY] = useState(50);
  const [overlay, setOverlay] = useState(15);
  const [busy, setBusy] = useState(false);
  const selected = assets.find((asset) => asset.id === assetId) ?? assets[0];

  useEffect(() => {
    if (!assetId && assets[0]) setAssetId(assets[0].id);
  }, [assetId, assets]);

  async function save() {
    if (!selected) return;
    setBusy(true);
    try {
      const metadata = {
        ...(selected.metadata ?? {}),
        hero_treatment: {
          page_key: pageKey,
          desktop_position: `${desktopX}% ${desktopY}%`,
          mobile_position: `${mobileX}% ${mobileY}%`,
          overlay_opacity: overlay / 100,
        },
      };
      const response = await fetch(`/api/admin/media-assets/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(errorMessage(payload, 'Unable to save hero settings.'));
      await onSaved('Hero focal point and overlay settings saved with the media asset.');
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Unable to save hero settings.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-red-700">Hero Treatment</p>
        <h2 className="mt-2 text-2xl font-black">Fix cropping and darkness before the asset reaches a page.</h2>
        <p className="mt-2 text-sm font-medium text-slate-600">These settings stay with the asset. They are production metadata for the Marketing hero registry to consume; saving them does not silently redeploy a static page.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SelectField label="Media asset" value={selected?.id || ''} onChange={setAssetId} options={assets.map((asset) => [asset.id, asset.title || asset.storage_path])} />
          <TextField label="Target page key" value={pageKey} onChange={setPageKey} />
          <RangeField label={`Desktop focal X: ${desktopX}%`} value={desktopX} onChange={setDesktopX} />
          <RangeField label={`Desktop focal Y: ${desktopY}%`} value={desktopY} onChange={setDesktopY} />
          <RangeField label={`Mobile focal X: ${mobileX}%`} value={mobileX} onChange={setMobileX} />
          <RangeField label={`Mobile focal Y: ${mobileY}%`} value={mobileY} onChange={setMobileY} />
          <div className="md:col-span-2"><RangeField label={`Readability overlay: ${overlay}%`} value={overlay} onChange={setOverlay} max={60} /></div>
        </div>
        <button type="button" onClick={() => void save()} disabled={!selected || busy} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-red-700 px-5 font-black text-white hover:bg-brand-red-800 disabled:opacity-50">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Save hero treatment
        </button>
      </div>

      {selected ? (
        <div className="grid gap-5 lg:grid-cols-[1.5fr_0.75fr]">
          <HeroPreview asset={selected} x={desktopX} y={desktopY} overlay={overlay} label="Desktop preview" />
          <HeroPreview asset={selected} x={mobileX} y={mobileY} overlay={overlay} label="Mobile preview" portrait />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">Generate or upload an image/video first.</div>
      )}
    </div>
  );
}

function HeroPreview({ asset, x, y, overlay, label, portrait = false }: { asset: MediaAsset; x: number; y: number; overlay: number; label: string; portrait?: boolean }) {
  const url = assetUrl(asset);
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 px-1 text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
      <div className={`relative overflow-hidden rounded-2xl bg-slate-200 ${portrait ? 'aspect-[9/16] max-h-[520px]' : 'aspect-video'}`}>
        {asset.type === 'video' ? (
          <video src={url} muted loop autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${x}% ${y}%` }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Hero preview" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${x}% ${y}%` }} />
        )}
        <div className="absolute inset-0 bg-black" style={{ opacity: overlay / 100 }} />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white"><p className="text-xs font-black uppercase tracking-widest">Preview</p><p className="mt-1 text-xl font-black">Your headline remains readable without burying the image.</p></div>
      </div>
    </div>
  );
}

function ProjectsView({ projects }: { projects: Array<[string, MediaAsset[]]> }) {
  if (!projects.length) return <EmptyState title="No projects yet" text="Generate an image or commercial and give it a project name. Assets will group here automatically." />;
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {projects.map(([name, projectAssets]) => (
        <article key={name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid h-40 grid-cols-2 gap-1 bg-slate-100">
            {projectAssets.slice(0, 4).map((asset) => <div key={asset.id} className="min-h-0 overflow-hidden"><AssetPreview asset={asset} /></div>)}
          </div>
          <div className="p-5"><h2 className="font-black">{name}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{projectAssets.length} asset{projectAssets.length === 1 ? '' : 's'}</p><div className="mt-3 flex flex-wrap gap-2">{[...new Set(projectAssets.map((asset) => asset.type))].map((assetType) => <span key={assetType} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{assetType}</span>)}</div></div>
        </article>
      ))}
    </div>
  );
}

function LibraryView({ assets, loading, search, setSearch, type, setType }: { assets: MediaAsset[]; loading: boolean; search: string; setSearch: (value: string) => void; type: string; setType: (value: string) => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-64 flex-1"><span className="sr-only">Search media</span><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search media by title" className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm font-semibold" /></label>
        <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold"><option value="">All types</option><option value="image">Images</option><option value="video">Videos</option><option value="audio">Audio</option><option value="document">Documents</option><option value="other">Other</option></select>
      </div>
      {loading ? <div className="grid min-h-64 place-items-center"><Loader2 className="h-7 w-7 animate-spin" /></div> : assets.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <article key={asset.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="h-52 bg-slate-100"><AssetPreview asset={asset} /></div>
              <div className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="min-w-0 truncate font-black">{asset.title || asset.storage_path.split('/').at(-1) || 'Untitled asset'}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{asset.type}</span></div><p className="mt-2 text-xs font-semibold text-slate-500">{projectName(asset)} · {new Date(asset.created_at).toLocaleString()}</p></div>
            </article>
          ))}
        </div>
      ) : <EmptyState title="No media assets found" text="Generate an image or commercial, or register an approved file to make it available here." />}
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><FolderOpen className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-3 font-black">{title}</h3><p className="mx-auto mt-1 max-w-xl text-sm font-medium text-slate-600">{text}</p></div>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-sm font-black text-slate-800"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 font-medium outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></label>;
}

function TextArea({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return <label className="grid gap-1.5 text-sm font-black text-slate-800"><span>{label}</span><textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className="resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-medium leading-6 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="grid gap-1.5 text-sm font-black text-slate-800"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-medium outline-none focus:border-cyan-500">{options.map(([id, name]) => <option key={`${id}-${name}`} value={id}>{name}</option>)}</select></label>;
}

function RangeField({ label, value, onChange, max = 100 }: { label: string; value: number; onChange: (value: number) => void; max?: number }) {
  return <label className="grid gap-2 text-sm font-black text-slate-800"><span>{label}</span><input type="range" min={0} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="accent-cyan-700" /></label>;
}
