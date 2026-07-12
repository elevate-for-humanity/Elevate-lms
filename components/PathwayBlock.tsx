import Image from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface PathwayBlockProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function PathwayBlock({ variant = 'light', className = '' }: PathwayBlockProps) {
  const isDark = variant === 'dark';

  return (
    <div className={`py-12 ${isDark ? 'bg-slate-900' : 'bg-slate-50'} ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        <h2
          className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}
        >
          Your Pathway to a Career
        </h2>
        <p className={`text-center mb-10 ${isDark ? 'text-slate-700' : 'text-slate-700'}`}>
          Three steps from application to employment
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden relative">
              <Image
                src="/images/pages/comp-pathway-classroom.webp"
                alt="Eligibility screening"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <div
              className={`text-sm font-bold mb-2 ${isDark ? 'text-brand-blue-400' : 'text-brand-blue-600'}`}
            >
              Step 1
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Check Eligibility
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-700' : 'text-slate-700'}`}>
              Apply and get screened for funding eligibility (WIOA, WRG, JRI) or self-pay options.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden relative">
              <Image
                src="/images/pages/comp-pathway-healthcare.webp"
                alt="Training classroom"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <div
              className={`text-sm font-bold mb-2 ${isDark ? 'text-brand-green-400' : 'text-brand-green-600'}`}
            >
              Step 2
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Complete Training
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-700' : 'text-slate-700'}`}>
              Attend hybrid training, complete coursework, and earn your Certificate of Completion.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden relative">
              <Image
                src="/images/pages/trades-classroom.webp"
                alt="Job placement"
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <div
              className={`text-sm font-bold mb-2 ${isDark ? 'text-brand-orange-400' : 'text-brand-orange-600'}`}
            >
              Step 3
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Get Placed
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-700' : 'text-slate-700'}`}>
              Access career services, job placement support, and connect with employer partners.
            </p>
          </div>
        </div>

        <p className={`text-center text-xs mt-8 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
          Third-party certifications and state licenses are issued by external credentialing bodies,
          not by {PLATFORM_DEFAULTS.orgName}.
        </p>
      </div>
    </div>
  );
}
