type Program = {
  slug: string;
  title: string;
  track: 'Healthcare' | 'Construction' | 'Beauty' | 'Business' | 'Tech';
  blurb: string;
  hours: string;
  certs?: string[];
  image: string;
};

const PROGRAMS: Program[] = [
  {
    slug: 'cna-hha',
    title: 'CNA / HHA',
    track: 'Healthcare',
    blurb:
      'Become a Certified Nursing Assistant or Home Health Aide. Get real clinical experience and start helping people right away.',
    hours: '4–8 weeks',
    certs: ['CNA', 'HHA', 'CPR/AED'],
    image: '/programs/cna.jpg',
  },
  {
    slug: 'welding-aws',
    title: 'Welding (AWS SENSE)',
    track: 'Construction',
    blurb:
      'Learn professional welding in our hands-on lab. Earn your AWS SENSE certification and start a high-paying career.',
    hours: '6–10 weeks',
    certs: ['AWS SENSE'],
    image: '/programs/welding.jpg',
  },
  {
    slug: 'nail-tech',
    title: 'Nail Technology',
    track: 'Beauty',
    blurb:
      'Master nail art, sanitation, and salon skills. Get ready for your state board exam and start your own business or work in top salons.',
    hours: '8–12 weeks',
    certs: ['State Board Prep'],
    image: '/programs/nails.jpg',
  },
  {
    slug: 'cdl',
    title: 'CDL (A/B) Prep',
    track: 'Business',
    blurb:
      "Get your Commercial Driver's License and access high-demand trucking jobs. Includes permit prep and simulator training.",
    hours: '3–6 weeks',
    certs: ['CDL A/B Prep'],
    image: '/programs/cdl.jpg',
  },
  {
    slug: 'office-tech',
    title: 'Office Tech & AI',
    track: 'Tech',
    blurb:
      'Learn modern office software, AI tools, and digital workflows. Perfect for administrative and remote work careers.',
    hours: '4–6 weeks',
    certs: ['Certiport (optional)'],
    image: '/programs/office.jpg',
  },
  {
    slug: 'osha10',
    title: 'OSHA-10 + CPR',
    track: 'Construction',
    blurb:
      'Get essential safety certifications for construction work. Learn life-saving CPR/AED skills and workplace safety basics.',
    hours: '1–2 weeks',
    certs: ['OSHA-10', 'CPR/AED'],
    image: '/programs/osha.jpg',
  },
];

import Image from 'next/image';
import Link from 'next/link';

export default function ProgramsGrid() {
  return (
    <section className="section bg-slate-50">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Empower Your Future Today
          </h2>
          <p className="text-lg text-black leading-relaxed">
            Join our transformative programs and unlock career opportunities that align with
            industry demands. Flexible, grant-funded options mean more possibilities for growth.
          </p>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((p) => (
            <a key={p.slug} href={`/programs/${p.slug}`} className="card overflow-hidden group">
              <div className="aspect-[16/9] overflow-hidden relative">
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-brand-50 text-brand-700 px-2.5 py-2 text-xs font-semibold">
                    {p.track}
                  </span>
                  <span className="text-xs text-slate-500">{p.hours}</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-black">{p.blurb}</p>
                {!!p.certs?.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.certs.map((c) => (
                      <span
                        key={c}
                        className="text-xs text-black bg-slate-100 px-2 py-2 rounded-full"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <span className="btn-outline">View Program</span>
                </div>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Link href="/apply" className="btn">
            Apply Now
          </Link>
        </div>
      </div>
    </section>
  );
}
