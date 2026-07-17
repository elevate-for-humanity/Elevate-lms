'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Download, FileText, BookOpen, Search, CheckCircle, 
  Clock, Shield, Award, ArrowRight, Eye, Printer
} from 'lucide-react';

const HANDBOOK_SECTIONS = [
  { id: 1, title: 'Welcome & Introduction', pages: 5, icon: <BookOpen className="w-5 h-5" /> },
  { id: 2, title: 'Program Overview', pages: 8, icon: <Award className="w-5 h-5" /> },
  { id: 3, title: 'Requirements & Standards', pages: 12, icon: <CheckCircle className="w-5 h-5" /> },
  { id: 4, title: 'Code of Conduct', pages: 6, icon: <Shield className="w-5 h-5" /> },
  { id: 5, title: 'Safety & Sanitation', pages: 10, icon: <Shield className="w-5 h-5" /> },
  { id: 6, title: 'OJT Hours & Logging', pages: 7, icon: <Clock className="w-5 h-5" /> },
  { id: 7, title: 'RTI & Coursework', pages: 15, icon: <BookOpen className="w-5 h-5" /> },
  { id: 8, title: 'State Board Exam Prep', pages: 8, icon: <Award className="w-5 h-5" /> },
  { id: 9, title: 'Resources & Support', pages: 6, icon: <Search className="w-5 h-5" /> },
  { id: 10, title: 'Policies & Procedures', pages: 12, icon: <FileText className="w-5 h-5" /> },
];

export default function HandbookPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  const filteredSections = HANDBOOK_SECTIONS.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = () => {
    // Simulate download
    setDownloaded(true);
    // In production, this would trigger actual PDF download
    window.open('/api/handbook/download', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-black text-gray-900">
              ELEVATE<span className="text-amber-500">.</span>
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-bold mb-4">
            <FileText className="w-4 h-4" />
            APPRENTICE HANDBOOK
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Your Complete <span className="text-amber-500">Apprentice Handbook</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about your apprenticeship program, 
            requirements, policies, and resources - all in one place.
          </p>
        </div>

        {/* Download Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-white mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">
                Elevate for Humanity<br />
                Apprentice Handbook 2024
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  89 Pages
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  PDF Format
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Updated 2024
                </span>
              </div>
              <p className="text-gray-400">
                Download your complete handbook now. It's free for all enrolled apprentices.
              </p>
            </div>
            <div className="text-center md:text-right">
              <button
                onClick={handleDownload}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                  downloaded 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400'
                }`}
              >
                <Download className="w-6 h-6" />
                {downloaded ? 'Downloaded!' : 'Download PDF'}
              </button>
              <div className="mt-4 flex gap-4 justify-center md:justify-end">
                <button className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* What's Inside */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What's Inside</h2>
          
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search handbook sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Sections Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredSections.map((section) => (
              <div 
                key={section.id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                  {section.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-500">{section.pages} pages</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/handbook#requirements" className="p-4 bg-gray-50 rounded-xl hover:bg-amber-50 transition-colors">
              <CheckCircle className="w-8 h-8 text-amber-500 mb-2" />
              <h3 className="font-bold text-gray-900">Requirements</h3>
              <p className="text-sm text-gray-500">2,000 hours, RTI, OJT</p>
            </Link>
            <Link href="/handbook#sanitation" className="p-4 bg-gray-50 rounded-xl hover:bg-amber-50 transition-colors">
              <Shield className="w-8 h-8 text-amber-500 mb-2" />
              <h3 className="font-bold text-gray-900">Safety First</h3>
              <p className="text-sm text-gray-500">Infection control guide</p>
            </Link>
            <Link href="/handbook#exam" className="p-4 bg-gray-50 rounded-xl hover:bg-amber-50 transition-colors">
              <Award className="w-8 h-8 text-amber-500 mb-2" />
              <h3 className="font-bold text-gray-900">State Exam</h3>
              <p className="text-sm text-gray-500">Prep & registration</p>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Elevate for Humanity Career & Technical Institute
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/support" className="hover:text-white">Support</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
