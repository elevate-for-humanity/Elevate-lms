'use client';

import { useState } from 'react';
import { FAQAccordion } from './FAQAccordion';
import { FAQSearch } from './FAQSearch';
import {
  BookOpen,
  DollarSign,
  Rocket,
  Users,
  Laptop,
  Star,
} from 'lucide-react';

const iconMap = {
  BookOpen,
  DollarSign,
  Rocket,
  Users,
  Laptop,
  Star,
} as const;

interface FAQQuestion {
  q: string;
  a: string;
}

interface FAQCategory {
  id: string;
  name: string;
  iconName: keyof typeof iconMap;
  questions: FAQQuestion[];
}

interface FAQClientProps {
  categories: FAQCategory[];
}

export function FAQClient({ categories }: FAQClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <>
      {/* Search Section */}
      <section className="bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Find answers to common questions about our programs, funding, and support
            </p>
            <FAQSearch onSearch={setSearchQuery} />
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 bg-gray-50 sticky top-0 z-10 border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-3 rounded-xl font-bold transition ${
                activeCategory === 'all'
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              aria-pressed={activeCategory === 'all'}
            >
              All Questions
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-3 rounded-xl font-bold transition ${
                  activeCategory === category.id
                    ? 'bg-brand-blue-600 text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
                aria-pressed={activeCategory === category.id}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FAQAccordion
            categories={categories}
            searchQuery={searchQuery}
            activeCategory={activeCategory}
          />
        </div>
      </section>
    </>
  );
}
