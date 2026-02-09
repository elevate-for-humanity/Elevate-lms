'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';

type Step = 'intake' | 'review' | 'agreement' | 'confirmation';

interface IntakeData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dateOfBirth: string;
  hasHighSchoolDiploma: boolean;
  priorExperience: string;
  preferredSchedule: string;
  howDidYouHear: string;
}

const AGREEMENT_VERSION = 'apprentice_participation_v1';

export default function ApprenticeEnrollmentPage() {
  const [step, setStep] = useState<Step>('intake');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'IN',
    zip: '',
    dateOfBirth: '',
    hasHighSchoolDiploma: false,
    priorExperience: '',
    preferredSchedule: '',
    howDidYouHear: '',
  });
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementName, setAgreementName] = useState('');

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('review');
  };

  const handleAgreementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreementAccepted || !agreementName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/enrollments/apprentice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: intakeData,
          agreement: {
            key: AGREEMENT_VERSION,
            version: 'v1',
            acceptedName: agreementName,
            acceptedEmail: intakeData.email,
          },
        }),
      });

      if (response.ok) {
        setStep('confirmation');
      } else {
        alert('There was an error submitting your application. Please try again.');
      }
    } catch {
      alert('There was an error submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
            <Breadcrumbs items={[{ label: "Portal", href: "/portal" }, { label: "Student", href: "/portal/student/dashboard" }, { label: "Enroll" }]} />
<div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/programs/barber-apprenticeship"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Program
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Barber Apprenticeship Enrollment</h1>
          <p className="text-gray-600 mt-2">Complete your enrollment application</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {['Intake', 'Review', 'Agreement', 'Done'].map((label, i) => {
            const steps: Step[] = ['intake', 'review', 'agreement', 'confirmation'];
            const isActive = steps.indexOf(step) >= i;
            const isCurrent = steps[i] === step;
            return (
              <div key={label} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  } ${isCurrent ? 'ring-4 ring-blue-200' : ''}`}
                >
                  {i + 1}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  {label}
                </span>
                {i < 3 && <div className={`w-8 h-0.5 mx-2 ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          {step === 'intake' && (
            <form onSubmit={handleIntakeSubmit} className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Personal Information</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={intakeData.fullName}
                    onChange={(e) => setIntakeData({ ...intakeData, fullName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={intakeData.email}
                    onChange={(e) => setIntakeData({ ...intakeData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={intakeData.phone}
                    onChange={(e) => setIntakeData({ ...intakeData, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={intakeData.dateOfBirth}
                    onChange={(e) => setIntakeData({ ...intakeData, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={intakeData.address}
                  onChange={(e) => setIntakeData({ ...intakeData, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={intakeData.city}
                    onChange={(e) => setIntakeData({ ...intakeData, city: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <select
                    required
                    value={intakeData.state}
                    onChange={(e) => setIntakeData({ ...intakeData, state: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="IN">Indiana</option>
                    <option value="IL">Illinois</option>
                    <option value="OH">Ohio</option>
                    <option value="KY">Kentucky</option>
                    <option value="MI">Michigan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP *</label>
                  <input
                    type="text"
                    required
                    value={intakeData.zip}
                    onChange={(e) => setIntakeData({ ...intakeData, zip: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="diploma"
                  checked={intakeData.hasHighSchoolDiploma}
                  onChange={(e) => setIntakeData({ ...intakeData, hasHighSchoolDiploma: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="diploma" className="text-sm text-gray-700">
                  I have a high school diploma or GED
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prior Barbering Experience</label>
                <textarea
                  value={intakeData.priorExperience}
                  onChange={(e) => setIntakeData({ ...intakeData, priorExperience: e.target.value })}
                  placeholder="Describe any prior experience (or write 'None')"
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Schedule</label>
                <select
                  value={intakeData.preferredSchedule}
                  onChange={(e) => setIntakeData({ ...intakeData, preferredSchedule: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="full-time">Full-time (40 hrs/week)</option>
                  <option value="part-time">Part-time (25-30 hrs/week)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
                <input
                  type="text"
                  value={intakeData.howDidYouHear}
                  onChange={(e) => setIntakeData({ ...intakeData, howDidYouHear: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                Continue to Review
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {step === 'review' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Review Your Information</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                <p><strong>Name:</strong> {intakeData.fullName}</p>
                <p><strong>Email:</strong> {intakeData.email}</p>
                <p><strong>Phone:</strong> {intakeData.phone}</p>
                <p><strong>Address:</strong> {intakeData.address}, {intakeData.city}, {intakeData.state} {intakeData.zip}</p>
                <p><strong>Date of Birth:</strong> {intakeData.dateOfBirth}</p>
                <p><strong>High School Diploma/GED:</strong> {intakeData.hasHighSchoolDiploma ? 'Yes' : 'No'}</p>
                <p><strong>Prior Experience:</strong> {intakeData.priorExperience || 'None provided'}</p>
                <p><strong>Preferred Schedule:</strong> {intakeData.preferredSchedule || 'Not specified'}</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('intake')}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Edit Information
                </button>
                <button
                  onClick={() => setStep('agreement')}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 'agreement' && (
            <form onSubmit={handleAgreementSubmit}>
              <h2 className="text-xl font-bold mb-4">Apprentice Participation Agreement</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto text-sm text-gray-700 space-y-4">
                <p className="font-medium">This agreement explains the terms for participating in the Barber Apprenticeship Program administered by Elevate for Humanity. Please read carefully before continuing.</p>
                
                <div>
                  <h3 className="font-bold text-gray-900">1. Program Overview</h3>
                  <p>The Barber Apprenticeship Program is a fee-based training pathway designed to help participants complete supervised barbering hours inside an approved host barbershop.</p>
                  <p className="mt-2">This program provides:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>A structured apprenticeship framework</li>
                    <li>Hour tracking and documentation support</li>
                    <li>Program oversight and completion verification</li>
                  </ul>
                  <p className="mt-2 font-medium">This program is not funded by the State of Indiana.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">2. No Guarantee of Licensure or Employment</h3>
                  <p>Completion of this program does not guarantee:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Barber licensure</li>
                    <li>Employment</li>
                    <li>Placement in a specific shop</li>
                  </ul>
                  <p className="mt-2">Final licensure decisions are made by the State of Indiana. Employment outcomes depend on individual performance and market conditions.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">3. Placement With Host Shops</h3>
                  <p>Apprentices complete training hours inside approved host barbershops.</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Host shops must be approved before apprentice placement</li>
                    <li>Placement depends on shop availability and approval status</li>
                    <li>Elevate for Humanity does not own or operate host shops</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">4. Fees and Costs</h3>
                  <p>Tuition covers program administration, structure, tracking, and documentation.</p>
                  <p className="mt-2">Tuition does not cover:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Tools or equipment</li>
                    <li>Uniforms</li>
                    <li>State exams or licensing fees</li>
                  </ul>
                  <p className="mt-2">Payment terms are reviewed during intake.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">5. Participant Responsibilities</h3>
                  <p>As an apprentice, you agree to:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Follow program guidelines</li>
                    <li>Act professionally in the host shop</li>
                    <li>Accurately report required information</li>
                    <li>Comply with shop policies</li>
                  </ul>
                  <p className="mt-2">Failure to meet expectations may result in removal from the program.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">6. Agreement Acknowledgment</h3>
                  <p>By submitting this application, you confirm that:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>The information you provided is accurate</li>
                    <li>You understand this is a fee-based program</li>
                    <li>You agree to the terms above</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreement"
                    checked={agreementAccepted}
                    onChange={(e) => setAgreementAccepted(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                    required
                  />
                  <label htmlFor="agreement" className="text-sm text-gray-700">
                    I have read and agree to the Apprentice Participation Agreement. I understand this submission is legally binding.
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type your full legal name to sign *
                  </label>
                  <input
                    type="text"
                    required
                    value={agreementName}
                    onChange={(e) => setAgreementName(e.target.value)}
                    placeholder="Full Legal Name"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Accepted on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('review')}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!agreementAccepted || !agreementName.trim() || isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          )}

          {step === 'confirmation' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Received!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for applying to the Barber Apprenticeship program. We've received your application and will be in touch soon.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>Note:</strong> Placement occurs once an approved host shop is available. We will contact you to discuss next steps and payment options.
                </p>
              </div>
              <Link
                href="/programs/barber-apprenticeship"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Return to Program Page
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
