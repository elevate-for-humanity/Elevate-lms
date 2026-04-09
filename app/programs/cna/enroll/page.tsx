'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Check, 
  CreditCard, 
  Calendar, 
  Shield, 
  Clock,
  GraduationCap,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

const PROGRAM_DETAILS = {
  name: 'Certified Nursing Assistant (CNA)',
  duration: '4-8 weeks',
  schedule: 'Day, evening, or weekend options',
  price: 1200,
  downPayment: 200,
  weeklyPayment: 50,
  paymentWeeks: 20,
};

export default function CNAEnrollPage() {
  // Auth guard — enrollment requires a signed-in account
  useEffect(() => {
    const checkAuth = async () => {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login?redirect=/programs/cna/enroll';
      }
    };
    checkAuth();
  }, []);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'IN',
    zip: '',
    dateOfBirth: '',
    ssn: '',
    emergencyContact: '',
    emergencyPhone: '',
    paymentOption: 'payment-plan',
    agreeToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Submit enrollment data
      const response = await fetch('/api/enroll/cna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          program: 'cna',
          price: PROGRAM_DETAILS.price,
          paymentPlan: formData.paymentOption === 'payment-plan' ? {
            downPayment: PROGRAM_DETAILS.downPayment,
            weeklyPayment: PROGRAM_DETAILS.weeklyPayment,
            weeks: PROGRAM_DETAILS.paymentWeeks,
          } : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Enrollment submission failed');
      }

      // Require a real persisted UUID before proceeding to payment.
      // A timestamp-format ID (CNA-XXXXXXX) means the DB write did not happen.
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!data.enrollmentId || !uuidPattern.test(data.enrollmentId)) {
        throw new Error('Enrollment could not be confirmed. Please call (317) 314-3757.');
      }

      // Redirect to payment
      if (formData.paymentOption === 'payment-plan') {
        window.location.href = `/lms/payments/checkout?program=cna&amount=${PROGRAM_DETAILS.downPayment}&type=down-payment&enrollment=${data.enrollmentId}`;
      } else {
        window.location.href = `/lms/payments/checkout?program=cna&amount=${PROGRAM_DETAILS.price}&type=full-payment&enrollment=${data.enrollmentId}`;
      }
    } catch (err) {
      setError('There was an error processing your enrollment. Please try again or contact us at our contact form');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Programs", href: "/programs" }, { label: "Enroll" }]} />
      </div>
{/* Header */}
      <div className="bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/programs/cna" className="inline-flex items-center gap-2 text-white hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to CNA Program
          </Link>
          <h1 className="text-3xl font-bold">Enroll in CNA Certification</h1>
          <p className="text-white mt-2">Start your healthcare career in just 4-8 weeks</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step >= s ? 'bg-brand-blue-600 text-white' : 'bg-slate-200 text-black'
                  }`}>
                    {step > s ? <Check className="w-5 h-5" /> : s}
                  </div>
                  {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-brand-blue-600' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6">
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Personal Information</h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      >
                        <option value="IN">Indiana</option>
                        <option value="IL">Illinois</option>
                        <option value="OH">Ohio</option>
                        <option value="KY">Kentucky</option>
                        <option value="MI">Michigan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ZIP *</label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-brand-blue-600 text-white py-3 rounded-lg font-bold hover:bg-brand-blue-700"
                  >
                    Continue to Emergency Contact
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Emergency Contact</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Name *</label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact Phone *</label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border border-slate-300 py-3 rounded-lg font-bold hover:bg-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 bg-brand-blue-600 text-white py-3 rounded-lg font-bold hover:bg-brand-blue-700"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold">Payment Options</h2>
                  
                  <div className="space-y-4">
                    <label className={`block p-4 border-2 rounded-xl cursor-pointer transition ${
                      formData.paymentOption === 'payment-plan' 
                        ? 'border-brand-blue-600 bg-brand-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="paymentOption"
                        value="payment-plan"
                        checked={formData.paymentOption === 'payment-plan'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                          formData.paymentOption === 'payment-plan' ? 'border-brand-blue-600' : 'border-slate-300'
                        }`}>
                          {formData.paymentOption === 'payment-plan' && (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">Payment Plan</span>
                            <span className="bg-brand-green-100 text-brand-green-700 px-2 py-1 rounded text-sm font-medium">Most Popular</span>
                          </div>
                          <p className="text-black mt-1">
                            <span className="text-2xl font-bold text-slate-900">${PROGRAM_DETAILS.downPayment}</span> down payment
                          </p>
                          <p className="text-black">
                            + <span className="font-semibold">${PROGRAM_DETAILS.weeklyPayment}/week</span> for {PROGRAM_DETAILS.paymentWeeks} weeks
                          </p>
                          <p className="text-sm text-black mt-2">Total: ${PROGRAM_DETAILS.price}</p>
                        </div>
                      </div>
                    </label>

                    <label className={`block p-4 border-2 rounded-xl cursor-pointer transition ${
                      formData.paymentOption === 'full-payment' 
                        ? 'border-brand-blue-600 bg-brand-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="paymentOption"
                        value="full-payment"
                        checked={formData.paymentOption === 'full-payment'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 ${
                          formData.paymentOption === 'full-payment' ? 'border-brand-blue-600' : 'border-slate-300'
                        }`}>
                          {formData.paymentOption === 'full-payment' && (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-lg">Pay in Full</span>
                          <p className="text-black mt-1">
                            <span className="text-2xl font-bold text-slate-900">${PROGRAM_DETAILS.price}</span> one-time payment
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="border-t pt-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        required
                        className="mt-1 w-5 h-5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                      />
                      <span className="text-sm text-black">
                        I agree to the <Link href="/terms-of-service" className="text-brand-blue-600 hover:underline">Terms of Service</Link> and <Link href="/refund-policy" className="text-brand-blue-600 hover:underline">Refund Policy</Link>. I understand that the down payment is non-refundable and weekly payments are due every Monday.
                      </span>
                    </label>
                  </div>

                  {error && (
                    <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 border border-slate-300 py-3 rounded-lg font-bold hover:bg-white"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!formData.agreeToTerms || isSubmitting}
                      className="flex-1 bg-brand-blue-600 text-white py-3 rounded-lg font-bold hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          {formData.paymentOption === 'payment-plan' 
                            ? `Pay $${PROGRAM_DETAILS.downPayment} Down Payment`
                            : `Pay $${PROGRAM_DETAILS.price} Now`
                          }
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Program Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-lg mb-4">Program Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-brand-blue-600" />
                  <span>{PROGRAM_DETAILS.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-brand-blue-600" />
                  <span>{PROGRAM_DETAILS.duration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-brand-blue-600" />
                  <span>{PROGRAM_DETAILS.schedule}</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-brand-blue-600" />
                  <span className="font-bold">${PROGRAM_DETAILS.price} total</span>
                </div>
              </div>
            </div>

            {/* Payment Plan Details */}
            <div className="bg-brand-blue-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4">Payment Plan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Down Payment (Today)</span>
                  <span className="font-bold">${PROGRAM_DETAILS.downPayment}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly Payments</span>
                  <span className="font-bold">${PROGRAM_DETAILS.weeklyPayment}/week</span>
                </div>
                <div className="flex justify-between">
                  <span>Number of Weeks</span>
                  <span className="font-bold">{PROGRAM_DETAILS.paymentWeeks} weeks</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">${PROGRAM_DETAILS.price}</span>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-5 h-5 text-brand-green-600" />
                  <span>Secure payment via Stripe</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-black flex-shrink-0">•</span>
                  <span>State-approved program</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-black flex-shrink-0">•</span>
                  <span>Job placement support</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="text-center text-sm text-black">
              <p>Questions? Contact us:</p>
              <p className="font-medium">Contact Us</p>
              <p className="font-medium">(317) 314-3757</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
