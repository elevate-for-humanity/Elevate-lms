import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog Author | Elevate For Humanity',
  description: 'Blog posts by author.',
};

export default function BlogAuthorPage({ params }: { params: { author: string } }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Author: {params.author}</h1>
      </div>
    </div>
  );
}
