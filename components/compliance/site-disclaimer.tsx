import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export function SiteDisclaimer() {
  return (
    <div className="border-t bg-neutral-50 py-6 px-6 text-sm text-neutral-600">
      <div className="max-w-7xl mx-auto leading-7">
        {PLATFORM_DEFAULTS.orgName} Career and Technical Institute provides workforce development
        and technical training services. Programs, funding eligibility, certification
        preparation, employer participation, and training availability may vary. Elevate
        for Humanity does not guarantee employment, certification issuance, wage outcomes,
        or licensure approval.
      </div>
    </div>
  );
}
