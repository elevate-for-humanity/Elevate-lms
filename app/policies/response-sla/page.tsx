export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Response Time SLA | Elevate for Humanity',
  description: 'Service level agreements for support and communication response times.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/response-sla',
  },
};

export default async function ResponseSLAPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('policies').select('*').limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Response Sla" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Response Time SLA</h1>
            <p className="text-sm text-gray-600">Last Updated: January 12, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This Service Level Agreement (SLA) establishes expected response times for various types of 
              inquiries and support requests. We are committed to providing timely, helpful responses to 
              students, applicants, employers, and other stakeholders.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Response Time Standards</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Email Inquiries</h3>
                <p className="text-3xl font-black text-brand-blue-600 mb-2">24-48 hrs</p>
                <p className="text-black">General questions and non-urgent matters</p>
              </div>

              <div className="bg-brand-green-50 rounded-lg p-6 border-2 border-brand-green-200">
                <h3 className="text-xl font-bold text-black mb-3">Phone Calls</h3>
                <p className="text-3xl font-black text-brand-green-600 mb-2">Same Day</p>
                <p className="text-black">During business hours (8 AM - 6 PM EST)</p>
              </div>

              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Applications</h3>
                <p className="text-3xl font-black text-brand-blue-600 mb-2">2-3 Days</p>
                <p className="text-black">Initial review and response</p>
              </div>

              <div className="bg-brand-orange-50 rounded-lg p-6 border-2 border-brand-orange-200">
                <h3 className="text-xl font-bold text-black mb-3">Urgent Matters</h3>
                <p className="text-3xl font-black text-brand-orange-600 mb-2">4 Hours</p>
                <p className="text-black">Safety, security, or critical issues</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Response Times by Department</h2>
            
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Admissions</h3>
              <ul className="space-y-2 text-black">
                <li><strong>General inquiries:</strong> 24-48 hours</li>
                <li><strong>Application status:</strong> 2-3 business days</li>
                <li><strong>Document verification:</strong> 3-5 business days</li>
                <li><strong>Enrollment questions:</strong> Same business day</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Student Services</h3>
              <ul className="space-y-2 text-black">
                <li><strong>Academic advising:</strong> 24-48 hours</li>
                <li><strong>Technical support:</strong> 4-8 hours</li>
                <li><strong>Financial aid:</strong> 2-3 business days</li>
                <li><strong>Career services:</strong> 48 hours</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Registrar</h3>
              <ul className="space-y-2 text-black">
                <li><strong>Transcript requests:</strong> 3-5 business days</li>
                <li><strong>Credential verification:</strong> 1-2 business days</li>
                <li><strong>Enrollment verification:</strong> Same business day</li>
                <li><strong>Grade inquiries:</strong> 24-48 hours</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">IT Support</h3>
              <ul className="space-y-2 text-black">
                <li><strong>Critical system issues:</strong> 1 hour</li>
                <li><strong>Login/access problems:</strong> 4 hours</li>
                <li><strong>General tech support:</strong> 8-24 hours</li>
                <li><strong>Feature requests:</strong> 5 business days</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Priority Levels</h2>
            
            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Critical (4 hours)</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Safety or security threats</li>
                <li>System outages affecting access</li>
                <li>Payment processing failures</li>
                <li>Data breach or privacy concerns</li>
                <li>Imminent deadline issues</li>
              </ul>
            </div>

            <div className="bg-brand-orange-50 border-l-4 border-brand-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">High (Same Day)</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Enrollment deadline approaching</li>
                <li>Financial aid urgency</li>
                <li>Grade disputes</li>
                <li>Attendance issues</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Medium (24-48 hours)</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>General questions</li>
                <li>Program information</li>
                <li>Schedule changes</li>
                <li>Non-urgent technical issues</li>
              </ul>
            </div>

            <div className="bg-brand-green-50 border-l-4 border-brand-green-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Low (3-5 business days)</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>General feedback</li>
                <li>Suggestions</li>
                <li>Non-time-sensitive requests</li>
                <li>Historical records</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Business Hours</h2>
            <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200 mb-6">
              <ul className="space-y-2 text-black">
                <li><strong>Monday - Friday:</strong> 8:00 AM - 6:00 PM EST</li>
                <li><strong>Saturday:</strong> 9:00 AM - 1:00 PM EST (limited services)</li>
                <li><strong>Sunday:</strong> Closed</li>
                <li><strong>Holidays:</strong> Closed (see holiday schedule)</li>
              </ul>
              <p className="text-black mt-4">
                Response times are calculated based on business hours. Requests received outside business 
                hours will be addressed on the next business day.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Exceptions</h2>
            <p className="text-black mb-4">
              Response times may be extended during:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Peak enrollment periods (2-4 weeks before term start)</li>
              <li>System maintenance or upgrades</li>
              <li>Holidays and institutional closures</li>
              <li>Emergency situations</li>
              <li>Unusually high volume of requests</li>
            </ul>
            <p className="text-black mb-6">
              We will notify users of expected delays when possible.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Escalation Process</h2>
            <p className="text-black mb-4">
              If you don't receive a response within the expected timeframe:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Check spam/junk folders for email responses</li>
              <li>Verify you provided correct contact information</li>
              <li>Follow up with the same department</li>
              <li>If no response after 2 follow-ups, escalate to supervisor</li>
              <li>Contact main office: (317) 314-3757</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Quality Standards</h2>
            <p className="text-black mb-4">
              All responses will:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Be professional and courteous</li>
              <li>Address the specific question or concern</li>
              <li>Provide clear, actionable information</li>
              <li>Include next steps if applicable</li>
              <li>Offer additional resources when helpful</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Information</h2>
            <p className="text-black mb-4">
              For inquiries and support:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>General:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>Admissions:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>Student Services:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>IT Support:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Emergency:</strong> (317) 314-3757 ext. 911</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/acceptable-use" className="text-brand-blue-600 hover:underline">Acceptable Use Policy</a></li>
                <li><a href="/policies/student-code" className="text-brand-blue-600 hover:underline">Student Code of Conduct</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
