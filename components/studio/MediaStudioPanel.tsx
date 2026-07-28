'use client';


import {
  File,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Video,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';


interface MediaAsset {
  id: string;
  org_id: string;
  storage_path: string;
  type:
    | 'video'
    | 'audio'
    | 'image'
    | 'document'
    | 'other';
  mime_type?: string | null;
  duration_seconds?: number | null;
  title?: string | null;
  status: string;
  created_at: string;
}


interface MediaResponse {
  ok: boolean;
  assets?: MediaAsset[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
  error?: {
    message?: string;
  };
}


export default function MediaStudioPanel() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');


  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError('');


    try {
      const params = new URLSearchParams();


      if (search.trim()) {
        params.set('search', search.trim());
      }


      if (type) {
        params.set('type', type);
      }


      params.set('limit', '100');


      const response = await fetch(
        `/api/admin/media-assets?${params.toString()}`,
        {
          credentials: 'include',
          cache: 'no-store',
        },
      );


      const payload =
        (await response.json()) as MediaResponse;


      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error?.message ??
            'Unable to load media assets.',
        );
      }


      setAssets(payload.assets ?? []);
    } catch (loadError) {
      setAssets([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load media assets.',
      );
    } finally {
      setLoading(false);
    }
  }, [search, type]);


  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);


  const counts = useMemo(() => {
    return assets.reduce<Record<string, number>>(
      (result, asset) => {
        result[asset.type] =
          (result[asset.type] ?? 0) + 1;


        return result;
      },
      {},
    );
  }, [assets]);


  function iconForType(assetType: MediaAsset['type']) {
    if (assetType === 'image') {
      return ImageIcon;
    }


    if (assetType === 'video') {
      return Video;
    }


    return File;
  }


  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="border-b bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              Media Library
            </h2>


            <p className="text-sm text-slate-600">
              Organization-scoped images, videos,
              documents and course assets.
            </p>
          </div>


          <button
            type="button"
            onClick={() => void loadAssets()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}


            Refresh
          </button>
        </div>


        <div className="mt-4 flex flex-wrap gap-3">
          <label className="relative min-w-64 flex-1">
            <span className="sr-only">
              Search media
            </span>


            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />


            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search media by title"
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
            />
          </label>


          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value)
            }
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All types</option>
            <option value="image">
              Images
            </option>
            <option value="video">
              Videos
            </option>
            <option value="audio">
              Audio
            </option>
            <option value="document">
              Documents
            </option>
            <option value="other">
              Other
            </option>
          </select>
        </div>
      </header>


      <div className="border-b bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {assets.length} assets
        {' · '}
        {counts.image ?? 0} images
        {' · '}
        {counts.video ?? 0} videos
        {' · '}
        {counts.document ?? 0} documents
      </div>


      <div className="min-h-0 flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        )}


        {!loading && error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            {error}
          </div>
        )}


        {!loading &&
          !error &&
          assets.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-slate-400" />


              <h3 className="mt-3 font-semibold">
                No media assets found
              </h3>


              <p className="mt-1 text-sm text-slate-600">
                Upload or register an approved file to
                make it available to courses and content.
              </p>
            </div>
          )}


        {!loading &&
          !error &&
          assets.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => {
                const Icon = iconForType(asset.type);


                return (
                  <article
                    key={asset.id}
                    className="rounded-xl border bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-slate-100 p-2">
                        <Icon className="h-5 w-5" />
                      </div>


                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium">
                          {asset.title ||
                            asset.storage_path
                              .split('/')
                              .at(-1) ||
                            'Untitled asset'}
                        </h3>


                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                          {asset.type}
                        </p>
                      </div>
                    </div>


                    <p className="mt-4 break-all text-xs text-slate-500">
                      {asset.storage_path}
                    </p>


                    <p className="mt-3 text-xs text-slate-500">
                      {new Date(
                        asset.created_at,
                      ).toLocaleString()}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
      </div>
    </section>
  );
}
