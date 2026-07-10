import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Shield, Download, Zap } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getCatalogProduct } from '@/lib/store/db';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  'payment-unavailable': `Checkout is temporarily unavailable. Please try again later or call ${PLATFORM_DEFAULTS.supportPhone}.`,
  'checkout-failed':     'We could not start your checkout session. Please try again.',
  'invalid-product':     'This product is not available for purchase. Please contact support.',
  'rate-limited':        'Too many requests. Please wait a moment and try again.',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProduct(slug).catch(() => null);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.name} | Elevate For Humanity`,
    description: product.description,
    alternates: { canonical: `${PLATFORM_DEFAULTS.siteUrl}/platform/${product.slug}` },
  };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: Props & { searchParams: Promise<{ error?: string }> }) {
  const { slug } = await params;
  const { error: errorSlug } = await searchParams;

  const product = await getCatalogProduct(slug).catch(() => null);
  if (!product) notFound();

  const checkoutError = errorSlug
    ? (CHECKOUT_ERROR_MESSAGES[errorSlug] ?? 'Something went wrong. Please try again.')
    : null;

  const billingLabel = product.billingType === 'subscription' ? 'Per month' : 'One-time payment';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Platform', href: '/platform' },
            { label: product.name },
          ]}
        />
      </div>

      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/platform-page-1.webp"
          alt={product.name}
          fill
          className="object-cover"
          quality={90}
          priority
          sizes="100vw"
        />
      </section>

      {checkoutError && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {checkoutError}
          </div>
        </div>
      )}

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                <h1 className="text-3xl font-bold mb-4 text-black">{product.name}</h1>
                <p className="text-black mb-6">{product.longDescription ?? product.description}</p>

                {product.features.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold mb-4 text-black">Features</h3>
                    <ul className="space-y-3 mb-8">
                      {product.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="w-5 h-5 text-brand-green-600 mr-3 shrink-0 mt-0.5" />
                          <span className="text-black">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {product.appsIncluded && product.appsIncluded.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold mb-4 text-black">
                      Apps & Modules ({product.appsIncluded.length})
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {product.appsIncluded.map((app, i) => (
                        <div key={i} className="border border-slate-200 rounded-lg p-4">
                          <span className="text-black font-medium">{app}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {product.idealFor && (
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <h2 className="text-2xl font-bold mb-4 text-black">Ideal For</h2>
                  <p className="text-black">{product.idealFor}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-8 sticky top-4">
                <div className="mb-6">
                  <div className="text-4xl font-bold text-black mb-2">
                    ${product.price.toLocaleString()}
                  </div>
                  <div className="text-black">{billingLabel}</div>
                </div>

                <div className="space-y-4 mb-6">
                  {product.licenseType && (
                    <div className="flex items-start">
                      <Shield className="w-5 h-5 text-brand-green-600 mr-3 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-black">License Type</div>
                        <div className="text-sm text-black capitalize">{product.licenseType}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start">
                    <Download className="w-5 h-5 text-brand-blue-600 mr-3 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-black">Deployment</div>
                      <div className="text-sm text-black">Full source code access</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Zap className="w-5 h-5 text-brand-orange-600 mr-3 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-black">Support</div>
                      <div className="text-sm text-black">Onboarding + updates</div>
                    </div>
                  </div>
                </div>

                <form action="/api/stripe/checkout" method="POST">
                  <input type="hidden" name="productId" value={product.slug} />
                  <button
                    type="submit"
                    className="w-full bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors mb-4"
                  >
                    Purchase License
                  </button>
                  <p className="text-sm text-black text-center">
                    Secure checkout powered by Stripe. Instant access after payment.
                  </p>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <Link
                    href="/store/licenses"
                    className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
                  >
                    View License Terms →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-black">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">What happens after I purchase?</h3>
              <p className="text-black">
                You'll receive setup instructions, codebase access, and an onboarding checklist to get your platform live.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">Can I deploy on multiple domains?</h3>
              <p className="text-black">
                {product.licenseType === 'single'
                  ? 'Single licenses are for one domain. Upgrade to School or Enterprise for multi-domain deployment.'
                  : 'Yes, your license includes multi-domain deployment rights.'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">Do I get updates?</h3>
              <p className="text-black">
                All licenses include updates. Core and Monthly subscriptions get 1 year of updates. School and Enterprise licenses get lifetime updates.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">What if I need custom features?</h3>
              <p className="text-black">
                Enterprise licenses include custom development support. For other licenses, contact us for a quote.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
