import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `My Profile | ${PLATFORM_DEFAULTS.orgName} LMS`,
  description: `Your profile settings.`,
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-200 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>
      </section>
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500">Profile settings coming soon.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
