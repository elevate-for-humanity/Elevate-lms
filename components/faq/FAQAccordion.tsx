'use client';

import { useState } from 'react';
import {
  ChevronDown,
  BookOpen,
  DollarSign,
  Rocket,
  Users,
  Laptop,
  Star,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  DollarSign,
  Rocket,
  Users,
  Laptop,
  Star,
};

interface FAQQuestion {
  q: string;
  a: string;
}

interface FAQCategory {
  id: string;
  name: string;
  iconName: string;
  questions: FAQQuestion[];
}

interface FAQAccordionProps {
  categories: FAQCategory[];
  searchQuery?: string;
  activeCategory?: string;
}

export function FAQAccordion({ categories, searchQuery = '', activeCategory = 'all' }: FAQAccordionProps) {
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (categoryId: string, questionIndex: number) => {
    const key = `${categoryId}-${questionIndex}`;
    const newOpenQuestions = new Set(openQuestions);
    if (newOpenQuestions.has(key)) {
      newOpenQuestions.delete(key);
    } else {
      newOpenQuestions.add(key);
    }
    setOpenQuestions(newOpenQuestions);
  };

  // Filter categories and questions based on search and active category
  const filteredCategories = categories
    .filter((category) => activeCategory === 'all' || activeCategory === category.id)
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (faq) =>
          searchQuery === '' ||
          faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0);

  if (filteredCategories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600 mb-4">No results found for "{searchQuery}"</p>
        <p className="text-gray-500">Try different keywords or browse all categories</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {filteredCategories.map((category) => (
        <div key={category.id}>
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
              {(() => {
                const Icon = iconMap[category.iconName];
                return Icon ? <Icon className="w-6 h-6 text-brand-blue-600" /> : null;
              })()}
            </div>
            {category.name}
          </h2>
          <div className="space-y-4">
            {category.questions.map((faq, index) => {
              const isOpen = openQuestions.has(`${category.id}-${index}`);
              return (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-brand-blue-600 transition"
                >
                  <button
                    onClick={() => toggleQuestion(category.id, index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${category.id}-${index}`}
                  >
                    <span className="font-bold text-black pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div
                      id={`faq-${category.id}-${index}`}
                      className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200"
                    >
                      <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
