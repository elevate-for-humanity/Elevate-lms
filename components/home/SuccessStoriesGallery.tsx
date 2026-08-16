'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, Star, MapPin, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useAnimatedCounter';

interface SuccessStoriesGalleryProps {
  className?: string;
}

interface Story {
  id: number;
  name: string;
  program: string;
  quote: string;
  outcome: string;
  location: string;
  yearsAgo: number;
  image: string;
  featured: boolean;
}

const STORIES: Story[] = [
  {
    id: 1,
    name: 'Marcus J.',
    program: 'Barbering',
    quote: 'I went from collecting unemployment to making $55,000 a year in just 18 months. The apprenticeship model meant I earned while I learned.',
    outcome: 'Now Owns His Own Barbershop',
    location: 'Indianapolis, IN',
    yearsAgo: 2,
    image: '/images/testimonials-hq/person-1.jpg',
    featured: true,
  },
  {
    id: 2,
    name: 'Sarah T.',
    program: 'HVAC Technician',
    quote: 'The funding covered everything. I didn\'t pay a dime out of pocket. Now I\'m working for a major commercial HVAC company.',
    outcome: 'Earned EPA 608 Certification',
    location: 'Carmel, IN',
    yearsAgo: 1,
    image: '/images/testimonials-hq/person-2.jpg',
    featured: true,
  },
  {
    id: 3,
    name: 'David R.',
    program: 'CDL Training',
    quote: 'I was driving for $15/hour. Six months after getting my CDL through this program, I\'m making $72,000 with benefits.',
    outcome: 'Family-Sustaining Income',
    location: 'Fort Wayne, IN',
    yearsAgo: 1,
    image: '/images/testimonials/student-david.jpg',
    featured: true,
  },
  {
    id: 4,
    name: 'Maria G.',
    program: 'CNA + Medication Aide',
    quote: 'As a single mom, I needed something that would work around my kids. The flexible schedule made it possible.',
    outcome: 'Now Works at Local Hospital',
    location: 'South Bend, IN',
    yearsAgo: 2,
    image: '/images/testimonials-hq/person-3.jpg',
    featured: false,
  },
  {
    id: 5,
    name: 'James W.',
    program: 'Barbering',
    quote: 'I was skeptical at first, but the instructors really care about your success. They helped me land my first job before I even finished.',
    outcome: 'Employed at Premier Barbershop',
    location: 'Bloomington, IN',
    yearsAgo: 3,
    image: '/images/testimonials/james.jpg',
    featured: false,
  },
  {
    id: 6,
    name: 'Ashley M.',
    program: 'Medical Billing',
    quote: 'The online option made it easy to study while working. My certification opened doors I didn\'t know existed.',
    outcome: 'Promoted to Office Manager',
    location: 'Evansville, IN',
    yearsAgo: 2,
    image: '/images/testimonials-hq/person-4.jpg',
    featured: false,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
}

function StoryCard({ story, featured }: { story: Story; featured?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
        featured ? 'lg:col-span-2' : ''
      }`}
    >
      <div className="p-6">
        {/* Quote Icon */}
        <Quote className="w-8 h-8 text-brand-red-200 mb-4" />
        
        {/* Quote */}
        <p className="text-slate-700 text-lg mb-6 leading-relaxed">
          "{story.quote}"
        </p>
        
        {/* Rating */}
        <div className="mb-4">
          <StarRating rating={5} />
        </div>
        
        {/* Author */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-red-500 to-brand-red-600 flex items-center justify-center text-white font-bold text-xl">
            {story.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900">{story.name}</p>
            <p className="text-sm text-brand-red-600">{story.program}</p>
          </div>
        </div>
        
        {/* Outcome Badge */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            {story.outcome}
          </p>
        </div>
        
        {/* Meta */}
        <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {story.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {story.yearsAgo} {story.yearsAgo === 1 ? 'year' : 'years'} ago
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function SuccessStoriesGallery({ className = '' }: SuccessStoriesGalleryProps) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [currentSlide, setCurrentSlide] = useState(0);
  const featuredStories = STORIES.filter(s => s.featured);
  const regularStories = STORIES.filter(s => !s.featured);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredStories.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredStories.length) % featuredStories.length);
  };

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 bg-white ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-100 border border-brand-red-200 rounded-full text-brand-red-700 text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            Graduate Success Stories
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            From Our Graduates
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Real stories from real graduates who transformed their careers through Elevate programs.
            Every journey starts with a single step.
          </p>
        </motion.div>

        {/* Featured Stories Carousel */}
        <div className="mb-12">
          <div className="relative">
            <div className="overflow-hidden">
              <motion.div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {featuredStories.map((story) => (
                  <div key={story.id} className="w-full flex-shrink-0 px-4">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 lg:p-12 text-white">
                      <div className="grid lg:grid-cols-2 gap-8 items-center">
                        <div>
                          <Quote className="w-12 h-12 text-brand-red-500 mb-6" />
                          <p className="text-2xl lg:text-3xl font-medium leading-relaxed mb-6">
                            "{story.quote}"
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-red-500 to-brand-red-600 flex items-center justify-center text-white font-bold text-2xl">
                              {story.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xl font-bold">{story.name}</p>
                              <p className="text-brand-red-400">{story.program}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                            <p className="text-sm text-white/60 mb-2">Outcome</p>
                            <p className="text-xl font-bold text-brand-red-400">{story.outcome}</p>
                          </div>
                          <div className="flex items-center gap-6 text-white/80">
                            <span className="flex items-center gap-2">
                              <MapPin className="w-5 h-5" />
                              {story.location}
                            </span>
                            <span className="flex items-center gap-2">
                              <Calendar className="w-5 h-5" />
                              {story.yearsAgo} {story.yearsAgo === 1 ? 'year' : 'years'} ago
                            </span>
                          </div>
                          <StarRating rating={5} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
            
            {/* Carousel Controls */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-slate-600" />
            </button>
          </div>
          
          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {featuredStories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-brand-red-600' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Regular Stories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-slate-600 mb-6">
            Ready to write your own success story?
          </p>
          <a
            href="/apply"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors shadow-lg shadow-brand-red-600/30"
          >
            Start Your Journey Today
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default SuccessStoriesGallery;
