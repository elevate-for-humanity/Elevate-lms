"use client";

import React from 'react';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  program: string;
  beforeJob: string;
  afterJob: string;
  salary: string;
  videoUrl: string;
  thumbnail: string;
  quote: string;
  duration: string;
  graduationYear: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Maria Rodriguez',
    program: 'Healthcare Assistant',
    beforeJob: 'Retail Associate',
    afterJob: 'Certified Healthcare Assistant at IU Health',
    salary: '$42,000/year',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: '/images/pages/cna-clinical.jpg',
    quote: 'Elevate changed my life. I went from struggling to make ends meet to having a stable career in healthcare.',
    duration: '2:34',
    graduationYear: '2023'
  },
  {
    id: '2',
    name: 'James Thompson',
    program: 'HVAC Technician',
    beforeJob: 'Unemployed',
    afterJob: 'HVAC Technician at Carrier',
    salary: '$55,000/year',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: '/images/pages/hvac-unit.jpg',
    quote: 'The hands-on training prepared me for real-world work. I got hired before I even graduated!',
    duration: '3:12',
    graduationYear: '2023'
  },
  {
    id: '3',
    name: 'Sarah Chen',
    program: 'Medical Coding & Billing',
    beforeJob: 'Restaurant Server',
    afterJob: 'Medical Coder at Community Health Network',
    salary: '$48,000/year',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: '/images/pages/medical-assistant-desk.jpg',
    quote: 'I can work from home now and spend more time with my kids. This program gave me flexibility and financial security.',
    duration: '2:45',
    graduationYear: '2024'
  },
  {
    id: '4',
    name: 'Graduate',
    program: 'CDL Training',
    beforeJob: 'Warehouse Worker',
    afterJob: 'Commercial Truck Driver at Schneider',
    salary: '$65,000/year',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: '/images/pages/cdl-cab-interior.jpg',
    quote: 'In just 4 weeks, I got my CDL and doubled my income. Best decision I ever made.',
    duration: '2:18',
    graduationYear: '2024'
  },
  {
    id: '5',
    name: 'Jennifer Martinez',
    program: 'Cosmetology',
    beforeJob: 'Part-time Cashier',
    afterJob: 'Licensed Cosmetologist, Own Salon',
    salary: '$60,000/year',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: '/images/pages/barber-styling-hair.jpg',
    quote: 'I turned my passion into a career. Now I own my own salon and employ 3 other stylists!',
    duration: '3:45',
    graduationYear: '2023'
  },
  {
    id: '6',
    name: 'David Park',
    program: 'Phlebotomy Technician',
    beforeJob: 'Fast Food Manager',
    afterJob: 'Phlebotomist at Eskenazi Health',
    salary: '$38,000/year',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: '/images/pages/phlebotomy-draw.jpg',
    quote: 'The program was fast-paced but thorough. I felt confident on my first day at work.',
    duration: '2:56',
    graduationYear: '2024'
  }
];

