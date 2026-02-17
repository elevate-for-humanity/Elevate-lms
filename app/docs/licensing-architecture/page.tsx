import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Licensing Architecture v1 | Elevate for Humanity',
  description: 'Enterprise licensing system architecture documentation',
};

export default function LicensingArchitecturePage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Licensing Architecture" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Licensing Architecture v1
        </h1>

        {/* Stripe Flow */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Payment & Provisioning Flow
          </h2>
          <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm">
            <pre className="whitespace-pre-wrap">
{`1. Customer → /store/checkout
   ↓
2. Stripe Checkout Session Created
   ↓
3. Customer Completes Payment
   ↓
4. Stripe Webhook → /api/store/licenses/webhook
   ↓
5. Idempotency Check (processed_stripe_events)
   ↓
6. Transactional Provisioning:
   a. Create Tenant
   b. Generate License Key (hashed)
   c. Create Admin User
   d. Send Welcome Email with Magic Link
   ↓
7. Audit Log (provisioning_events)
   ↓
8. Customer Receives Access`}
            </pre>
          </div>
        </section>

        {/* Tenant Isolation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Tenant Isolation Model
          </h2>
          <div className="space-y-4">
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-brand-blue-800">Database Level (RLS)</h3>
              <ul className="mt-2 text-brand-blue-700 list-disc list-inside">
                <li>Row Level Security enabled on all tenant tables</li>
                <li>tenant_id extracted from JWT user_metadata</li>
                <li>Automatic filtering on SELECT queries</li>
                <li>Service role bypasses RLS for admin operations</li>
              </ul>
            </div>
            <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-brand-green-800">Application Level</h3>
              <ul className="mt-2 text-brand-green-700 list-disc list-inside">
                <li>withTenant middleware validates tenant context</li>
                <li>Requests without tenant_id are rejected</li>
                <li>Tenant context injected into all protected routes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* License Enforcement */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            License Enforcement
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action on Failure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3">License exists</td>
                  <td className="px-4 py-3 text-brand-red-600">Block access, log violation</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">License not expired</td>
                  <td className="px-4 py-3 text-brand-red-600">Block access, log violation</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Feature entitled</td>
                  <td className="px-4 py-3 text-brand-red-600">Block feature, log violation</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">User limit not exceeded</td>
                  <td className="px-4 py-3 text-yellow-600">Block new user creation</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Charge disputed/refunded</td>
                  <td className="px-4 py-3 text-brand-red-600">Suspend license immediately</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Audit Trail */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Audit Trail
          </h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Tracked Events (provisioning_events)</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-brand-green-500 rounded-full"></span>
                payment_received
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-brand-green-500 rounded-full"></span>
                tenant_created
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-brand-green-500 rounded-full"></span>
                license_created
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-brand-green-500 rounded-full"></span>
                admin_created
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-brand-green-500 rounded-full"></span>
                email_sent
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-brand-red-500 rounded-full"></span>
                provisioning_failed (with error details)
              </li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              All events include correlation_id (payment_intent_id) for end-to-end tracing.
            </p>
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Roadmap (Non-Blocking)
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Planned</span>
              <span>Redis-backed job queue for high-volume processing</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Planned</span>
              <span>Admin dashboard for provisioning status monitoring</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Planned</span>
              <span>Automated license renewal reminders</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Planned</span>
              <span>Usage-based billing integration</span>
            </div>
          </div>
        </section>

        {/* Security Summary */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Security Controls
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Payment Safety</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Stripe webhook signature verification</li>
                <li>• Idempotency prevents duplicate processing</li>
                <li>• Controlled checkout mode available</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Data Isolation</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Row Level Security on all tenant tables</li>
                <li>• Tenant context required for protected routes</li>
                <li>• License keys stored as hashes</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Provisioning</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Transactional with rollback on failure</li>
                <li>• Admin user auto-created with magic link</li>
                <li>• Full audit trail for debugging</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Revenue Protection</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Dispute/refund triggers license suspension</li>
                <li>• License violations logged</li>
                <li>• Feature entitlement enforcement</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="text-center text-sm text-gray-500 pt-8 border-t">
          <p>Licensing Architecture v1 — Last updated: {new Date().toISOString().split('T')[0]}</p>
        </footer>
      </div>
    </div>
  );
}
