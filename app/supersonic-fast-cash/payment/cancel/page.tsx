import Link from 'next/link';
import { XCircle, ArrowLeft, Phone } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-black text-sm mb-8">
            No charge was made. Your spot is not reserved until payment is complete.
          </p>

          <div className="space-y-3">
            <Link
              href="/supersonic-fast-cash/payment"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Try Again
            </Link>
            <a
              href="tel:3173143757"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> Call (317) 314-3757
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
