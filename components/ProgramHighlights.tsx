import Image from 'next/image';

interface Highlight {
  title: string;
  description: string;
  image: string;
}

interface ProgramHighlightsProps {
  highlights?: Highlight[];
}

const defaultHighlights: Highlight[] = [
  {
    title: "No-Cost Training Available",
    description: "No tuition for eligible participants. Funded through WIOA, WRG, and JRI programs.",
    image: "/images/pages/comp-pathway-trades.jpg"
  },
  {
    title: "Earn While You Learn",
    description: "Get paid during training through work-study programs and apprenticeships.",
    image: "/images/pages/comp-pathway-trades.jpg"
  },
  {
    title: "Industry Certification",
    description: "Earn recognized certifications that employers value and actively seek.",
    image: "/images/pages/comp-home-hero.jpg"
  },
  {
    title: "Job Placement Support",
    description: "We connect you with employers hiring in your field. Resume and interview prep included.",
    image: "/images/pages/comp-cta-career.jpg"
  },
  {
    title: "Hands-On Experience",
    description: "Real-world training with actual equipment and industry-standard tools.",
    image: "/images/pages/comp-pathway-trades.jpg"
  },
  {
    title: "Support Services",
    description: "Childcare, transportation, and career counseling to keep you on track.",
    image: "/images/pages/comp-cta-career.jpg"
  }
];

export default function ProgramHighlights({ highlights = defaultHighlights }: ProgramHighlightsProps) {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4">
            Why Choose This Program
          </h2>
          <p className="text-lg sm:text-xl text-black max-w-3xl mx-auto">
            Everything you need to launch your career, completely free
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all group">
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={highlight.image}
                  alt={highlight.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {highlight.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {highlight.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Benefits Bar */}
        <div className="mt-12 bg-brand-orange-50 rounded-lg p-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden">
                <Image
                  src="/images/pages/electrical-wiring.jpg"
                  alt="Small class sizes"
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="font-bold text-black mb-1">Small Classes</h4>
              <p className="text-sm text-black">8-12 students per class</p>
            </div>
            <div>
              <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden">
                <Image
                  src="/images/pages/comp-highlights-team.jpg"
                  alt="Expert instructors"
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="font-bold text-black mb-1">Expert Instructors</h4>
              <p className="text-sm text-black">10+ years experience</p>
            </div>
            <div>
              <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden">
                <Image
                  src="/images/pages/welding-sparks.jpg"
                  alt="Modern equipment"
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="font-bold text-black mb-1">Modern Equipment</h4>
              <p className="text-sm text-black">Industry-standard tools</p>
            </div>
            <div>
              <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden">
                <Image
                  src="/images/pages/comp-highlights-success.jpg"
                  alt="Job placement"
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="font-bold text-black mb-1">Job Placement</h4>
              <p className="text-sm text-black">Employer connections</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
