import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Partners Support | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

export default function PartnerSupportPage() {
  return (
    <div className="rounded-2xl border p-5 space-y-3">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Support" }]} />
      </div>
<div className="font-semibold">Support</div>
      <div className="text-sm text-black">
        If something isn't working, submit a callback request and we'll follow
        up.
      </div>
      <div className="rounded-xl border p-4 text-sm">
        Tip: If a page "looks logged in but won't load data," it's almost always
        an RLS policy mismatch or the user isn't assigned to a shop.
      </div>
      <div className="rounded-xl border p-4">
        <div className="font-medium mb-2">Contact Information</div>
        <div className="text-sm space-y-1">
          <div>
            Email:{' '}
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="text-blue-600"
            >
              elevate4humanityedu@gmail.com
            </a>
          </div>
          <div>
            Phone:{' '}
            <a href="/contact" className="text-blue-600">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
