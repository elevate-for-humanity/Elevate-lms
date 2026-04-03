import Link from 'next/link';
import Image from 'next/image';

const PROGRAMS = [
  {
    tag: 'Healthcare',
    full: 'Certified Nursing Assistant',
    duration: '4–8 weeks',
    salary: '$28–$42K/yr',
    funding: 'Fee-Based',
    fundingColor: 'text-white',
    image: '/images/pages/card-cna.jpg',
    href: '/programs/cna',
  },
  {
    tag: 'Skilled Trades',
    full: 'HVAC Technician',
    duration: '12 weeks',
    salary: '$40–$80K/yr',
    funding: 'WIOA / WRG Eligible',
    fundingColor: 'text-green-400',
    image: '/images/pages/card-hvac.jpg',
    href: '/programs/hvac-technician',
  },
  {
    tag: 'Transportation',
    full: 'CDL Class A',
    duration: 'Weeks, not years',
    salary: '$50–$80K/yr',
    funding: 'WIOA / WRG Eligible',
    fundingColor: 'text-green-400',
    image: '/images/pages/card-cdl.jpg',
    href: '/programs/cdl-training',
  },
  {
    tag: 'Apprenticeship',
    full: 'Barber Apprenticeship',
    duration: '15–17 months',
    salary: '$35–$65K+/yr',
    funding: 'Fee-Based · $4,980',
    fundingColor: 'text-white',
    image: '/images/pages/barber-apprenticeship.jpg',
    href: '/programs/barber-apprenticeship',
  },
];

function ProgramCard({ prog }: { prog: typeof PROGRAMS[number] }) {
  return (
    <Link href={prog.href} className="group relative rounded-2xl overflow-hidden block" style={{ aspectRatio: '9/14' }}>
      <Image
        src={prog.image}
        alt={prog.full}
        fill
        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-1">{prog.tag}</p>
        <h3 className="font-extrabold text-white text-base leading-snug mb-3">{prog.full}</h3>
        <div className="space-y-1">
          <p className="text-xs text-white">{prog.duration}</p>
          <p className="text-sm font-bold text-green-400">{prog.salary}</p>
          <p className={`text-xs font-semibold ${prog.fundingColor}`}>{prog.funding}</p>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
          View Program →
        </div>
      </div>
    </Link>
  );
}

export function ProgramVideoCards() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {PROGRAMS.map((prog) => (
        <ProgramCard key={prog.full} prog={prog} />
      ))}
    </div>
  );
}
