import { Metadata } from 'next';
import { generateInternalMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Cache Diagnostic',
  description: 'Cache diagnostic tool.',
  path: '/cache-diagnostic',
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CacheDiagnostic() {
  const timestamp = new Date().toISOString();
  const buildId = process.env.NEXT_BUILD_ID || 'unknown';

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Cache Diagnostic' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Cache Diagnostic</h1>

        <div className="bg-gray-100 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Server Info</h2>
          <dl className="space-y-2">
            <div>
              <dt className="font-medium">Timestamp:</dt>
              <dd className="font-mono text-sm">{timestamp}</dd>
            </div>
            <div>
              <dt className="font-medium">Build ID:</dt>
              <dd className="font-mono text-sm">{buildId}</dd>
            </div>
            <div>
              <dt className="font-medium">Vercel Region:</dt>
              <dd className="font-mono text-sm">
                {'netlify'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-brand-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Check Response Headers</h2>
          <p className="mb-4">
            Open browser DevTools → Network → Reload → Click this page request
          </p>
          <p className="mb-2">Look for these headers:</p>
          <ul className="list-disc list-inside space-y-1 font-mono text-sm">
            <li>x-nf-request-id (should be MISS or BYPASS)</li>
            <li>age (should be 0 or absent)</li>
            <li>cache-control</li>
            <li>x-nf-request-id</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm">
            <strong>If you see x-nf-request-id: HIT or STALE</strong> - the page
            is being served from edge cache. This diagnostic page should always
            show MISS or BYPASS.
          </p>
        </div>
      </div>
    </div>
  );
}
