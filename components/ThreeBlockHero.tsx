import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const heroBlocks = [
  {
    image: "/images/jozanna-george.jpg",
    title: "Beauty & Wellness Programs",
    description: "Barber, Cosmetology, and Esthetics training with state licensure",
    cta: "Explore Beauty Programs",
    href: "/programs/barber",
    badge: "Licensed Careers",
    color: " ",
  },
  {
    image: "/images/sharon-douglas.jpg",
    title: "Healthcare Training",
    description: "CNA, Medical Assistant, and Phlebotomy certifications in weeks",
    cta: "View Healthcare Programs",
    href: "/programs/cna",
    badge: "High Demand",
    color: " ",
  },
  {
    image: "/images/employers/partnership-hiring-event.jpg",
    title: "Direct Job Placement",
    description: "Our staffing team connects you with employers before graduation",
    cta: "Learn About Job Support",
    href: "/career-services",
    badge: "85% Placement Rate",
    color: " ",
  },
];

export default function ThreeBlockHero() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Three Pathways to Success
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto">
            Choose your path, get trained, and start earning. Our team supports you every step of the way.
          </p>
        </div>

        {/* Three Hero Blocks */}
        <div className="grid md:grid-cols-3 gap-6">
          {heroBlocks.map((block, index) => (
            <Link
              key={index}
              href={block.href}
              className="group relative h-[500px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              {/* Background Image */}
              <Image
                src={block.image}
                alt={block.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />

              {/* Content */}
              <div className="relative h-full flex flex-col justify-between p-6 text-white">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-bold self-start">
                  <span>✨</span>
                  <span>{block.badge}</span>
                </div>

                {/* Bottom Content */}
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
                    {block.title}
                  </h3>
                  <p className="text-white/90 mb-6 leading-relaxed">
                    {block.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all">
                    <span>{block.cta}</span>
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
