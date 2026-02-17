import React from 'react';
import Link from 'next/link';
import { FileText, Home } from 'lucide-react';

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-orange-600" />
            <h1 className="text-2xl font-bold text-black">Policies & Compliance</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-black">
            <Link href="/" aria-label="Link" className="hover:text-orange-600 flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <span>/</span>
            <span>Policies</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {children}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-sm text-black text-center">
            Questions about our policies? Contact us at{' '}
            <a href="mailto:info@elevateforhumanity.org" className="text-orange-600 hover:text-orange-700">
              info@elevateforhumanity.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
