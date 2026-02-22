'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DollarSign,
  Eye,
  Package,
  Save,
  Sparkles,
  XCircle,
CheckCircle, } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StoreBuilderPage() {
  const router = useRouter();
  const [product, setProduct] = useState({
    title: 'Elevate LMS + Workforce Suite - Complete Codebase',
    description:
      'Full-featured LMS platform with admin suite, dev studio, and automation',
    features: [
      'Complete Next.js 16 codebase',
      'Admin Dashboard with Dev Studio',
      'Course Builder & LMS',
      'Student & Program Holder portals',
      'Supabase integration',
      'Stripe payments',
      'Email automation (Resend)',
      'AI course generation',
      'Media management',
      'Autopilot scripts',
      'Full documentation',
    ],
    pricing: {
      starter: {
        price: 299,
        name: 'Starter License',
        features: ['Single site', '1 year updates', 'Email support'],
      },
      pro: {
        price: 999,
        name: 'Pro License',
        features: [
          'Multi-site',
          'Lifetime updates',
          'Priority support',
          'Dev Studio included',
        ],
      },
      enterprise: {
        price: 5000,
        name: 'Enterprise',
        features: [
          'Unlimited sites',
          'White-label',
          'Dedicated support',
          'Custom features',
        ],
      },
    },
    demo: {
      enabled: true,
      url: '/demo/dev-studio',
    },
  });

  const [publishing, setPublishing] = useState(false);

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...product.features];
    newFeatures[index] = value;
    setProduct({ ...product, features: newFeatures });
  };

  const addFeature = () => {
    setProduct({ ...product, features: [...product.features, ''] });
  };

  const removeFeature = (index: number) => {
    setProduct({
      ...product,
      features: product.features.filter((_, i) => i !== index),
    });
  };

  const publishProduct = async () => {
    setPublishing(true);
    try {
      const res = await fetch('/api/store/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Product published! View at: ${data.url}`);
      }
    } catch (error) { /* Error handled silently */ 
      alert('Failed to publish product');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Clones" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/technology/hero-program-web-dev.jpg"
          alt="Clones"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Store Builder - Clone Codebase
          </h1>
          <p className="text-black">
            Create and manage your codebase product listing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">
                Product Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={product.title}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) => setProduct({ ...product, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Description
                  </label>
                  <textarea
                    value={product.description}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) =>
                      setProduct({ ...product, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Features Included</h2>
                <button
                  onClick={addFeature}
                  className="text-sm text-brand-blue-600 hover:text-brand-blue-700"
                >
                  + Add Feature
                </button>
              </div>

              <div className="space-y-2">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(
                        e: React.ChangeEvent<
                          | HTMLInputElement
                          | HTMLSelectElement
                          | HTMLTextAreaElement
                        >
                      ) => updateFeature(index, e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg"
                      placeholder="Feature description"
                    />
                    <button
                      onClick={() => removeFeature(index)}
                      className="px-3 py-2 text-brand-orange-600 hover:bg-brand-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Tiers */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Pricing Tiers</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(product.pricing).map(([key, tier]: any) => (
                  <div key={key} className="border rounded-lg p-4">
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(
                        e: React.ChangeEvent<
                          | HTMLInputElement
                          | HTMLSelectElement
                          | HTMLTextAreaElement
                        >
                      ) =>
                        setProduct({
                          ...product,
                          pricing: {
                            ...product.pricing,
                            [key]: { ...tier, name: e.target.value },
                          },
                        })
                      }
                      className="font-semibold mb-2 w-full px-2 py-2 border rounded"
                    />

                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-black" />
                      <input
                        type="number"
                        value={tier.price}
                        onChange={(
                          e: React.ChangeEvent<
                            | HTMLInputElement
                            | HTMLSelectElement
                            | HTMLTextAreaElement
                          >
                        ) =>
                          setProduct({
                            ...product,
                            pricing: {
                              ...product.pricing,
                              [key]: {
                                ...tier,
                                price: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="flex-1 px-2 py-2 border rounded"
                      />
                    </div>

                    <div className="space-y-1">
                      {tier.features.map((f, i) => (
                        <div key={i} className="text-xs text-black">
                          • {f}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo Settings */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Demo Environment</h2>

              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.demo.enabled}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setProduct({
                        ...product,
                        demo: { ...product.demo, enabled: e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Enable demo environment</span>
                </label>

                {product.demo.enabled && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Demo URL
                    </label>
                    <input
                      type="text"
                      value={product.demo.url}
                      onChange={(
                        e: React.ChangeEvent<
                          | HTMLInputElement
                          | HTMLSelectElement
                          | HTMLTextAreaElement
                        >
                      ) =>
                        setProduct({
                          ...product,
                          demo: { ...product.demo, url: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Actions */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-4">Actions</h3>

                <div className="space-y-3">
                  <button
                    onClick={publishProduct}
                    disabled={publishing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {publishing ? 'Publishing...' : 'Publish Product'}
                  </button>

                  <button
                    onClick={() =>
                      window.open('/store/codebase-clone', '_blank')
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Page
                  </button>

                  <button
                    onClick={() => window.open(product.demo.url, '_blank')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    View Demo
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-4">Product Preview</h3>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-black mb-1">Title</div>
                    <div className="text-sm font-medium">{product.title}</div>
                  </div>

                  <div>
                    <div className="text-xs text-black mb-1">Features</div>
                    <div className="text-xs text-black">
                      {product.features.length} features
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-black mb-1">Pricing</div>
                    <div className="text-sm font-medium">
                      ${product.pricing.starter.price} - $
                      {product.pricing.enterprise.price}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-black mb-1">Demo</div>
                    <div className="text-xs text-black">
                      {product.demo.enabled
                        ? '<span className="text-slate-400 flex-shrink-0">•</span> Enabled'
                        : '<XCircle className="w-5 h-5 inline-block" /> Disabled'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="font-semibold mb-4">Product Stats</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black">Views</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Demo Requests</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Purchases</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Storytelling Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                    Your Journey Starts Here
                  </h2>
                  <p className="text-lg text-black mb-6 leading-relaxed">
                    Every great career begins with a single step. Whether you're
                    looking to change careers, upgrade your skills, or enter the
                    workforce for the first time, we're here to help you
                    succeed. Our programs are Funded, government-funded, and
                    designed to get you hired fast.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-black">
                        Funded training - no tuition, no hidden costs
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-black">
                        Industry-recognized certifications that employers value
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-black">
                        Job placement assistance and career support
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-black">
                        Flexible scheduling for working adults
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/technology/hero-program-it-support.jpg"
                    alt="Students learning"
                    fill
                    className="object-cover"
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
              White-Label Store Clones
                          </h2>
              <p className="text-base md:text-lg mb-8 text-brand-blue-100">
              Manage branded store configurations for partner organizations.
                          </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/admin/store/clones"
                  className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                View Clones
                </Link>
                <Link
                  href="/admin/store"
                  className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                View Store
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
