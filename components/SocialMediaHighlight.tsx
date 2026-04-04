import Image from "next/image";
import Link from "next/link";
import { Facebook, Linkedin, Instagram } from "lucide-react";

export default function SocialMediaHighlight() {
  return (
    <section className="py-20 relative overflow-hidden bg-slate-800">
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

        {/* Social Media Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              href: 'https://www.facebook.com/profile.php?id=61571046346179',
              icon: <Facebook size={24} strokeWidth={2.5} className="text-blue-600" />,
              platform: 'Facebook',
              sub: 'Daily Updates',
              cta: 'Like Our Page',
              img: '/images/delores-reynolds.jpg',
              alt: 'Follow us on Facebook',
              desc: 'Get daily success stories, training updates, and community events. See our graduates in action!',
            },
            {
              href: 'https://www.linkedin.com/in/elevate-for-humanity-b5a2b3339/',
              icon: <Linkedin size={24} strokeWidth={2.5} className="text-blue-700" />,
              platform: 'LinkedIn',
              sub: 'Professional Network',
              cta: 'Follow Us',
              img: '/images/pages/team-hero.jpg',
              alt: 'Connect on LinkedIn',
              desc: 'Connect with our team, see job opportunities, and network with employers hiring our graduates.',
            },
            {
              href: 'https://instagram.com/elevateforhumanity',
              icon: <Instagram size={24} strokeWidth={2.5} className="text-pink-600" />,
              platform: 'Instagram',
              sub: 'Behind the Scenes',
              cta: 'Follow Us',
              img: '/images/team/elizabeth-greene-headshot.jpg',
              alt: 'Follow us on Instagram',
              desc: 'See behind-the-scenes training, student spotlights, and real-time updates from our programs.',
            },
          ].map((s) => (
            <a
              key={s.platform}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all hover:scale-105 hover:shadow-2xl"
            >
              {/* Image — no text overlay */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={s.img}
                  alt={s.alt}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              {/* Content below image */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <p className="font-bold text-white text-base leading-tight">{s.platform}</p>
                    <p className="text-white text-xs">{s.sub}</p>
                  </div>
                </div>
                <p className="text-white text-sm leading-relaxed mb-4">{s.desc}</p>
                <div className="inline-flex items-center gap-2 text-white text-sm font-bold">
                  <span>{s.cta}</span>
                  <span>→</span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-full px-8 py-4 border-2 border-white/30">
            <p className="text-white font-semibold text-lg">
              Follow our mission to elevate communities
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
