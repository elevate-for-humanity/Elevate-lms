'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type Step = 'intake' | 'review' | 'agreement' | 'confirmation';

interface IntakeData {
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  licenseNumber: string;
  licenseExpiration: string;
  supervisorName: string;
  supervisorLicenseNumber: string;
  numberOfStations: string;
  yearsInBusiness: string;
  additionalInfo: string;
}

const AGREEMENT_VERSION = 'host_shop_mou_v1';

export default function HostShopEnrollmentPage() {
  const [step, setStep] = useState<Step>('intake');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [intakeData, setIntakeData] = useState<IntakeData>({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'IN',
    zip: '',
    licenseNumber: '',
    licenseExpiration: '',
    supervisorName: '',
    supervisorLicenseNumber: '',
    numberOfStations: '',
    yearsInBusiness: '',
    additionalInfo: '',
  });
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementName, setAgreementName] = useState('');
  const [agreementShopName, setAgreementShopName] = useState('');

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAgreementShopName(intakeData.shopName);
    setStep('review');
  };

  const handleAgreementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreementAccepted || !agreementName.trim() || !agreementShopName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/enrollments/host-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: intakeData,
          agreement: {
            key: AGREEMENT_VERSION,
            version: 'v1',
            acceptedName: agreementName,
            acceptedShopName: agreementShopName,
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
            <Breadcrumbs items={[{ label: "Portal", href: "/portal" }, { label: "Partner" }]} />
<div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/programs/barber-apprenticeship/host-shops"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Host Shop Info
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Host Shop Enrollment</h1>
          <p className="text-gray-600 mt-2">Apply to become an approved host barbershop</p>
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
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  } ${isCurrent ? 'ring-4 ring-amber-200' : ''}`}
                >
                  {i + 1}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  {label}
                </span>
                {i < 3 && <div className={`w-8 h-0.5 mx-2 ${isActive ? 'bg-amber-500' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          {step === 'intake' && (
            <form onSubmit={handleIntakeSubmit} className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Shop Information</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barbershop Name *</label>
                  <input
                    type="text"
                    required
                    value={intakeData.shopName}
                    onChange={(e) => setIntakeData({ ...intakeData, shopName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner/Manager Name *</label>
                  <input
                    type="text"
                    required
                    value={intakeData.ownerName}
                    onChange={(e) => setIntakeData({ ...intakeData, ownerName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={intakeData.email}
                    onChange={(e) => setIntakeData({ ...intakeData, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={intakeData.phone}
                    onChange={(e) => setIntakeData({ ...intakeData, phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Address *</label>
                <input
                  type="text"
                  required
                  value={intakeData.address}
                  onChange={(e) => setIntakeData({ ...intakeData, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <select
                    required
                    value={intakeData.state}
                    onChange={(e) => setIntakeData({ ...intakeData, state: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold mt-8 mb-4">License Information</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop License Number *</label>
                  <input
                    type="text"
                    required
                    value={intakeData.licenseNumber}
                    onChange={(e) => setIntakeData({ ...intakeData, licenseNumber: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Expiration *</label>
                  <input
                    type="date"
                    required
                    value={intakeData.licenseExpiration}
                    onChange={(e) => setIntakeData({ ...intakeData, licenseExpiration: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervising Barber Name *</label>
                  <input
                    type="text"
                    required
                    value={intakeData.supervisorName}
                    onChange={(e) => setIntakeData({ ...intakeData, supervisorName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor License Number *</label>
                  <input
                    type="text"
                    required
                    value={intakeData.supervisorLicenseNumber}
                    onChange={(e) => setIntakeData({ ...intakeData, supervisorLicenseNumber: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold mt-8 mb-4">Additional Details</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Stations</label>
                  <input
                    type="number"
                    value={intakeData.numberOfStations}
                    onChange={(e) => setIntakeData({ ...intakeData, numberOfStations: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years in Business</label>
                  <input
                    type="number"
                    value={intakeData.yearsInBusiness}
                    onChange={(e) => setIntakeData({ ...intakeData, yearsInBusiness: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
                <textarea
                  value={intakeData.additionalInfo}
                  onChange={(e) => setIntakeData({ ...intakeData, additionalInfo: e.target.value })}
                  placeholder="Anything else you'd like us to know about your shop"
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2"
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
                <p><strong>Shop Name:</strong> {intakeData.shopName}</p>
                <p><strong>Owner/Manager:</strong> {intakeData.ownerName}</p>
                <p><strong>Email:</strong> {intakeData.email}</p>
                <p><strong>Phone:</strong> {intakeData.phone}</p>
                <p><strong>Address:</strong> {intakeData.address}, {intakeData.city}, {intakeData.state} {intakeData.zip}</p>
                <p><strong>Shop License:</strong> {intakeData.licenseNumber} (Exp: {intakeData.licenseExpiration})</p>
                <p><strong>Supervising Barber:</strong> {intakeData.supervisorName} (License: {intakeData.supervisorLicenseNumber})</p>
                <p><strong>Stations:</strong> {intakeData.numberOfStations || 'Not specified'}</p>
                <p><strong>Years in Business:</strong> {intakeData.yearsInBusiness || 'Not specified'}</p>
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
                  className="flex-1 bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 'agreement' && (
            <form onSubmit={handleAgreementSubmit}>
              <h2 className="text-xl font-bold mb-4">Host Barbershop Participation Agreement</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto text-sm text-gray-700 space-y-4">
                <p className="font-medium">This agreement outlines the responsibilities and expectations for barbershops applying to serve as host locations for apprentices in the Barber Apprenticeship Program administered by {PLATFORM_DEFAULTS.orgName}.</p>
                
                <div>
                  <h3 className="font-bold text-gray-900">1. Role of the Host Barbershop</h3>
                  <p>A host barbershop provides on-the-job training to apprentices while they complete required barbering hours.</p>
                  <p className="mt-2">Host shops:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Operate independently</li>
                    <li>Retain control over daily shop operations</li>
                    <li>Are not employees or agents of {PLATFORM_DEFAULTS.orgName}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">2. Host Shop Qualifications</h3>
                  <p>To participate, the barbershop must:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Hold an active Indiana barbershop license</li>
                    <li>Employ licensed barbers capable of supervision</li>
                    <li>Maintain a safe and professional training environment</li>
                  </ul>
                  <p className="mt-2 font-medium">Approval is required before hosting apprentices.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">3. Host Shop Responsibilities</h3>
                  <p>Approved host shops agree to:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Provide supervised barber training</li>
                    <li>Allow apprentices to complete required hours</li>
                    <li>Verify apprentice attendance and progress</li>
                    <li>Follow basic program guidelines</li>
                  </ul>
                  <p className="mt-2">Host shops are not required to create curriculum or manage licensing paperwork independently.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">4. Role of {PLATFORM_DEFAULTS.orgName}</h3>
                  <p>{PLATFORM_DEFAULTS.orgName} serves as the program sponsor and administrator, providing:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Apprenticeship structure</li>
                    <li>Program guidelines</li>
                    <li>Tracking and documentation support</li>
                    <li>Completion verification</li>
                  </ul>
                  <p className="mt-2">Elevate does not manage daily shop operations.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">5. No Guarantee of Apprentice Placement</h3>
                  <p>Approval as a host shop does not guarantee:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Immediate apprentice placement</li>
                    <li>A specific number of apprentices</li>
                  </ul>
                  <p className="mt-2">Placement depends on applicant availability and program needs.</p>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">6. Term and Removal</h3>
                  <p>Participation may be reviewed or discontinued if:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Program requirements are not met</li>
                    <li>Licensure lapses</li>
                    <li>Standards are not maintained</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">7. Agreement Acknowledgment</h3>
                  <p>By submitting this application, the host shop confirms that:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Information provided is accurate</li>
                    <li>The shop agrees to host responsibilities</li>
                    <li>Approval is required before hosting apprentices</li>
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
                    className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500 mt-0.5"
                    required
                  />
                  <label htmlFor="agreement" className="text-sm text-gray-700">
                    I have read and agree to the Host Barbershop Participation Agreement. I understand this submission is legally binding.
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner / Authorized Representative Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={agreementName}
                    onChange={(e) => setAgreementName(e.target.value)}
                    placeholder="Full Legal Name"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barbershop Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={agreementShopName}
                    onChange={(e) => setAgreementShopName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                  disabled={!agreementAccepted || !agreementName.trim() || !agreementShopName.trim() || isSubmitting}
                  className="flex-1 bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                Thank you for applying to become a host barbershop. We've received your application and will review it shortly.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>Note:</strong> Shops must be approved before hosting apprentices. We will verify your license information and contact you regarding next steps.
                </p>
              </div>
              <Link
                href="/programs/barber-apprenticeship/host-shops"
                className="inline-block bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 transition"
              >
                Return to Host Shop Info
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
