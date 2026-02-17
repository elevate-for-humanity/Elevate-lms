"use client";

import React from 'react';
import { useState } from 'react';

export default function ProductEditor() {
  const [title, setTitle] = useState('EFH LMS + Workforce Suite');
  const [price, setPrice] = useState('150000');
  const [repo, setRepo] = useState('elevateforhumanity/fix2');
  const [description, setDescription] = useState(
    'Complete LMS and Workforce Development platform with AI-powered course builder'
  );
  const [loading, setLoading] = useState(false);

  async function publish() {
    setLoading(true);
    try {
      const res = await fetch('/api/store/create-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          price: Number(price),
          repo,
          description,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        alert('Product Created: ' + data.productId);
      } else {
        alert('Error: ' + (data.error || 'Failed to create product'));
      }
    } catch (error) { /* Error handled silently */ 
      alert('Failed to create product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 shadow rounded-lg space-y-4">
      <h2 className="font-bold text-xl">Create Product</h2>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Product Title
        </label>
        <input
          value={title}
          onChange={(
            e: React.ChangeEvent<
              HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >
          ) => setTitle(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          placeholder="Product Title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(
            e: React.ChangeEvent<
              HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >
          ) => setDescription(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          placeholder="Product Description"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Price (USD)
        </label>
        <input
          type="number"
          value={price}
          onChange={(
            e: React.ChangeEvent<
              HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >
          ) => setPrice(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          placeholder="Price in USD"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          GitHub Repository to Clone
        </label>
        <input
          value={repo}
          onChange={(
            e: React.ChangeEvent<
              HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >
          ) => setRepo(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          placeholder="owner/repository"
        />
      </div>

      <button
        onClick={publish}
        disabled={loading}
        className="w-full bg-brand-green-600 text-white p-3 rounded hover:bg-brand-green-700 disabled:bg-brand-green-300 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? 'Publishing...' : 'Publish Product'}
      </button>
    </div>
  );
}
