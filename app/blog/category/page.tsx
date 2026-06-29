import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Blog Category | Elevate For Humanity',
  description: 'Blog posts by category.',
};

export default function BlogCategoryPage({ params }: { params: { category: string } }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Category: {params.category}</h1>
      </div>
    </div>
  );
}