export default function VideoTestimonials() {
  const [selectedVideo, setSelectedVideo] = useState<Testimonial | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const visibleTestimonials = [
    testimonials[currentIndex],
    testimonials[(currentIndex + 1) % testimonials.length],
    testimonials[(currentIndex + 2) % testimonials.length]
  ];

  return (
    <section className="py-20    ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-full text-sm font-semibold mb-4">
            <Quote className="w-4 h-4" />
            Real Stories, Real Success
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            See How Ona Changed Lives
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto">
            Watch real students share their journey from struggle to success. These aren't actors—they're your future colleagues.
          </p>
        </motion.div>

        {/* Video Grid */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-black" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-black" />
          </button>

          {/* Video Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {visibleTestimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300">
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video bg-gray-900 overflow-hidden">
                      <Image
                        src={testimonial.thumbnail}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />

                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedVideo(testimonial)}
                          className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <Play className="w-8 h-8 text-brand-blue-600 ml-1" />
                        </button>
                      </div>

                      {/* Duration Badge */}
                      <div className="absolute bottom-3 right-3 px-2 py-2 bg-black/80 text-white text-xs rounded">
                        {testimonial.duration}
                      </div>

                      {/* Quick Play Button */}
                      <button
                        onClick={() => setSelectedVideo(testimonial)}
                        className="absolute top-3 left-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Play className="w-5 h-5 text-brand-blue-600 ml-0.5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-black mb-1">
                            {testimonial.name}
                          </h3>
                          <p className="text-sm text-brand-blue-600 font-semibold">
                            {testimonial.program}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Class of</div>
                          <div className="text-sm font-bold text-black">{testimonial.graduationYear}</div>
                        </div>
                      </div>

                      {/* Quote */}
                      <div className="mb-4">
                        <Quote className="w-5 h-5 text-brand-blue-600 mb-2" />
                        <p className="text-black text-sm italic line-clamp-3">
                          "{testimonial.quote}"
                        </p>
                      </div>

                      {/* Before/After */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2">
                          <div className="text-xs font-semibold text-gray-500 w-16">BEFORE:</div>
                          <div className="text-sm text-black flex-1">{testimonial.beforeJob}</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="text-xs font-semibold text-brand-green-600 w-16">AFTER:</div>
                          <div className="text-sm text-black font-semibold flex-1">{testimonial.afterJob}</div>
                        </div>
                      </div>

                      {/* Salary */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-black">New Salary:</span>
                          <span className="text-lg font-bold text-brand-green-600">{testimonial.salary}</span>
                        </div>
                      </div>

                      {/* Watch Button */}
                      <button
                        onClick={() => setSelectedVideo(testimonial)}
                        className="w-full mt-4 px-4 py-3    text-white rounded-lg font-semibold hover: hover: transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Watch Full Story
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-brand-blue-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid md:grid-cols-4 gap-8"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-brand-blue-600 mb-2 text-2xl md:text-3xl lg:text-4xl">94%</div>
            <div className="text-black">Graduate Employment Rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-brand-green-600 mb-2 text-2xl md:text-3xl lg:text-4xl">$15K+</div>
            <div className="text-black">Average Salary Increase</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2 text-2xl md:text-3xl lg:text-4xl">2,500+</div>
            <div className="text-black">Success Stories</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-brand-orange-600 mb-2 text-2xl md:text-3xl lg:text-4xl">4.9★</div>
            <div className="text-black">Student Satisfaction</div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-xl text-black mb-6">
            Ready to write your own success story?
          </p>
          <a
            href="/apply"
            className="inline-flex items-center gap-2 px-8 py-4    text-white rounded-lg font-semibold hover: hover: transition-all shadow-lg hover:shadow-xl text-lg"
          >
            Start Your Application
            <ChevronRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl bg-white rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Video */}
              <div className="aspect-video bg-black">
                <iframe
                  src={`${selectedVideo.videoUrl}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Info */}
              <div className="p-6 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-2">
                      {selectedVideo.name}
                    </h3>
                    <p className="text-brand-blue-600 font-semibold mb-2">
                      {selectedVideo.program} • Class of {selectedVideo.graduationYear}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-black">New Salary</div>
                    <div className="text-2xl font-bold text-brand-green-600">{selectedVideo.salary}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-gray-500 mb-1">BEFORE</div>
                    <div className="text-black">{selectedVideo.beforeJob}</div>
                  </div>
                  <div className="bg-brand-green-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-brand-green-600 mb-1">AFTER</div>
                    <div className="text-black font-semibold">{selectedVideo.afterJob}</div>
                  </div>
                </div>

                <div className="bg-brand-blue-50 rounded-lg p-4">
                  <Quote className="w-5 h-5 text-brand-blue-600 mb-2" />
                  <p className="text-black italic">"{selectedVideo.quote}"</p>
                </div>

                <div className="mt-6 flex gap-4">
                  <a
                    href="/apply"
                    className="flex-1 px-6 py-3    text-white rounded-lg font-semibold hover: hover: transition-all text-center"
                  >
                    Apply Now
                  </a>
                  <a
                    href="/programs"
                    className="flex-1 px-6 py-3 bg-gray-100 text-black rounded-lg font-semibold hover:bg-gray-200 transition-all text-center"
                  >
                    View Programs
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
