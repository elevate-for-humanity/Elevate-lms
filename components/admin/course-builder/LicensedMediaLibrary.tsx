'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Download, ExternalLink, Loader2, RefreshCw, Search, Upload, X } from 'lucide-react';
import VideoUploadClient from '@/apps/admin/app/videos/upload/VideoUploadClient';

type Purchase = {
  itemId: string;
  title: string;
  url: string;
  thumbnail: string;
  purchaseCode: string;
};
type Recommendation = {
  id: string;
  lesson_id: string;
  match_score: number;
  match_reasons: string[];
  status: 'suggested' | 'approved' | 'rejected' | 'attached' | 'failed';
  course_lessons: { title: string } | Array<{ title: string }>;
  licensed_media_entitlements:
    | { title: string; provider_item_id: string; thumbnail_url?: string; purchase_code?: string }
    | Array<{
        title: string;
        provider_item_id: string;
        thumbnail_url?: string;
        purchase_code?: string;
      }>;
};

function one<T>(value: T | T[]): T {
  return Array.isArray(value) ? value[0] : value;
}

export default function LicensedMediaLibrary({ courseId }: { courseId: string }) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [manualUploadOpen, setManualUploadOpen] = useState(false);

  const load = useCallback(async () => {
    setBusy('load');
    setMessage('');
    try {
      const [purchaseResponse, recommendationResponse] = await Promise.all([
        fetch('/api/admin/integrations/envato?action=purchases', { cache: 'no-store' }),
        fetch(
          `/api/admin/integrations/envato?action=recommendations&courseId=${encodeURIComponent(courseId)}`,
          { cache: 'no-store' },
        ),
      ]);
      const purchaseData = await purchaseResponse.json();
      const recommendationData = await recommendationResponse.json();
      if (!purchaseResponse.ok)
        throw new Error(purchaseData.error || 'Unable to load purchased media');
      setConnected(Boolean(purchaseData.connected));
      setPurchases(purchaseData.purchases ?? []);
      if (recommendationResponse.ok) setRecommendations(recommendationData.recommendations ?? []);
    } catch (error) {
      setConnected(false);
      setMessage(error instanceof Error ? error.message : 'Unable to load licensed media');
    } finally {
      setBusy('');
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      purchases.filter((purchase) => purchase.title.toLowerCase().includes(query.toLowerCase())),
    [purchases, query],
  );

  async function sync() {
    setBusy('sync');
    setMessage('');
    try {
      const response = await fetch('/api/admin/integrations/envato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', courseId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to sync purchased media');
      setConnected(true);
      setPurchases(data.purchases ?? []);
      setRecommendations(data.recommendations ?? []);
      setMessage(`Synced ${data.entitlements} licensed purchases and matched them to this course.`);
    } catch (error) {
      setConnected(false);
      setMessage(error instanceof Error ? error.message : 'Unable to sync purchased media');
    } finally {
      setBusy('');
    }
  }

  async function review(match: Recommendation, action: 'approve' | 'reject') {
    setBusy(match.id);
    setMessage('');
    try {
      const response = await fetch('/api/admin/integrations/envato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, matchId: match.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Unable to ${action} selection`);
      setRecommendations((rows) =>
        rows.map((row) => (row.id === match.id ? { ...row, status: data.match.status } : row)),
      );
      if (action === 'approve') setSelected({ ...match, status: 'approved' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Unable to ${action} selection`);
    } finally {
      setBusy('');
    }
  }

  async function download(
    purchase: Purchase | { provider_item_id: string; purchase_code?: string },
  ) {
    const itemId = 'itemId' in purchase ? purchase.itemId : purchase.provider_item_id;
    const purchaseCode =
      'purchaseCode' in purchase ? purchase.purchaseCode : purchase.purchase_code;
    setBusy(`download-${itemId}`);
    setMessage('');
    try {
      const params = new URLSearchParams({ action: 'download', itemId });
      if (purchaseCode) params.set('purchaseCode', purchaseCode);
      const response = await fetch(`/api/admin/integrations/envato?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok || !data.downloadUrl)
        throw new Error(data.error || 'Download link unavailable');
      window.location.assign(data.downloadUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Download link unavailable');
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="mb-5 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
            Licensed Media Plugin
          </p>
          <h2 className="mt-1 text-xl font-black">
            Search, approve, download, and attach purchased scenes
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Only assets already present in the connected paid account appear here. Download URLs are
            generated on demand and never stored.
          </p>
        </div>
        <button
          type="button"
          onClick={sync}
          disabled={Boolean(busy)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 disabled:opacity-50"
        >
          {busy === 'sync' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}{' '}
          Sync purchases + match lessons
        </button>
        <button
          type="button"
          onClick={() => setManualUploadOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-500 px-4 py-3 font-black text-white"
        >
          <Upload className="h-4 w-4" />
          {manualUploadOpen ? 'Close manual upload' : 'Upload purchased file'}
        </button>
      </div>
      {message ? (
        <p className="mt-4 rounded-xl border border-cyan-800 bg-cyan-950 p-3 text-sm text-cyan-100">
          {message}
        </p>
      ) : null}
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 text-slate-950">
          <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search purchased scenes"
              className="min-h-11 w-full outline-none"
            />
          </label>
          <div className="mt-3 max-h-96 space-y-2 overflow-auto">
            {filtered.map((purchase) => (
              <div
                key={purchase.itemId}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{purchase.title}</p>
                  <p className="text-xs text-slate-500">Purchased · ID {purchase.itemId}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void download(purchase)}
                    disabled={Boolean(busy)}
                    title="Download purchased asset"
                    className="rounded-lg bg-slate-900 p-2 text-white"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {purchase.url ? (
                    <a
                      href={purchase.url}
                      target="_blank"
                      rel="noreferrer"
                      title="View item"
                      className="rounded-lg border p-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
            {!busy && !filtered.length ? (
              <p className="p-4 text-sm text-slate-500">
                {connected
                  ? 'The connected marketplace account returned no purchased items. You can still download from the paid marketplace and use Upload purchased file.'
                  : 'Marketplace connection unavailable. Verify ENVATO_API_TOKEN in Studio Secrets, then sync again.'}
              </p>
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 text-slate-950">
          <h3 className="font-black">Course-aware recommendations</h3>
          <p className="text-sm text-slate-600">
            Approve a match before downloading and attaching it.
          </p>
          <div className="mt-3 max-h-96 space-y-3 overflow-auto">
            {recommendations.map((match) => {
              const asset = one(match.licensed_media_entitlements);
              const lesson = one(match.course_lessons);
              return (
                <div key={match.id} className="rounded-xl border p-3">
                  <p className="text-xs font-bold uppercase text-cyan-700">{lesson?.title}</p>
                  <p className="font-black">{asset?.title}</p>
                  <p className="text-xs text-slate-500">
                    Match {Math.round(Number(match.match_score) * 100)}% · {match.status}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {match.status !== 'attached' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void review(match, 'approve')}
                          disabled={Boolean(busy)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void review(match, 'reject')}
                          disabled={Boolean(busy)}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold"
                        >
                          <X className="h-3 w-3" /> Reject
                        </button>
                      </>
                    ) : null}
                    {match.status === 'approved' || match.status === 'attached' ? (
                      <button
                        type="button"
                        onClick={() => void download(asset)}
                        disabled={Boolean(busy)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white"
                      >
                        <Download className="h-3 w-3" /> Download
                      </button>
                    ) : null}
                    {match.status === 'approved' ? (
                      <button
                        type="button"
                        onClick={() => setSelected(match)}
                        className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-black"
                      >
                        Attach upload
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {!recommendations.length ? (
              <p className="p-4 text-sm text-slate-500">
                Sync purchases to generate lesson matches.
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {manualUploadOpen ? (
        <div className="mt-5 rounded-2xl bg-white p-4 text-slate-950 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-black">Upload a purchased scene</h3>
              <p className="text-sm text-slate-600">
                Download the licensed file from your paid account, then attach it to the correct
                lesson here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setManualUploadOpen(false)}
              className="rounded-lg border p-2"
              aria-label="Close manual upload"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <VideoUploadClient
            key={`manual-${courseId}`}
            initialCourseId={courseId}
            embedded
            onUploaded={() => {
              setManualUploadOpen(false);
              void load();
            }}
          />
        </div>
      ) : null}
      {selected ? (
        <div className="mt-5 rounded-2xl bg-white p-4 text-slate-950 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-black">Attach approved scene</h3>
              <p className="text-sm text-slate-600">
                Lesson: {one(selected.course_lessons)?.title}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-lg border p-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <VideoUploadClient
            key={selected.id}
            initialCourseId={courseId}
            initialLessonId={selected.lesson_id}
            licensedMatchId={selected.id}
            embedded
            onUploaded={() => {
              setSelected(null);
              void load();
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
