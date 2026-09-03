'use client';

type Props = {
  licenseLabel: string;
  licenseFileName: string;
  onLicenseChange: (file: File | null, name: string) => void;
  insuranceFileName: string;
  onInsuranceChange: (file: File | null, name: string) => void;
  licenseRequired?: boolean;
  accentRing?: string;
};

/**
 * Shared compliance file inputs for barber/cosmetology host shop applications.
 */
export default function HostShopComplianceUploads({
  licenseLabel,
  licenseFileName,
  onLicenseChange,
  insuranceFileName,
  onInsuranceChange,
  licenseRequired = true,
  accentRing = 'focus:ring-brand-blue-500',
}: Props) {
  const inputCls = `w-full px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 ${accentRing}`;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-1">
          {licenseLabel}
          {licenseRequired ? ' *' : ''}
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          required={licenseRequired}
          className={inputCls}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onLicenseChange(f, f?.name ?? '');
          }}
        />
        {licenseFileName ? <p className="text-xs text-slate-600 mt-1">{licenseFileName}</p> : null}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-1">
          Insurance COI (optional at submit)
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className={inputCls}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onInsuranceChange(f, f?.name ?? '');
          }}
        />
        {insuranceFileName ? (
          <p className="text-xs text-slate-600 mt-1">{insuranceFileName}</p>
        ) : (
          <p className="text-xs text-amber-700 mt-1">
            Missing COI may delay final approval until uploaded in onboarding.
          </p>
        )}
      </div>
    </div>
  );
}
