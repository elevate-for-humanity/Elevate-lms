"use client";

import React from 'react';
import { useState } from 'react';

export default function CodebaseProductEditor() {
  const [title, setTitle] = useState(
    'Elevate LMS + Workforce Suite (Clone License)'
  );
  const [price, setPrice] = useState('150000');

  async function publish() {
    await fetch('/api/store/create-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, price: Number(price) }),
    });
    alert('Product Published!');
  }

  return (
    <div className="space-y-3 text-sm p-4 bg-[#111] rounded">
      <input
        className="w-full bg-[#222] p-2 rounded text-white"
        value={title}
        onChange={(
          e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
          >
        ) => setTitle(e.target.value)}
      />

      <input
        className="w-full bg-[#222] p-2 rounded text-white"
        value={price}
        onChange={(
          e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
          >
        ) => setPrice(e.target.value)}
      />

      <button
        onClick={publish}
        className="px-4 py-2 bg-brand-green-600 hover:bg-brand-green-700 rounded text-white"
      >
        Publish Product
      </button>
    </div>
  );
}
