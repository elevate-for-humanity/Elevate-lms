import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin-login' },
  title: 'Admin Login | Elevate For Humanity',
  description: 'Sign in to the admin dashboard.',
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 mt-2">Sign in to access the admin dashboard</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" className="w-full border rounded-lg px-3 py-2" placeholder="admin@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input type="password" className="w-full border rounded-lg px-3 py-2" placeholder="••••••••" required />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-brand-blue-600 hover:text-brand-blue-800">Forgot password?</Link>
            </div>
            <button type="submit" className="w-full bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Sign In</button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/login" className="text-brand-blue-600 hover:text-brand-blue-800">Back to main login</Link>
        </p>
      </div>
    </div>
  );
}
