import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Order Confirmed | Meri-Go-Round Wellness Shop',
  description: 'Thank you for your order from Meri-Go-Round Wellness Shop.',
};

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for shopping with Meri-Go-Round. Your order has been received and is being processed.
        </p>

        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-purple-700">
            <Package className="w-5 h-5" />
            <span className="font-medium">Shipping Confirmation</span>
          </div>
          <p className="text-purple-600 text-sm mt-2">
            You'll receive an email with tracking information once your order ships.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/curvature-body-sculpting/shop"
            className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link
            href="/curvature-body-sculpting"
            className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            <Home className="w-4 h-4" />
            Back to Curvature
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Questions about your order? Contact us at{' '}
            <a href="mailto:curvaturebodysculpting@gmail.com" className="text-purple-600 hover:underline">
              curvaturebodysculpting@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
