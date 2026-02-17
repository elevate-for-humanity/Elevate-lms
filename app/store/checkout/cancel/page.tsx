"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { Suspense } from "react";

function CancelContent() {
  const searchParams = useSearchParams();
  const product = searchParams.get("product");

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 md:p-12">
        <div className="text-center">
          <div className="w-20 h-20 bg-brand-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-brand-red-400" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Checkout Cancelled
          </h1>

          <p className="text-lg text-gray-300 mb-8">
            Your payment was not processed. No charges have been made.
          </p>

          <div className="space-y-4">
            {product && (
              <Link
                href={`/store/guides/${product}`}
                className="flex items-center justify-center gap-2 w-full border border-slate-300 hover:bg-slate-50 text-slate-900 py-4 rounded-xl font-semibold transition-colors border border-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
                Return to Product
              </Link>
            )}

            <Link
              href="/store"
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-slate-900 py-4 rounded-xl font-semibold transition-colors"
            >
              Browse Store
            </Link>

            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 w-full text-gray-400 hover:text-slate-900 py-3 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Need Help?
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Having trouble? Contact us at{" "}
              <a
                href="mailto:info@elevateforhumanity.org"
                className="text-emerald-400 hover:underline"
              >
                info@elevateforhumanity.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoreCheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-slate-900">Loading...</div>
        </div>
      }
    >
      <CancelContent />
    </Suspense>
  );
}
