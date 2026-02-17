'use client';

import React from 'react';

import { useState, useMemo } from 'react';
import Link from 'next/link';

import {
  Search,
  Filter,
  ShoppingCart,
  Clock,
  Award,
  DollarSign,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// Partner course data from catalog
const PARTNER_COURSES = {
  certiport: {
    name: 'Certiport',
    description: 'Microsoft, Adobe, and IT certifications',
    markup: 1.4,
    courses: [
      {
        id: 'mos-word',
        name: 'MOS: Word Associate (Office 2019)',
        category: 'Microsoft Office',
        price: 117,
        duration: 40,
      },
      {
        id: 'mos-excel',
        name: 'MOS: Excel Associate (Office 2019)',
        category: 'Microsoft Office',
        price: 117,
        duration: 40,
      },
      {
        id: 'mos-powerpoint',
        name: 'MOS: PowerPoint (Office 2019)',
        category: 'Microsoft Office',
        price: 117,
        duration: 30,
      },
      {
        id: 'adobe-photoshop',
        name: 'Adobe Certified Professional: Photoshop',
        category: 'Adobe Creative',
        price: 150,
        duration: 60,
      },
      {
        id: 'adobe-illustrator',
        name: 'Adobe Certified Professional: Illustrator',
        category: 'Adobe Creative',
        price: 150,
        duration: 60,
      },
      {
        id: 'ic3-computing',
        name: 'IC3 Digital Literacy: Computing Fundamentals',
        category: 'Digital Literacy',
        price: 117,
        duration: 30,
      },
      {
        id: 'it-cybersecurity',
        name: 'IT Specialist: Cybersecurity',
        category: 'IT Certifications',
        price: 117,
        duration: 40,
      },
      {
        id: 'it-python',
        name: 'IT Specialist: Python',
        category: 'IT Certifications',
        price: 117,
        duration: 50,
      },
      {
        id: 'quickbooks',
        name: 'Intuit Certified QuickBooks User',
        category: 'Accounting',
        price: 150,
        duration: 40,
      },
    ],
  },
  hsi: {
    name: 'HSI',
    description: 'CPR, First Aid, and Safety Training',
    markup: 1.59,
    courses: [
      {
        id: 'cpr-adult',
        name: 'Adult CPR/AED',
        category: 'CPR & First Aid',
        price: 85,
        duration: 2,
      },
      {
        id: 'first-aid',
        name: 'Adult First Aid',
        category: 'CPR & First Aid',
        price: 85,
        duration: 2,
      },
      {
        id: 'cpr-combo',
        name: 'Adult CPR/AED + First Aid',
        category: 'CPR & First Aid',
        price: 100,
        duration: 3,
      },
      {
        id: 'bls',
        name: 'BLS for Healthcare Providers',
        category: 'CPR & First Aid',
        price: 100,
        duration: 4,
      },
      {
        id: 'bloodborne',
        name: 'Bloodborne Pathogens',
        category: 'Healthcare Safety',
        price: 50,
        duration: 1,
      },
      {
        id: 'fire-safety',
        name: 'Fire Safety',
        category: 'Workplace Safety',
        price: 45,
        duration: 1,
      },
      {
        id: 'food-handler',
        name: 'Food Handler Training',
        category: 'Food Safety',
        price: 40,
        duration: 2,
      },
    ],
  },
  jri: {
    name: 'JRI',
    description: 'Healthcare Certifications',
    markup: 1.5,
    courses: [
      {
        id: 'ccma',
        name: 'Certified Clinical Medical Assistant (CCMA)',
        category: 'Medical Assistant',
        price: 150,
        duration: 120,
      },
      {
        id: 'cpt',
        name: 'Certified Phlebotomy Technician (CPT)',
        category: 'Phlebotomy',
        price: 150,
        duration: 80,
      },
      {
        id: 'ekg',
        name: 'Certified EKG Technician (CET)',
        category: 'EKG/ECG',
        price: 150,
        duration: 60,
      },
      {
        id: 'pharmacy',
        name: 'Certified Pharmacy Technician (CPhT)',
        category: 'Pharmacy',
        price: 200,
        duration: 120,
      },
      {
        id: 'cpc',
        name: 'Certified Professional Coder (CPC)',
        category: 'Medical Billing & Coding',
        price: 300,
        duration: 160,
      },
    ],
  },
  careersafe: {
    name: 'CareerSafe',
    description: 'OSHA Safety Training',
    markup: 1.4,
    courses: [
      {
        id: 'osha-10-general',
        name: 'OSHA 10-Hour General Industry',
        category: 'OSHA Safety',
        price: 25,
        duration: 10,
      },
      {
        id: 'osha-10-construction',
        name: 'OSHA 10-Hour Construction',
        category: 'OSHA Safety',
        price: 25,
        duration: 10,
      },
      {
        id: 'osha-30-general',
        name: 'OSHA 30-Hour General Industry',
        category: 'OSHA Safety',
        price: 45,
        duration: 30,
      },
      {
        id: 'forklift',
        name: 'Forklift Safety Certification',
        category: 'Equipment Safety',
        price: 35,
        duration: 4,
      },
      {
        id: 'confined-space',
        name: 'Confined Space Entry',
        category: 'Workplace Safety',
        price: 35,
        duration: 4,
      },
    ],
  },
  milady: {
    name: 'Milady',
    description: 'Beauty & Cosmetology',
    markup: 1.6,
    courses: [
      {
        id: 'rise-cosmetology',
        name: 'RISE Cosmetology Certification',
        category: 'Cosmetology',
        price: 29.95,
        duration: 20,
      },
      {
        id: 'rise-barbering',
        name: 'RISE Barbering Certification',
        category: 'Barbering',
        price: 29.95,
        duration: 20,
      },
      {
        id: 'rise-esthetics',
        name: 'RISE Esthetics Certification',
        category: 'Esthetics',
        price: 29.95,
        duration: 20,
      },
      {
        id: 'makeup-pro',
        name: 'Professional Makeup Certification - Inspire',
        category: 'Makeup Artistry',
        price: 365,
        duration: 40,
      },
      {
        id: 'nail-tech',
        name: 'Nail Technology Fundamentals',
        category: 'Nail Technology',
        price: 199,
        duration: 30,
      },
    ],
  },
  nrf: {
    name: 'NRF RISE Up',
    description: 'Retail & Customer Service',
    markup: 1.3,
    courses: [
      {
        id: 'customer-service',
        name: 'Customer Service Fundamentals',
        category: 'Customer Service',
        price: 0,
        duration: 4,
      },
      {
        id: 'retail-ops',
        name: 'Store Operations',
        category: 'Retail Operations',
        price: 25,
        duration: 6,
      },
      {
        id: 'sales',
        name: 'Sales Fundamentals',
        category: 'Sales',
        price: 0,
        duration: 4,
      },
      {
        id: 'management',
        name: 'Retail Management Fundamentals',
        category: 'Management',
        price: 35,
        duration: 8,
      },
    ],
  },
  nds: {
    name: 'National Drug Screening',
    description: 'Drug Testing Certifications',
    markup: 1.5,
    courses: [
      {
        id: 'dot-collector',
        name: 'DOT Urine Specimen Collector',
        category: 'Drug Testing',
        price: 75,
        duration: 8,
      },
      {
        id: 'bat',
        name: 'Breath Alcohol Technician (BAT)',
        category: 'Drug Testing',
        price: 85,
        duration: 8,
      },
      {
        id: 'compliance',
        name: 'Drug Testing Compliance Officer',
        category: 'Drug Testing',
        price: 150,
        duration: 16,
      },
    ],
  },
};

// Flatten all courses with provider info
const ALL_COURSES = Object.entries(PARTNER_COURSES).flatMap(
  ([providerId, provider]) =>
    provider.courses.map((course: any) => ({
      ...course,
      providerId,
      providerName: provider.name,
      markup: provider.markup,
      studentPrice:
        course.price === 0
          ? 0
          : Math.round(course.price * provider.markup * 100) / 100,
    }))
);

export default function CoursesCatalogPage() {
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(ALL_COURSES.map((c) => c.category))).sort();
  }, []);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return ALL_COURSES.filter((course) => {
      // Search filter
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        course.name.toLowerCase().includes(searchTerm) ||
        course.category.toLowerCase().includes(searchTerm) ||
        course.providerName.toLowerCase().includes(searchTerm);

      // Provider filter
      const matchesProvider =
        selectedProvider === 'all' || course.providerId === selectedProvider;

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || course.category === selectedCategory;

      // Price filter
      let matchesPrice = true;
      if (priceRange === 'free') matchesPrice = course.studentPrice === 0;
      else if (priceRange === 'under-50')
        matchesPrice = course.studentPrice > 0 && course.studentPrice < 50;
      else if (priceRange === '50-150')
        matchesPrice = course.studentPrice >= 50 && course.studentPrice < 150;
      else if (priceRange === 'over-150')
        matchesPrice = course.studentPrice >= 150;

      return (
        matchesSearch && matchesProvider && matchesCategory && matchesPrice
      );
    });
  }, [search, selectedProvider, selectedCategory, priceRange]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/courses' },
          { label: 'Catalog' },
        ]}
      />
      {/* Hero */}
      <section className="bg-white text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Partner Course Catalog
          </h1>
          <p className="text-base md:text-lg text-brand-blue-100 mb-6">
            130+ industry certifications from leading training providers
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 bg-brand-blue-700 px-4 py-2 rounded-lg">
              <Award className="w-5 h-5" />
              <span>Industry Recognized</span>
            </div>
            <div className="flex items-center gap-2 bg-brand-blue-700 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5" />
              <span>Self-Paced Learning</span>
            </div>
            <div className="flex items-center gap-2 bg-brand-blue-700 px-4 py-2 rounded-lg">
              <DollarSign className="w-5 h-5" />
              <span>Affordable Pricing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
            </div>

            {/* Provider Filter */}
            <div>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                <option value="all">All Providers</option>
                {Object.entries(PARTNER_COURSES).map(([id, provider]: any) => (
                  <option key={id} value={id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setPriceRange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                priceRange === 'all'
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-slate-100 text-black hover:bg-slate-200'
              }`}
            >
              All Prices
            </button>
            <button
              onClick={() => setPriceRange('free')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                priceRange === 'free'
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-slate-100 text-black hover:bg-slate-200'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setPriceRange('under-50')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                priceRange === 'under-50'
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-slate-100 text-black hover:bg-slate-200'
              }`}
            >
              Under $50
            </button>
            <button
              onClick={() => setPriceRange('50-150')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                priceRange === '50-150'
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-slate-100 text-black hover:bg-slate-200'
              }`}
            >
              $50 - $150
            </button>
            <button
              onClick={() => setPriceRange('over-150')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                priceRange === 'over-150'
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-slate-100 text-black hover:bg-slate-200'
              }`}
            >
              Over $150
            </button>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-black">
            Showing{' '}
            <span className="font-semibold">{filteredCourses.length}</span>{' '}
            courses
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => (
            <div
              key={`${course.providerId}-${course.id}`}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition"
            >
              {/* Provider Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-50 px-3 py-2 rounded-full">
                  {course.providerName}
                </span>
                <span className="text-xs text-slate-500">
                  {course.category}
                </span>
              </div>

              {/* Course Name */}
              <h3 className="text-lg font-bold text-black mb-3 line-clamp-2">
                {course.name}
              </h3>

              {/* Details */}
              <div className="flex items-center gap-4 text-sm text-black mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}h</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>Certificate</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold text-black">
                    {course.studentPrice === 0
                      ? 'FREE'
                      : `$${course.studentPrice}`}
                  </div>
                  {course.studentPrice > 0 && (
                    <div className="text-xs text-slate-500">
                      Wholesale: ${course.price}
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              <Link
                href={`/apply?program=${course.id}`}
                className="block w-full text-center bg-brand-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
              >
                Enroll Now
              </Link>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-black mb-4">No courses match your filters</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedProvider('all');
                setSelectedCategory('all');
                setPriceRange('all');
              }}
              className="text-brand-blue-600 font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>

      {/* Info Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8 text-center">
            Why Choose Partner Courses?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Industry Recognized</h3>
              <p className="text-black">
                Certifications from leading providers accepted by employers
                nationwide
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Flexible Learning</h3>
              <p className="text-black">
                Self-paced courses that fit your schedule, from 1 hour to 160
                hours
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-brand-orange-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Affordable Pricing</h3>
              <p className="text-black">
                Competitive pricing with many free options and WIOA funding
                available
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Notice */}
      <section className="bg-slate-50 border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500">
            This is a proprietary instructional and workforce development
            platform operated by Elevate for Humanity. Access is limited to
            authorized participants.
          </p>
        </div>
      </section>
    </div>
  );
}
