import Link from 'next/link';
import { Heart, ExternalLink } from 'lucide-react';

export function AdminFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <span className="text-white font-black text-lg">E</span>
              </div>
              <div>
                <span className="font-black text-lg">Elevate</span>
                <span className="text-orange-400 font-light">Admin</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm">
              Empowering workforce development through quality education and career placement.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-sm mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">Dashboard</Link></li>
              <li><Link href="/applications" className="text-slate-400 hover:text-white text-sm transition-colors">Applications</Link></li>
              <li><Link href="/students" className="text-slate-400 hover:text-white text-sm transition-colors">Students</Link></li>
              <li><Link href="/programs" className="text-slate-400 hover:text-white text-sm transition-colors">Programs</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-sm mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="https://docs.elevateforhumanity.org" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white text-sm transition-colors">Help Center</a></li>
              <li><a href="https://docs.elevateforhumanity.org" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white text-sm transition-colors">Documentation</a></li>
              <li><Link href="/api-keys" className="text-slate-400 hover:text-white text-sm transition-colors">API Keys</Link></li>
              <li><Link href="/system-health" className="text-slate-400 hover:text-white text-sm transition-colors">System Status</Link></li>
            </ul>
          </div>

          {/* External Links */}
          <div>
            <h3 className="font-bold text-sm mb-4">External</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://www.elevateforhumanity.org" target="_blank" rel="noopener noreferrer" 
                   className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1">
                  Main Website <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://app.elevateforhumanity.org" target="_blank" rel="noopener noreferrer" 
                   className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1">
                  Student LMS <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://workoneindy.com" target="_blank" rel="noopener noreferrer" 
                   className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-1">
                  WorkOne <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            © {currentYear} Elevate for Humanity. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm flex items-center gap-1">
            Built with <Heart className="w-4 h-4 text-red-500" /> for workforce development
          </p>
        </div>
      </div>
    </footer>
  );
}
