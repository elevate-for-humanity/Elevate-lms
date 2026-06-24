'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Filter, Search, ShoppingCart } from 'lucide-react';
import { trackSearch, trackProductView, trackAddToCart } from '@/components/analytics/PageTracker';

interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  rating: number;
  review_count: number;
  category: string;
  image_url: string;
}

interface ShopClientProps {
  products: Product[];
  categories: string[];
}

export function ShopClient({ products, categories }: ShopClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackSearch(searchQuery, 'shop');
    }
  };

  const handleProductClick = (product: Product) => {
    trackProductView(product.id, product.name, product.category, product.price);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    trackAddToCart(product.id, product.name, product.category, product.price);
    // Add to cart logic here
  };

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4" data-tour="shop-categories">
          <Filter className="w-5 h-5 text-slate-700" />
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm ${activeCategory === cat ? 'bg-brand-blue-600 text-white' : 'bg-white text-slate-900 hover:bg-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-700" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64"
              aria-label="Search products"
            />
          </form>
          <Link href="/shop/cart" className="relative p-2 text-slate-700 hover:text-brand-blue-600" aria-label="Shopping cart" data-tour="shop-cart">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-blue-600 text-white text-xs rounded-full flex items-center justify-center">0</span>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product, index) => (
          <Link 
            key={product.id} 
            href={`/shop/product/${product.slug || product.id}`} 
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            onClick={() => handleProductClick(product)}
            data-tour={index === 0 ? "shop-product" : undefined}
          >
            <div className="relative aspect-square">
              <Image
                src={product.image_url || '/images/pages/shop-hero.jpg'}
                alt={product.name}
                fill
                className="object-cover"
               sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
            </div>
            <div className="p-6">
              <span className="text-xs text-brand-blue-600 font-medium">{product.category}</span>
              <h2 className="font-semibold text-slate-900 mt-1">{product.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-slate-900">{product.rating}</span>
                </div>
                <span className="text-sm text-slate-700">({product.review_count} reviews)</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xl font-bold text-slate-900">${product.price}</span>
                <button 
                  onClick={(e) => handleAddToCart(e, product)}
                  className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-blue-700"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
