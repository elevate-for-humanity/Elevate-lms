import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { MapPin, Phone, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: `Locations | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Find Elevate for Humanity training locations in Indianapolis, Indiana.',
};

const locations = [
  {
    name: 'Main Campus',
    address: '8888 Keystone Crossing, Suite 1300',
    city: 'Indianapolis, IN 46240',
    phone: '(317) 314-3757',
    hours: 'Mon-Fri: 9am-5pm',
  },
];

export default function LocationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Locations</h1>
          <p className="text-xl text-slate-300">Serving Indianapolis and surrounding areas</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {locations.map((loc) => (
            <div key={loc.name} className="p-8 bg-slate-50 rounded-2xl border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">{loc.name}</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-brand-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-900">{loc.address}</p>
                    <p className="text-slate-600">{loc.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-brand-red-600 shrink-0" />
                  <a href="tel:3173143757" className="text-slate-900 hover:text-brand-red-600">{loc.phone}</a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-brand-red-600 shrink-0" />
                  <span className="text-slate-600">{loc.hours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
