import Link from 'next/link';
import type { WorkOneRegion } from '@/data/workone/indiana-regions';
import {
  workOneCenterDirectionsUrl,
  workOneMapEmbedUrl,
} from '@/data/workone/indiana-regions';

type WorkOneIndianaMapProps = {
  region?: WorkOneRegion;
  showAllRegionsLink?: boolean;
};

export function WorkOneIndianaMap({ region, showAllRegionsLink = true }: WorkOneIndianaMapProps) {
  const centers = region?.centers ?? [];
  const mapUrl = region
    ? workOneMapEmbedUrl(region)
    : 'https://maps.google.com/maps?q=Indianapolis,+IN+WorkOne&z=8&output=embed';

  return (
    <section className="py-12 sm:py-16 bg-white" aria-labelledby="workone-map-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">
            WorkOne Indiana
          </p>
          <h2 id="workone-map-heading" className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {region ? `WorkOne Centers — ${region.name}` : 'Find a WorkOne Center'}
          </h2>
          <p className="text-slate-600 mt-2 max-w-2xl text-sm leading-relaxed">
            {region?.description ??
              'Visit a WorkOne career center to meet with a counselor and determine WIOA, Workforce Ready Grant, or IMPACT funding eligibility before enrolling in training.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            {centers.map((center) => (
              <div
                key={`${center.name}-${center.address}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 hover:border-brand-orange-300 transition-colors"
              >
                <h3 className="font-bold text-slate-900 text-sm mb-2">{center.name}</h3>
                <p className="text-sm text-slate-600">
                  {center.address}
                  <br />
                  {center.city}, IN {center.zip}
                </p>
                <p className="text-sm text-slate-600 mt-2">
                  <a
                    href={`tel:${center.phone.replace(/[^0-9]/g, '')}`}
                    className="text-brand-blue-700 hover:underline font-medium"
                  >
                    {center.phone}
                  </a>
                  <span className="text-slate-400 mx-2">·</span>
                  {center.hours}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <a
                    href={workOneCenterDirectionsUrl(center)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-brand-orange-600 text-white text-xs font-semibold hover:bg-brand-orange-700"
                  >
                    Get directions
                  </a>
                  <a
                    href={`tel:${center.phone.replace(/[^0-9]/g, '')}`}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                  >
                    Call
                  </a>
                </div>
              </div>
            ))}

            {showAllRegionsLink && (
              <div className="pt-2">
                <Link
                  href="/find-workone"
                  className="text-sm font-semibold text-brand-blue-700 hover:underline"
                >
                  View all Indiana WorkOne regions →
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
            <div className="px-4 py-3 bg-slate-900 text-white text-sm font-semibold">
              Map — {region?.name ?? 'Indiana'}
            </div>
            <div className="relative h-[320px] sm:h-[420px]">
              <iframe
                src={mapUrl}
                title={region ? `WorkOne map — ${region.name}` : 'WorkOne centers in Indiana'}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
              <a
                href="https://www.in.gov/dwd/find-a-workone-center/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-brand-blue-700 hover:underline"
              >
                Official DWD WorkOne locator (all counties) →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Default export for next/dynamic
export default WorkOneIndianaMap;
