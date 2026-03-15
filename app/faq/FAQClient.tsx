'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  HelpCircle, ChevronDown, Search, MessageSquare, ThumbsUp, ThumbsDown, 
  Share2, Printer, TrendingUp, Clock, Twitter, Facebook, Linkedin, Copy, Check
} from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  view_count?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
}

interface FAQClientProps {
  faqs: FAQ[];
  categories: Category[];
  popularIds: string[];
}

export default function FAQClient({ faqs, categories, popularIds }: FAQClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, 'yes' | 'no' | null>>({});
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);

  // Load recently viewed from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('faq_recently_viewed');
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Track FAQ view
  const trackView = (faqId: string) => {
    const updated = [faqId, ...recentlyViewed.filter(id => id !== faqId)].slice(0, 5);
    setRecentlyViewed(updated);
    localStorage.setItem('faq_recently_viewed', JSON.stringify(updated));
    
    // Track analytics
    fetch('/api/analytics/faq-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faq_id: faqId }),
    }).catch(() => {});
  };

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    let result = faqs;

    if (selectedCategory) {
      result = result.filter(faq => faq.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [faqs, searchQuery, selectedCategory]);

  // Get related questions based on tags
  const getRelatedQuestions = (faq: FAQ) => {
    if (!faq.tags || faq.tags.length === 0) return [];
    
    return faqs
      .filter(f => f.id !== faq.id && f.tags?.some(tag => faq.tags?.includes(tag)))
      .slice(0, 3);
  };

  // Highlight search terms in text
  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
      ) : part
    );
  };

  // Handle helpful vote
  const handleVote = async (faqId: string, helpful: boolean) => {
    setHelpfulVotes(prev => ({ ...prev, [faqId]: helpful ? 'yes' : 'no' }));
    
    fetch('/api/analytics/faq-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faq_id: faqId, helpful }),
    }).catch(() => {});
  };

  // Share functions
  const shareUrl = (faqId: string) => `${typeof window !== 'undefined' ? window.location.origin : ''}/faq#${faqId}`;
  
  const copyLink = async (faqId: string) => {
    await navigator.clipboard.writeText(shareUrl(faqId));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    setShowShareMenu(null);
  };

  const shareToTwitter = (faq: FAQ) => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(faq.question)}&url=${encodeURIComponent(shareUrl(faq.id))}`, '_blank');
    setShowShareMenu(null);
  };

  const shareToFacebook = (faq: FAQ) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl(faq.id))}`, '_blank');
    setShowShareMenu(null);
  };

  const shareToLinkedIn = (faq: FAQ) => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl(faq.id))}`, '_blank');
    setShowShareMenu(null);
  };

  // Print FAQ
  const printFaq = (faq: FAQ) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${faq.question} - Elevate FAQ</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            h1 { font-size: 24px; color: #1f2937; margin-bottom: 20px; }
            p { font-size: 16px; line-height: 1.6; color: #4b5563; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <h1>${faq.question}</h1>
          <p>${faq.answer}</p>
          <div class="footer">
            <p>Elevate For Humanity - www.elevateforhumanity.org</p>
            <p>Printed on ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Recently viewed FAQs
  const recentFaqs = recentlyViewed
    .map(id => faqs.find(f => f.id === id))
    .filter(Boolean) as FAQ[];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-orange-500 to-brand-orange-600 text-white pt-24 pb-16 lg:pt-32">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-brand-orange-100 max-w-2xl mb-8">
            Find answers to common questions about our programs and services.
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-orange-300"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !selectedCategory ? 'bg-brand-orange-100 text-brand-orange-700 font-medium' : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  All Questions
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat.name ? 'bg-brand-orange-100 text-brand-orange-700 font-medium' : 'text-gray-600 hover:bg-white'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recently Viewed */}
            {recentFaqs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recently Viewed
                </h3>
                <div className="space-y-2">
                  {recentFaqs.map((faq) => (
                    <button
                      key={faq.id}
                      onClick={() => {
                        setOpenFaqId(faq.id);
                        document.getElementById(`faq-${faq.id}`)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left text-sm text-gray-600 hover:text-brand-orange-600 line-clamp-2"
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Questions */}
            <div className="bg-brand-orange-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-orange-500" />
                Popular Questions
              </h3>
              <div className="space-y-2">
                {faqs.filter(f => popularIds.includes(f.id)).map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => {
                      setOpenFaqId(faq.id);
                      document.getElementById(`faq-${faq.id}`)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full text-left text-sm text-gray-600 hover:text-brand-orange-600 line-clamp-2"
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {searchQuery && (
              <p className="text-sm text-gray-500 mb-4">
                {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            )}

            <div className="space-y-4">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                const relatedQuestions = getRelatedQuestions(faq);
                const isPopular = popularIds.includes(faq.id);

                return (
                  <div
                    key={faq.id}
                    id={`faq-${faq.id}`}
                    className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 ${
                      isOpen ? 'ring-2 ring-brand-orange-200' : ''
                    }`}
                  >
                    <button
                      onClick={() => {
                        setOpenFaqId(isOpen ? null : faq.id);
                        if (!isOpen) trackView(faq.id);
                      }}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <HelpCircle className="w-6 h-6 text-brand-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 block">
                            {highlightText(faq.question)}
                          </span>
                          {isPopular && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-brand-orange-600 bg-brand-orange-100 px-2 py-0.5 rounded-full">
                              <TrendingUp className="w-3 h-3" />
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Answer with animation */}
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                      <div className="px-6 pb-6 pl-16">
                        <p className="text-gray-600 mb-4">{highlightText(faq.answer)}</p>

                        {/* Related Questions */}
                        {relatedQuestions.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Related Questions</h4>
                            <div className="space-y-1">
                              {relatedQuestions.map((related) => (
                                <button
                                  key={related.id}
                                  onClick={() => {
                                    setOpenFaqId(related.id);
                                    trackView(related.id);
                                    document.getElementById(`faq-${related.id}`)?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="block text-sm text-brand-orange-600 hover:text-brand-orange-700 hover:underline"
                                >
                                  → {related.question}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                          {/* Helpful Vote */}
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">Was this helpful?</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleVote(faq.id, true)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                  helpfulVotes[faq.id] === 'yes'
                                    ? 'bg-brand-green-100 text-brand-green-700'
                                    : 'bg-white text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <ThumbsUp className="w-4 h-4" />
                                Yes
                              </button>
                              <button
                                onClick={() => handleVote(faq.id, false)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                  helpfulVotes[faq.id] === 'no'
                                    ? 'bg-brand-red-100 text-brand-red-700'
                                    : 'bg-white text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <ThumbsDown className="w-4 h-4" />
                                No
                              </button>
                            </div>
                          </div>

                          {/* Share & Print */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => printFaq(faq)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg"
                              title="Print"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setShowShareMenu(showShareMenu === faq.id ? null : faq.id)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg"
                                title="Share"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              {showShareMenu === faq.id && null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or browse all categories.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="text-brand-orange-600 hover:text-brand-orange-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Contact CTA */}
            <div className="mt-12 bg-brand-orange-50 rounded-xl p-8 text-center">
              <MessageSquare className="w-12 h-12 text-brand-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
              <p className="text-gray-600 mb-4">Our team is here to help you find the answers you need.</p>
              <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-orange-600 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
