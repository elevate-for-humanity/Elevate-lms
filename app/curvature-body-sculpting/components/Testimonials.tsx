'use client';

import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Review {
  name: string;
  rating: number;
  text: string;
  date: string;
  service?: string;
  priceRange?: string;
}

const reviews: Review[] = [
  {
    name: 'Makia D.',
    rating: 5,
    text: "Listen, when I tell you, this is a miracle, a true butter healer. If you suffer from anxiety, depression, pain, or lack of sleep, this is for you!",
    date: '44 weeks ago',
    service: 'Meri-Go-Round Butter',
  },
  {
    name: 'Joyce F.',
    rating: 5,
    text: "I was suffering from a sciatic nerve injury, and I did not really want to take any kind of narcotic. The Meri-Go-Round oil gave me relief!",
    date: '22 weeks ago',
    service: 'Meri-Go-Round Oil',
  },
  {
    name: 'Amanda W.',
    rating: 5,
    text: "Products are amazing! My Back Pain Went Away Instantly. Highly recommend!",
    date: '44 weeks ago',
    priceRange: '$40-60',
    service: 'Meri-Go-Round Products',
  },
  {
    name: 'Breeyuan G.',
    rating: 5,
    text: "I was a little unsure that it was going to work. Guess what - it did! I have been struggling with pain for years and the oils worked!",
    date: '35 weeks ago',
    service: 'Meri-Go-Round Oil',
  },
  {
    name: 'Robin H.',
    rating: 5,
    text: "I used some oil for my legs that was hurting and within an hour the pain was gone.",
    date: 'Oct 10, 2024',
    service: 'Meri-Go-Round Oil',
  },
  {
    name: 'Stephanie A.',
    rating: 5,
    text: "The body oils are amazing. I suffer from alopecia so I apply it to my scalp. It's like magic - my hair has begun to grow.",
    date: 'Nov 4, 2024',
    service: 'Hair Growth Oil',
  },
  {
    name: 'Tara C.',
    rating: 5,
    text: "I tried Ms. Liz's Charcoal bar soap, which she specifically made for my skin type. My skin feels amazing!",
    date: '48 weeks ago',
    priceRange: '$1-20',
    service: 'Charcoal Soap',
  },
  {
    name: 'Nay B.',
    rating: 5,
    text: "Liz used the Shea butter on my daughter's hair who's hair is dry and kinky. It brought her hair back to Life!",
    date: 'Nov 2, 2024',
    service: 'Shea Butter',
  },
  {
    name: 'Ashley N.',
    rating: 5,
    text: "The oils instantly relaxed my tense muscles in my neck!",
    date: '41 weeks ago',
    service: 'Meri-Go-Round Oil',
  },
  {
    name: 'Jovonia A.',
    rating: 5,
    text: "The Merry GO Round feels so good on my back. I have lumbar lordosis and it really eased my pain.",
    date: '44 weeks ago',
    service: 'Meri-Go-Round Oil',
  },
  {
    name: 'Marietta W.',
    rating: 5,
    text: "The oils and butter are excellent. Using the products consistently works wonders. Had pain in my leg for a long time and it's finally getting better!",
    date: 'Nov 3, 2024',
    service: 'Meri-Go-Round Products',
  },
  {
    name: 'Rachelle P.',
    rating: 5,
    text: "It helped me a lot. I am in constant pain everyday. I am your number 1 fan. I used the Meri-Go-Round oil.",
    date: '35 weeks ago',
    service: 'Meri-Go-Round Oil',
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewsPerPage = 3;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const nextPage = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const visibleReviews = reviews.slice(
    currentIndex * reviewsPerPage,
    (currentIndex + 1) * reviewsPerPage
  );

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-2xl font-bold text-gray-900">4.9</span>
            <span className="text-gray-500">({reviews.length} reviews)</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Real reviews from real customers on Google
          </p>
        </div>

        <div className="relative">
          <div className="grid md:grid-cols-3 gap-6">
            {visibleReviews.map((review, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 relative"
              >
                <Quote className="absolute top-4 right-4 w-8 h-8 text-purple-200" />
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 line-clamp-4">"{review.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{review.name}</p>
                    {review.service && (
                      <p className="text-sm text-purple-600">{review.service}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevPage}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              aria-label="Previous reviews"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition ${
                    i === currentIndex ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={nextPage}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              aria-label="Next reviews"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <a
            href="https://www.google.com/maps/place/Curvature+Body+Sculpting"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700"
          >
            See all reviews on Google
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm.14 19.018c-3.868 0-7-3.14-7-7.018 0-3.878 3.132-7.018 7-7.018 1.89 0 3.47.697 4.682 1.829l-1.974 1.978v-.004c-.735-.702-1.667-1.062-2.708-1.062-2.31 0-4.187 1.956-4.187 4.273 0 2.315 1.877 4.277 4.187 4.277 2.096 0 3.522-1.202 3.816-2.852H12.14v-2.737h6.585c.088.47.135.96.135 1.474 0 4.01-2.677 6.86-6.72 6.86z"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
