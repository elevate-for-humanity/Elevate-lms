import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Profile | Elevate For Humanity',
  description: 'User profile management.',
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Profile</h1>
        <Link href="/profile/edit" className="block p-6 border rounded-xl hover:border-brand-blue-500">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
        </Link>
      </div>
    </div>
  );
}
