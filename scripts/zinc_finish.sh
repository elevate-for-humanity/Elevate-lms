#!/usr/bin/env bash
set -euo pipefail

echo "🧪 zinc: finishing EFH site for production…"

# ---- 0) sanity --------------------------------------------------------------
[ -f package.json ] || { echo "run inside project root"; exit 1; }

# ---- 1) deps ---------------------------------------------------------------
# icons + router (if missing)
npm pkg set dependencies.lucide-react="^0.471.0" >/dev/null
npm pkg set dependencies.react-router-dom="^6.28.0" >/dev/null || true
npm i

# ---- 2) tailwind purge fix -------------------------------------------------
cat > tailwind.config.cjs <<'EOF'
/** hardened by zinc */
module.exports = {
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
EOF
echo "✅ tailwind content globs set"

# ---- 3) SPA + security + cache headers ------------------------------------
cat > netlify.toml <<'EOF'
# hardened by zinc
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
  X-Content-Type-Options = "nosniff"
  X-Frame-Options = "SAMEORIGIN"
  Referrer-Policy = "strict-origin-when-cross-origin"
  Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/images/*"
  [headers.values]
  Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/assets/*"
  [headers.values]
  Cache-Control = "public, max-age=31536000, immutable"
EOF
echo "✅ SPA redirect + headers"

# ---- 4) shared config: branding, nav, footer, socials ---------------------
mkdir -p src/config
cat > src/config/navigation.ts <<'EOF'
/** single source of truth — hardened by zinc */
export interface NavLink { label: string; to: string; items?: NavLink[]; }

export const branding = {
  name: "Elevate for Humanity",
  subtitle: "Career & Technical Institute",
  tagline: "Empowering futures through workforce training",
  location: "Marion County, Indiana",
  phone: "(317) 314-3757",
  phoneRaw: "3173143757",
  email: "info@elevateforhumanity.org",
};

export const mainNavigation: NavLink[] = [
  { label: "Home", to: "/" },
  { label: "Programs", to: "/programs", items: [
    { label: "All Programs", to: "/programs" },
    { label: "Barber Apprenticeship", to: "/programs/barber" },
    { label: "Building Services", to: "/programs/building-tech" },
    { label: "HVAC & Welding", to: "/programs/hvac" },
    { label: "Healthcare CNA/QMA", to: "/programs/healthcare" },
    { label: "Tax & Business", to: "/programs/tax-business" },
    { label: "CPR/AED/First Aid", to: "/programs/cprs" },
    { label: "Digital Skills", to: "/programs/digital-skills" },
  ]},
  { label: "Student Portal", to: "/lms" },
  { label: "About", to: "/about" },
  { label: "Partners", to: "/partners" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

export const ctaButton = { label: "Apply Now", to: "/apply" };

export const footerSections = [
  {
    title: "Programs",
    links: [
      { label: "Barber Apprenticeship", to: "/programs/barber" },
      { label: "Building Services", to: "/programs/building-tech" },
      { label: "HVAC & Welding", to: "/programs/hvac" },
      { label: "Healthcare CNA/QMA", to: "/programs/healthcare" },
      { label: "View All Programs", to: "/programs" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Partners & Employers", to: "/partners" },
      { label: "Contact", to: "/contact" },
      { label: "Apply Now", to: "/apply" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Student Portal", to: "/lms" },
      { label: "Blog", to: "/blog" },
      { label: "FAQ", to: "/faq" },
      { label: "Support", to: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
    ],
  },
];

export const socialLinks = {
  facebook: "https://www.facebook.com/61578240192934/",
  linkedin: "https://linkedin.com/company/elevate-for-humanity",
  youtube: "https://www.youtube.com/@elevateforhumanity",
  instagram: "https://instagram.com/elevateforhumanity",
  twitter: "https://twitter.com/elevate4humanity",
};
EOF
echo "✅ shared config written"

# ---- 5) safe image helper --------------------------------------------------
mkdir -p src/components
cat > src/components/SafeImg.tsx <<'EOF'
import { useState } from "react";

interface SafeImgProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  width?: number;
  height?: number;
}

export default function SafeImg({ 
  src, 
  alt, 
  className = "", 
  fallback = "/images/placeholder.webp", 
  width, 
  height 
}: SafeImgProps) {
  const [s, setS] = useState(src);
  return (
    <img 
      src={s} 
      alt={alt} 
      width={width} 
      height={height} 
      className={className} 
      loading="lazy" 
      decoding="async" 
      onError={() => setS(fallback)} 
    />
  );
}
EOF
echo "✅ SafeImg added"

# ---- 6) professional footer (single source) --------------------------------
cat > src/components/FooterZinc.tsx <<'EOF'
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Linkedin, Youtube, Instagram, Twitter } from "lucide-react";
import { footerSections, socialLinks as defaultSocialLinks, branding } from "../config/navigation";

type SocialMap = Record<string,string>;
const Icons: Record<keyof SocialMap, any> = { 
  facebook: Facebook, 
  linkedin: Linkedin, 
  youtube: Youtube, 
  instagram: Instagram, 
  twitter: Twitter 
} as any;

export default function FooterZinc({ 
  logo = "/logo.svg", 
  logoAlt = branding.name, 
  socialLinks = defaultSocialLinks 
}: {
  logo?: string; 
  logoAlt?: string; 
  socialLinks?: SocialMap;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-12">
          <div className="lg:col-span-4">
            <Link to="/" className="inline-block mb-6">
              <img 
                src={logo} 
                alt={logoAlt} 
                className="h-8 w-auto brightness-0 invert" 
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </Link>
            <h2 className="text-2xl font-bold mb-2">{branding.name}</h2>
            <p className="text-sm text-orange-400 mb-4">{branding.subtitle}</p>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {branding.tagline}. 100% funded programs for {branding.location}.
            </p>
            <div className="space-y-3">
              <a 
                href={`tel:${branding.phoneRaw}`} 
                className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <span className="w-10 h-10 rounded-lg bg-orange-600/20 grid place-items-center">
                  <Phone className="h-5 w-5 text-orange-400"/>
                </span>
                <div>
                  <div className="text-xs text-gray-500">Call Us</div>
                  <div className="font-medium">{branding.phone}</div>
                </div>
              </a>
              <a 
                href={`mailto:${branding.email}`} 
                className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <span className="w-10 h-10 rounded-lg bg-orange-600/20 grid place-items-center">
                  <Mail className="h-5 w-5 text-orange-400"/>
                </span>
                <div>
                  <div className="text-xs text-gray-500">Email Us</div>
                  <div className="font-medium">{branding.email}</div>
                </div>
              </a>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <span className="w-10 h-10 rounded-lg bg-orange-600/20 grid place-items-center">
                  <MapPin className="h-5 w-5 text-orange-400"/>
                </span>
                <div>
                  <div className="text-xs text-gray-500">Location</div>
                  <div className="font-medium">{branding.location}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {footerSections.map(section => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-orange-400">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map(link => (
                    <li key={link.to}>
                      <Link 
                        to={link.to} 
                        className="text-sm text-gray-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-400">
            © {year} {branding.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 mr-1">Follow Us:</span>
            {Object.entries(socialLinks).map(([k, url]) => {
              const Ico = (Icons as any)[k]; 
              if (!Ico) return null;
              return (
                <a 
                  key={k} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-orange-600 grid place-items-center transition-all hover:scale-110" 
                  aria-label={k}
                >
                  <Ico className="h-5 w-5"/>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
EOF
echo "✅ Footer standardized"

# ---- 7) standard navigation component (single source) ---------------------
cat > src/components/NavigationZinc.tsx <<'EOF'
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { mainNavigation, ctaButton, branding } from "../config/navigation";

export default function NavigationZinc({ logo = "/logo.svg" }: { logo?: string }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const isActive = (to: string) => to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);
  
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt={branding.name} className="h-7 w-auto" />
          <span className="font-semibold text-slate-900">{branding.name}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {mainNavigation.map((l) => (
            <div key={l.to} className="relative group">
              <Link 
                to={l.to} 
                className={`text-sm transition-colors ${
                  isActive(l.to) 
                    ? "text-amber-700 font-semibold" 
                    : "text-slate-700 hover:text-amber-700"
                }`}
              >
                {l.label}
              </Link>
              {l.items?.length ? (
                <div className="invisible group-hover:visible absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-64 z-50">
                  <ul className="space-y-1">
                    {l.items.map(it => (
                      <li key={it.to}>
                        <Link 
                          to={it.to} 
                          className="block rounded px-2 py-1 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
          <Link 
            to={ctaButton.to} 
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            {ctaButton.label}
          </Link>
        </nav>
        <button 
          className="md:hidden text-slate-700 text-2xl" 
          onClick={() => setOpen(v => !v)} 
          aria-label="Menu"
        >
          ☰
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 lg:px-6 py-3 space-y-2">
            {mainNavigation.map(l => (
              <Link 
                key={l.to} 
                to={l.to} 
                className={`block px-3 py-2 rounded transition-colors ${
                  isActive(l.to)
                    ? "bg-amber-50 text-amber-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link 
              to={ctaButton.to} 
              className="block text-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              onClick={() => setOpen(false)}
            >
              {ctaButton.label}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
EOF
echo "✅ Navigation standardized"

# ---- 8) robots + sitemap + basic meta -------------------------------------
mkdir -p public
cat > public/robots.txt <<'EOF'
User-agent: *
Allow: /
Sitemap: https://portal.elevateforhumanity.org/sitemap.xml
EOF

cat > public/sitemap.xml <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://portal.elevateforhumanity.org/</loc><priority>1.0</priority></url>
  <url><loc>https://portal.elevateforhumanity.org/programs</loc><priority>0.9</priority></url>
  <url><loc>https://portal.elevateforhumanity.org/partners</loc><priority>0.8</priority></url>
  <url><loc>https://portal.elevateforhumanity.org/apply</loc><priority>0.9</priority></url>
  <url><loc>https://portal.elevateforhumanity.org/contact</loc><priority>0.7</priority></url>
  <url><loc>https://portal.elevateforhumanity.org/privacy</loc><priority>0.5</priority></url>
  <url><loc>https://portal.elevateforhumanity.org/terms</loc><priority>0.5</priority></url>
</urlset>
EOF
echo "✅ robots + sitemap"

# ---- 9) image folder ensure ----------------------------------------------
mkdir -p public/images/partners
touch public/images/.gitkeep
echo "✅ images/partners ready (add your real logos as WebP/SVG)"

# ---- 10) completion message -----------------------------------------------
echo ""
echo "🎉 zinc finish complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm run build"
echo "2. Test: npm run preview"
echo "3. Add images to public/images/"
echo "4. Deploy: git add . && git commit -m 'Zinc hardening' && git push"
echo ""
echo "See ZINC_CHECKLIST.md for remaining tasks"
