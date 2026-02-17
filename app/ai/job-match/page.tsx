'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useState } from 'react';
import { Briefcase, Loader2 } from 'lucide-react';



export default function AIJobMatchPage() {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState('');
  const [matches, setMatches] = useState<any[]>([]);

  const handleMatch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/job-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills }),
      });
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error) {
      /* Error handled silently */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Ai", href: "/ai" }, { label: "Job Match" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange-100 text-brand-orange-900 rounded-full text-sm font-bold mb-6">
            <Briefcase className="w-4 h-4" />
            AI Job Matcher
          </div>
          <h1 className="text-4xl font-black text-black mb-4">
            Find Jobs That Match Your Skills
          </h1>
          <p className="text-xl text-black">
            AI analyzes your skills and recommends the best job opportunities
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <label className="block text-sm font-semibold text-black mb-2">
            What skills do you have?
          </label>
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g., CNA certification, customer service, Microsoft Office, bilingual Spanish..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange-600 focus:border-transparent mb-4"
            rows={4}
          />

          <button
            onClick={handleMatch}
            disabled={loading || !skills.trim()}
            className="w-full bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-bold py-4 rounded-lg transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding Matches...
              </>
            ) : (
              'Find Matching Jobs'
            )}
          </button>
        </div>

        {matches.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-bold text-black">
              Your Job Matches
            </h2>
            {matches.map((match, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-black mb-2">
                  {match.title}
                </h3>
                <p className="text-black mb-4">{match.description}</p>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-2 bg-brand-orange-100 text-brand-orange-700 text-sm font-semibold rounded">
                    {match.matchScore}% Match
                  </span>
                  <span className="text-sm text-black">
                    {match.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
