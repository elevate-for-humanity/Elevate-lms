
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Verification Policy | Elevate for Humanity',
  description: 'Identity and eligibility verification procedures for students, credentials, and employment.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/verification',
  },
};

export default function VerificationPage() {

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Verification" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Verification Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This policy establishes procedures for verifying student identity, eligibility, credentials, and 
              employment. Verification protects the integrity of our programs, ensures compliance with regulations, 
              and provides reliable information to employers and other institutions.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Types of Verification</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Identity Verification</h3>
                <p className="text-black">
                  Confirming student identity during enrollment and throughout program participation.
                </p>
              </div>

              <div className="bg-brand-green-50 rounded-lg p-6 border-2 border-brand-green-200">
                <h3 className="text-xl font-bold text-black mb-3">Eligibility Verification</h3>
                <p className="text-black">
                  Confirming eligibility for programs, funding, and services.
                </p>
              </div>

              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Credential Verification</h3>
                <p className="text-black">
                  Confirming authenticity of certificates and credentials for employers.
                </p>
              </div>

              <div className="bg-brand-orange-50 rounded-lg p-6 border-2 border-brand-orange-200">
                <h3 className="text-xl font-bold text-black mb-3">Employment Verification</h3>
                <p className="text-black">
                  Confirming employment status for background checks and applications.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Identity Verification</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">During Enrollment</h3>
            <p className="text-black mb-4">
              All students must verify identity by providing:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Government-Issued Photo ID:</strong> Driver's license, state ID, passport, or military ID</li>
              <li><strong>Social Security Number or Work Authorization:</strong> SSN entered securely online during onboarding</li>
              <li><strong>Proof of Address:</strong> Utility bill, lease agreement, or official mail</li>
              <li><strong>Educational Documents:</strong> High school diploma, GED, or transcripts</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Ongoing Verification</h3>
            <p className="text-black mb-4">
              Identity may be re-verified:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Before exams and assessments</li>
              <li>When accessing sensitive information</li>
              <li>For credential issuance</li>
              <li>If identity fraud is suspected</li>
              <li>As required by funding sources</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Online Identity Verification</h3>
            <p className="text-black mb-4">
              For online students:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Secure login credentials (username and password)</li>
              <li>Multi-factor authentication for sensitive actions</li>
              <li>Proctored exams with ID verification</li>
              <li>Video verification for high-stakes assessments</li>
              <li>Biometric verification where appropriate</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Eligibility Verification</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Program Eligibility</h3>
            <p className="text-black mb-4">
              We verify eligibility for program enrollment:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Age Requirements:</strong> 18+ or 16-17 with parental consent</li>
              <li><strong>Educational Prerequisites:</strong> High school diploma or GED</li>
              <li><strong>Program-Specific Requirements:</strong> Background checks, drug screening, etc.</li>
              <li><strong>Work Authorization:</strong> Eligible to work in United States</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Funding Eligibility</h3>
            <p className="text-black mb-4">
              For government-funded programs, we verify:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>WIOA Eligibility:</strong> Income, employment status, barriers to employment</li>
              <li><strong>Vocational Rehabilitation:</strong> Disability documentation and eligibility</li>
              <li><strong>Veterans Benefits:</strong> Military service and benefit eligibility</li>
              <li><strong>TANF:</strong> Public assistance eligibility</li>
              <li><strong>Trade Adjustment Assistance:</strong> Job loss due to trade</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Credential Verification</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">For Employers and Institutions</h3>
            <p className="text-black mb-4">
              Employers may verify credentials through:
            </p>
            
            <div className="bg-brand-blue-50 rounded-xl p-6 border-2 border-brand-blue-200 mb-6">
              <h4 className="text-lg font-bold text-black mb-3">Online Verification Portal</h4>
              <ol className="list-decimal pl-6 text-black space-y-2">
                <li>Visit: www.elevateforhumanity.org/verify</li>
                <li>Enter credential ID number from certificate</li>
                <li>View verification results instantly</li>
                <li>Download verification report if needed</li>
              </ol>
            </div>

            <div className="bg-brand-green-50 rounded-xl p-6 border-2 border-brand-green-200 mb-6">
              <h4 className="text-lg font-bold text-black mb-3">Contact Registrar</h4>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Email:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
                <li><strong>Phone:</strong> (317) 314-3757</li>
                <li><strong>Fax:</strong> (317) 314-3758</li>
                <li><strong>Response Time:</strong> 1-2 business days</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Information Provided</h3>
            <p className="text-black mb-4">
              Verification confirms:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Student name (as appears on credential)</li>
              <li>Program or course completed</li>
              <li>Completion date</li>
              <li>Credential ID number</li>
              <li>Credential status (active, revoked, expired)</li>
              <li>Skills or competencies certified</li>
              <li>Issuing institution confirmation</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Student Consent</h3>
            <p className="text-black mb-6">
              Under FERPA, we may verify credentials without student consent as directory information. 
              Students may request privacy flag to require consent for verification.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Employment Verification</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">For Current and Former Employees</h3>
            <p className="text-black mb-4">
              We verify employment for:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Background checks</li>
              <li>Loan applications</li>
              <li>Rental applications</li>
              <li>New employer verification</li>
              <li>Government agencies</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Information Provided</h3>
            <p className="text-black mb-4">
              With employee consent, we verify:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Dates of employment</li>
              <li>Job title and position</li>
              <li>Employment status (full-time, part-time, contractor)</li>
              <li>Salary information (if authorized)</li>
              <li>Eligibility for rehire (if requested)</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Verification Requests</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Required Information</h3>
            <p className="text-black mb-4">
              Verification requests must include:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Requester name and organization</li>
              <li>Contact information</li>
              <li>Student/employee name</li>
              <li>Credential ID or dates of attendance/employment</li>
              <li>Purpose of verification</li>
              <li>Consent form (if required)</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Processing Time</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Online Verification:</strong> Instant</li>
              <li><strong>Email Requests:</strong> 1-2 business days</li>
              <li><strong>Phone Requests:</strong> Same day if during business hours</li>
              <li><strong>Mail/Fax Requests:</strong> 3-5 business days</li>
              <li><strong>Rush Requests:</strong> Same day ($25 fee)</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Fees</h2>
            
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Verification Fees</h3>
              <ul className="space-y-3 text-black">
                <li><strong>Online Credential Verification:</strong> Free</li>
                <li><strong>Standard Verification (email/phone):</strong> Free</li>
                <li><strong>Official Verification Letter:</strong> $10</li>
                <li><strong>Rush Processing:</strong> $25 additional</li>
                <li><strong>International Verification:</strong> $15</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Privacy and Security</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Protecting Information</h3>
            <p className="text-black mb-4">
              We protect verification information through:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Secure verification portal with encryption</li>
              <li>Verification of requester identity</li>
              <li>Logging of all verification requests</li>
              <li>Limited information disclosure</li>
              <li>Compliance with FERPA and privacy laws</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Student Rights</h3>
            <p className="text-black mb-6">
              Students have the right to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Know who has requested verification</li>
              <li>Request privacy flag on credentials</li>
              <li>Review verification logs</li>
              <li>Correct inaccurate information</li>
              <li>File complaints about improper disclosure</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Fraudulent Verification Requests</h2>
            
            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Warning Signs</h3>
              <p className="text-black mb-4">
                We investigate requests that:
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Come from suspicious email addresses</li>
                <li>Request unusual information</li>
                <li>Lack proper authorization</li>
                <li>Use forged consent forms</li>
                <li>Come from known fraudulent sources</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Information</h2>
            <p className="text-black mb-4">
              For verification services:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Online Portal:</strong> www.elevateforhumanity.org/verify</li>
              <li><strong>Email:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Fax:</strong> (317) 314-3758</li>
              <li><strong>Mail:</strong> Registrar Office, Elevate for Humanity</li>
              <li className="ml-6">8888 Keystone Crossing, Suite 1300</li>
              <li className="ml-6">Indianapolis, IN 46240</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/credentials" className="text-brand-blue-600 hover:underline">Credentials Policy</a></li>
                <li><a href="/policies/ferpa" className="text-brand-blue-600 hover:underline">FERPA Policy</a></li>
                <li><a href="/privacy-policy" className="text-brand-blue-600 hover:underline">Privacy Policy</a></li>
                <li><a href="/policies/admissions" className="text-brand-blue-600 hover:underline">Admissions Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
