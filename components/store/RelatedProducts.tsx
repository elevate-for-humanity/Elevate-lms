"use client";

import Image from 'next/image';
import Link from 'next/link';
import { StoreProduct } from '@/lib/store/products';

interface RelatedProductsProps {
  products: StoreProduct[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-black mb-8">Related Products</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/store/${product.slug}`}
              className="group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  quality={85}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-6">
                <span className="text-xs font-semibold text-brand-blue-700 uppercase">
                  {product.category.replace('-', ' ')}
                </span>
                <h3 className="text-xl font-bold mt-2 mb-2 text-black">
                  {product.name}
                </h3>
                <p className="text-black text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-black">
                    ${product.salePrice || product.price}
                  </span>
                  <span className="text-brand-blue-600 font-semibold group-hover:text-brand-blue-700">
                    View Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
