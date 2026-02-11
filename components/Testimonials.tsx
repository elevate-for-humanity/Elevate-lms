type Testimonial = {
  name: string;
  role: string;
  quote: string;
  avatar: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Sharon P.',
    role: 'CNA Graduate',
    quote:
      'Elevate covered my tuition, helped with childcare, and connected me to a full-time job in 6 weeks.',
    avatar: '/people/sharon.jpg',
  },
  {
    name: 'Graduate',
    role: 'Welding Apprentice',
    quote:
      "The lab time and OSHA-10 got me hired fast. I'm earning while I learn with a clear path to journeyman.",
    avatar: '/people/marcus.jpg',
  },
  {
    name: 'Alicia D.',
    role: 'Nail Technology',
    quote:
      'State-board prep and salon coaching gave me clients before I graduated. The support is real.',
    avatar: '/people/alicia.jpg',
  },
];

import Image from 'next/image';

export default function Testimonials() {
  return (
    <section className="section bg-slate-50">
      <div className="container">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">
            Real Stories. Real Results.
          </h2>
          <p className="mt-2 text-black">
            100% funded programs • $0 cost to students
          </p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6">
              <div className="flex items-center gap-4">
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-black">{t.role}</div>
                </div>
              </div>
              <p className="mt-4 text-black">"{t.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
