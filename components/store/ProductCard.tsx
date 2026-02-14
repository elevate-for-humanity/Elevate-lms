'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Play, Check, Heart } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviewCount: number;
    image: string;
    icon?: any;
    color?: string;
    badge?: string;
    features?: string[];
    category?: string;
  };
  variant?: 'default' | 'compact' | 'horizontal';
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const Icon = product.icon;
  
  if (variant === 'compact') {
    return (
      <Link 
        href={`/store/apps/${product.slug}`}
        className="group bg-white rounded-xl border hover:shadow-lg transition-all duration-300 overflow-hidden"
      >
        <div className="relative aspect-[4/3]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.badge && (
            <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-bold rounded-full ${
              product.badge === 'Best Seller' ? 'bg-orange-500 text-white' :
              product.badge === 'New' ? 'bg-green-500 text-white' :
              'bg-brand-blue-500 text-white'
            }`}>
              {product.badge}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-1 group-hover:text-brand-blue-600 transition">{product.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-0.5">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{product.rating}</span>
            </div>
            <span className="text-gray-400 text-sm">({product.reviewCount})</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-gray-900">${product.price}</span>
            {product.originalPrice && (
              <span className="text-gray-400 line-through text-sm">${product.originalPrice}</span>
            )}
            <span className="text-gray-500 text-sm">/mo</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className="group bg-white rounded-xl border hover:shadow-lg transition-all duration-300 overflow-hidden flex">
        <div className="relative w-48 flex-shrink-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.badge && (
            <span className={`absolute top-3 left-3 px-2 py-1 text-xs font-bold rounded-full ${
              product.badge === 'Best Seller' ? 'bg-orange-500 text-white' :
              product.badge === 'New' ? 'bg-green-500 text-white' :
              'bg-brand-blue-500 text-white'
            }`}>
              {product.badge}
            </span>
          )}
        </div>
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-brand-blue-600 transition">{product.name}</h3>
              <p className="text-brand-blue-600 text-sm font-medium">{product.tagline}</p>
            </div>
            <button 
              onClick={(e) => { e.preventDefault(); setIsWishlisted(!isWishlisted); }}
              className={`p-2 rounded-lg transition ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
              <span className="text-sm font-medium ml-1">{product.rating}</span>
            </div>
            <span className="text-gray-400 text-sm">({product.reviewCount} reviews)</span>
          </div>
          <div className="mt-auto flex items-center justify-between">
            <div>
              <span className="text-2xl font-black text-gray-900">${product.price}</span>
              {product.originalPrice && (
                <span className="text-gray-400 line-through text-sm ml-2">${product.originalPrice}</span>
              )}
              <span className="text-gray-500 text-sm">/mo</span>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/apps/${product.slug}`}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                Demo
              </Link>
              <Link
                href={`/store/apps/${product.slug}`}
                className="px-4 py-2 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-1"
              >
                <ShoppingCart className="w-4 h-4" />
                Buy
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="group bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-brand-blue-200 hover:shadow-2xl transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-video">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badge */}
        {product.badge && (
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              product.badge === 'Best Seller' ? 'bg-orange-500 text-white' :
              product.badge === 'New' ? 'bg-green-500 text-white' :
              'bg-brand-blue-500 text-white'
            }`}>
              {product.badge}
            </span>
          </div>
        )}
        
        {/* Wishlist */}
        <button 
          onClick={(e) => { e.preventDefault(); setIsWishlisted(!isWishlisted); }}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition ${
            isWishlisted ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600 hover:bg-white'
          }`}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
        
        {/* Play Demo Button */}
        <Link 
          href={`/apps/${product.slug}`}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition">
            <Play className="w-8 h-8 text-gray-900 ml-1" />
          </div>
        </Link>
        
        {/* Icon & Rating */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          {Icon && (
            <div className={`w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg`}>
              <Icon className={`w-8 h-8 text-${product.color || 'blue'}-600`} />
            </div>
          )}
          <div className="flex items-center gap-1 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-sm">{product.rating}</span>
            <span className="text-gray-500 text-sm">({product.reviewCount})</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-brand-blue-600 transition">{product.name}</h3>
        <p className="text-brand-blue-600 font-medium text-sm mb-3">{product.tagline}</p>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
        
        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {product.features.slice(0, 4).map((feature, j) => (
              <div key={j} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="truncate">{feature}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">${product.price}</span>
              {product.originalPrice && (
                <span className="text-gray-400 line-through">${product.originalPrice}</span>
              )}
            </div>
            <span className="text-gray-500 text-sm">/month</span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/apps/${product.slug}`}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Demo
            </Link>
            <Link
              href={`/store/apps/${product.slug}`}
              className="px-4 py-2 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-1"
            >
              <ShoppingCart className="w-4 h-4" />
              Buy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
