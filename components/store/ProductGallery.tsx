"use client";

import React from 'react';

import { useState } from 'react';
import Image from 'next/image';
import { StoreProduct } from '@/lib/store/products';

interface ProductGalleryProps {
  product: StoreProduct;
}

export default function ProductGallery({ product }: ProductGalleryProps) {
  const images = product.images || [product.image];
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100">
        <Image
          src={images[selectedImage]}
          alt={product.name}
          fill
          className="object-cover"
          quality={95}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {product.featured && (
          <div className="absolute top-4 right-4 px-4 py-2 bg-brand-blue-600 text-white font-bold rounded-lg shadow-lg">
            Featured
          </div>
        )}

        {product.salePrice && (
          <div className="absolute top-4 left-4 px-4 py-2 bg-brand-orange-600 text-white font-bold rounded-lg shadow-lg">
            SALE
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index
                  ? 'border-brand-blue-600 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Image
                src={image}
                alt={`${product.name} - Image ${index + 1}`}
                fill
                className="object-cover"
                quality={75}
                sizes="(max-width: 768px) 25vw, 12vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
