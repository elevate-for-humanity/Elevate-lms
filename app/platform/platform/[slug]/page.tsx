
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProductBySlug(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.name} | Elevate For Humanity`,
    description: product.longDescription,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/platform/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const supabase = await createClient();
  const db = await getAdminClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Try database first
  const { data: dbProduct } = await db
    .from('platform_products')
    .select('*')
    .eq('slug', params.slug)
    .single();

  const product = dbProduct || getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const apps = getAppsForProduct(product);

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Platform", href: "/platform" }, { label: "[Slug]" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-[300px] md:h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/programs/cpr-group-training-hd.jpg"
          alt={product.name}
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <Link
            href="/platform"
            className="inline-flex items-center text-white hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Platform
          </Link>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {product.name}
          </h1>
          <p className="text-base md:text-lg text-gray-100">
            {product.description}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Column - Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4 text-black">
                  What's Included
                </h2>
                <p className="text-black mb-6">{product.longDescription}</p>

                <h3 className="text-lg font-semibold mb-4 text-black">
                  Features
                </h3>
                <ul className="space-y-3 mb-8">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-brand-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-black">{feature}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-lg font-semibold mb-4 text-black">
                  Apps & Modules ({apps.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">{app.icon}</span>
                        <div>
                          <h4 className="font-semibold text-black">
                            {app.name}
                          </h4>
                          <p className="text-sm text-black mt-1">
                            {app.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-4 text-black">
                  Ideal For
                </h2>
                <ul className="space-y-3">
                  {product.idealFor.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-brand-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-black">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column - Purchase Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-8 sticky top-4">
                <div className="mb-6">
                  <div className="text-4xl font-bold text-black mb-2">
                    ${product.price.toLocaleString()}
                  </div>
                  <div className="text-black">
                    {product.billingType === 'one_time'
                      ? 'One-time payment'
                      : 'Per month'}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-brand-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-black">
                        License Type
                      </div>
                      <div className="text-sm text-black capitalize">
                        {product.licenseType}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Download className="w-5 h-5 text-brand-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-black">
                        Deployment
                      </div>
                      <div className="text-sm text-black">
                        Full source code access
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Zap className="w-5 h-5 text-brand-orange-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-black">Support</div>
                      <div className="text-sm text-black">
                        Onboarding + updates
                      </div>
                    </div>
                  </div>
                </div>

                {product.requiresApproval ? (
                  <div>
                    <Link
                      href="/contact?topic=enterprise-review"
                      className="block w-full text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors mb-4"
                    >
                      Request Enterprise Review
                    </Link>
                    <p className="text-sm text-black text-center">
                      This license requires approval. Applications are reviewed within 1-2 business days.
                    </p>
                  </div>
                ) : (
                  <form action="/api/stripe/checkout" method="POST">
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      type="submit"
                      className="w-full bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors mb-4"
                    >
                      Purchase License
                    </button>
                    <p className="text-sm text-black text-center">
                      Secure checkout powered by Stripe. Instant access after
                      payment.
                    </p>
                  </form>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Link
                    href="/platform/licensing"
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

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-black">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">
                What happens after I purchase?
              </h3>
              <p className="text-black">
                You'll be redirected to a post-purchase onboarding page with
                setup instructions, access to the codebase, and a checklist to
                get your platform live.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">
                Can I deploy on multiple domains?
              </h3>
              <p className="text-black">
                {product.licenseType === 'single'
                  ? 'Single licenses are for one domain. Upgrade to School or Enterprise for multi-domain deployment.'
                  : 'Yes, your license includes multi-domain deployment rights.'}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">
                Do I get updates?
              </h3>
              <p className="text-black">
                Yes, all licenses include updates. Core and Monthly
                subscriptions get 1 year of updates. School and Enterprise
                licenses get lifetime updates.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">
                What if I need custom features?
              </h3>
              <p className="text-black">
                Enterprise licenses include custom development support. For
                other licenses, contact us for custom development quotes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
