'use client';

import { useState } from 'react';
import { Search, HelpCircle, ChevronDown } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface FAQSearchProps {
  faqs: FAQ[];
}

export default function FAQSearch({ faqs }: FAQSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredFaqs = searchQuery
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  return (
    <>
      {/* Search Input */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 border border-gray-300 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          aria-label="Search frequently asked questions"
        />
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-gray-600 mb-4">
          {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* FAQ List */}
      <div className="space-y-4" role="list" aria-label="Frequently asked questions">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No questions match your search.</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <details 
              key={faq.id} 
              className="bg-white rounded-lg shadow-sm border group"
              role="listitem"
            >
              <summary 
                className="flex items-center justify-between p-6 cursor-pointer list-none"
                aria-expanded="false"
              >
                <div className="flex items-start gap-4">
                  <HelpCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="font-medium text-gray-900">{faq.question}</span>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" aria-hidden="true" />
              </summary>
              <div className="px-6 pb-6 pl-16">
                <p className="text-gray-600 whitespace-pre-line">{faq.answer}</p>
              </div>
            </details>
          ))
        )}
      </div>
    </>
  );
}
