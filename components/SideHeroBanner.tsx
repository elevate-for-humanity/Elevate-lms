import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SideHeroBanner() {
  return (
    <section className="py-16   ">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Content */}
          <div className="text-black">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-sm font-bold mb-6 text-white">
              <span>💼</span>
              <span>100% Job Placement Support</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Your Career Starts Here
            </h2>
            <p className="text-xl text-black mb-8 leading-relaxed">
              Our dedicated team connects you with employers before you even graduate. Real training, real credentials, real jobs waiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-500 text-white font-bold rounded-lg hover:bg-brand-orange-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Start Your Application
                <ArrowRight size={20} className="ml-2" />
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-teal-600 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-all"
              >
                Browse Programs
              </Link>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <Image loading="lazy"
              src="/images/location-9.jpg"
              alt="Elevate For Humanity - Career Training Center"
              fill
          sizes="100vw"
              className="object-cover"
              quality={100}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
