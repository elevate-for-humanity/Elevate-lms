import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, ShoppingCart, Heart, Truck, Shield, RotateCcw, Minus, Plus } from 'lucide-react';
import AddToCartButton from './AddToCartButton';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', params.slug)
    .single();

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.name} | Meri-Go-Round Wellness Shop`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const supabase = await createClient();
  
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !product) {
    notFound();
  }

  // Get related products from same category
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, image_url, category')
    .eq('category', product.category)
    .neq('id', product.id)
    .eq('is_active', true)
    .limit(4);

  const categoryLabels: Record<string, string> = {
    teas: 'Teas',
    butters: 'Body Butters',
    oils: 'Essential Oils',
    soaps: 'Handcrafted Soaps',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/curvature-body-sculpting" className="text-gray-500 hover:text-gray-700">
              Curvature
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/curvature-body-sculpting/shop" className="text-gray-500 hover:text-gray-700">
              Shop
            </Link>
            <span className="text-gray-400">/</span>
            <Link 
              href={`/curvature-body-sculpting/shop?category=${product.category}`} 
              className="text-gray-500 hover:text-gray-700 capitalize"
            >
              {categoryLabels[product.category] || product.category}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl overflow-hidden relative">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-12 h-12 text-purple-400" />
                    </div>
                    <p className="text-purple-400 font-medium">Meri-Go-Round</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-2">
              <span className="text-sm font-medium text-purple-600 uppercase tracking-wide">
                {categoryLabels[product.category] || product.category}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            <div className="text-3xl font-bold text-purple-600 mb-6">
              ${parseFloat(product.price).toFixed(2)}
            </div>

            <p className="text-gray-600 mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* Add to Cart */}
            <AddToCartButton product={product} />

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t">
              <div className="text-center">
                <Truck className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Free shipping over $50</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Secure checkout</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600">30-day returns</p>
              </div>
            </div>

            {/* Product Details */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-bold text-gray-900 mb-4">Product Details</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Handcrafted with natural ingredients</li>
                <li>• Cruelty-free and eco-friendly</li>
                <li>• Made in small batches for quality</li>
                <li>• Supports mental wellness initiatives</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((related) => (
                <Link
                  key={related.id}
                  href={`/curvature-body-sculpting/shop/${related.slug}`}
                  className="group"
                >
                  <div className="aspect-square bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl overflow-hidden mb-3 relative">
                    {related.image_url ? (
                      <Image
                        src={related.image_url}
                        alt={related.name}
                        fill
                        className="object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-purple-300" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition text-sm">
                    {related.name.replace('Meri-Go-Round ', '')}
                  </h3>
                  <p className="text-purple-600 font-bold">${parseFloat(related.price).toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
