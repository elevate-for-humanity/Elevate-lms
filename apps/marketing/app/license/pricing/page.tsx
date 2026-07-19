import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing | Elevate for Humanity',
  keywords: ["tuition", "pricing", "WIOA funding", "financial aid", "Indiana"], description: 'Pricing page content.',
};

export const revalidate = 3600;
export default async function PricingPage() {
  const supabase = await createClient();

  // Get license tiers from database
  const { data: dbTiers } = await supabase
    .from('license_tiers')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  // Get FAQs
  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')
    .eq('category', 'licensing')
    .eq('is_active', true)
    .order('order', { ascending: true });

  const displayTiers = dbTiers && dbTiers.length > 0 ? dbTiers : LICENSE_TIERS.slice(0, 3);

  const defaultFaqs = [
    {
      question: "What's included in the license?",
      answer:
        'All licenses include the core platform, training, and support. Higher tiers include additional features and customization.',
    },
    {
      question: 'Can I upgrade later?',
      answer: "Yes, you can upgrade your license at any time. We'll prorate the difference.",
    },
    {
      question: 'Is there a monthly option?',
      answer: 'Yes, we offer monthly billing at a slightly higher rate. Contact us for details.',
    },
  ];

  const displayFaqs = faqs && faqs.length > 0 ? faqs : defaultFaqs;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Pricing</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}

