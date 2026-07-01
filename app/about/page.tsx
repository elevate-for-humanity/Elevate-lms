import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Elevate for Humanity',
  description: 'Learn about Elevate for Humanity - workforce training, apprenticeships, and career development.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About Elevate for Humanity</h1>
        <div className="prose prose-lg">
          <p className="text-gray-600">
            Elevate for Humanity provides workforce training, apprenticeships, and career development 
            opportunities for individuals seeking to build meaningful careers.
          </p>
        </div>
      </div>
    </div>
  );
}
