import Image from "next/image";
import { Facebook, Linkedin, Instagram } from "lucide-react";

export default function SocialMediaHighlight() {
  return (
    <section className="py-20     relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Follow Our Journey
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            See daily success stories, training updates, and community impact. Follow our mission to elevate communities.
          </p>
        </div>

        {/* Social Media Grid with Team Photos */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Facebook */}
          <a
            href="https://www.facebook.com/profile.php?id=61571046346179"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src="/images/delores-reynolds.jpg"
                alt="Follow us on Facebook"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-full bg-brand-blue-600 flex items-center justify-center shadow-lg">
                    <Facebook size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Facebook</p>
                    <p className="text-sm text-white/90">Daily Updates</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 text-white">
              <p className="text-sm leading-relaxed mb-4">
                Get daily success stories, training updates, and community events. See our graduates in action!
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <span>Like Our Page</span>
                <span>→</span>
              </div>
            </div>
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/elevate-for-humanity-b5a2b3339/"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src="/images/pages/heroes-hq/team-hero.jpg"
                alt="Connect on LinkedIn"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-full bg-brand-blue-700 flex items-center justify-center shadow-lg">
                    <Linkedin size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-lg">LinkedIn</p>
                    <p className="text-sm text-white/90">Professional Network</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 text-white">
              <p className="text-sm leading-relaxed mb-4">
                Connect with our team, see job opportunities, and network with employers hiring our graduates.
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <span>Follow Us</span>
                <span>→</span>
              </div>
            </div>
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com/elevateforhumanity"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src="/images/team/elizabeth-greene-headshot.jpg"
                alt="Follow us on Instagram"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-full    flex items-center justify-center shadow-lg">
                    <Instagram size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Instagram</p>
                    <p className="text-sm text-white/90">Behind the Scenes</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 text-white">
              <p className="text-sm leading-relaxed mb-4">
                See behind-the-scenes training, student spotlights, and real-time updates from our programs.
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <span>Follow Us</span>
                <span>→</span>
              </div>
            </div>
          </a>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-full px-8 py-4 border-2 border-white/30">
            <p className="text-white font-semibold text-lg">
              Join 5,000+ followers staying updated on workforce development
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
