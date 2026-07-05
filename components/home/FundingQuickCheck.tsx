'use client';

import { useState } from 'react';
import { DollarSign, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface EligibilityResult {
  likely: boolean;
  source: string;
  coverage: string[];
  nextSteps: string[];
}

export function FundingQuickCheck() {
  const [zipCode, setZipCode] = useState('');
  const [income, setIncome] = useState<string>('');
  const [employment, setEmployment] = useState<string>('unemployed');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  const handleCheck = async () => {
    if (!zipCode || zipCode.length < 5) {
      alert('Please enter a valid ZIP code');
      return;
    }

    setChecking(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple eligibility logic
    const incomeNum = parseInt(income.replace(/[^0-9]/g, '')) || 0;
    const likelyEligible = incomeNum < 50000 || employment === 'unemployed';
    
    setResult({
      likely: likelyEligible,
      source: likelyEligible ? 'WIOA / Workforce Ready Grant' : 'Payment Plans',
      coverage: likelyEligible 
        ? ['Full tuition coverage', 'Required tools', 'Exam fees', 'Transportation assistance']
        : ['Monthly payment plans', 'BNPL options', 'Employer sponsorship'],
      nextSteps: likelyEligible
        ? ['Apply online', 'Complete eligibility form', 'Meet with WIOA counselor']
        : ['Apply online', 'Discuss payment options', 'Check employer sponsorship']
    });

    setChecking(false);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 md:p-12 bg-white shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Do You Qualify for Free Training?
            </h2>
            <p className="text-gray-600">
              Most of our students pay <strong>$0 upfront</strong>. Check your eligibility in 60 seconds.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6 mb-8">
            {/* ZIP Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <Input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter your ZIP code"
                className="w-full"
                maxLength={5}
              />
            </div>

            {/* Household Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Household Income (Annual)
              </label>
              <select
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select income range</option>
                <option value="under25k">Under $25,000</option>
                <option value="25k-40k">$25,000 - $40,000</option>
                <option value="40k-60k">$40,000 - $60,000</option>
                <option value="60k-80k">$60,000 - $80,000</option>
                <option value="over80k">Over $80,000</option>
              </select>
            </div>

            {/* Employment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Employment Status
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'unemployed', label: 'Unemployed' },
                  { value: 'part_time', label: 'Part-Time' },
                  { value: 'full_time', label: 'Full-Time' },
                  { value: 'other', label: 'Other' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEmployment(option.value)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      employment === option.value
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Check Button */}
            <Button
              onClick={handleCheck}
              disabled={checking || !zipCode || !income}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4"
            >
              {checking ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Checking Eligibility...
                </>
              ) : (
                <>
                  Check My Eligibility
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className={`p-6 rounded-xl ${
              result.likely ? 'bg-green-50 border-2 border-green-200' : 'bg-blue-50 border-2 border-blue-200'
            }`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-2 rounded-full ${
                  result.likely ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {result.likely ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${
                    result.likely ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    {result.likely 
                      ? "You Likely Qualify for Funding!"
                      : "You May Qualify for Payment Plans"}
                  </h3>
                  <p className="text-sm mt-1">
                    Based on your answers, you may be eligible for <strong>{result.source}</strong>
                  </p>
                </div>
              </div>

              {/* Coverage */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {result.likely ? 'Your funding may cover:' : 'Available options:'}
                </h4>
                <ul className="space-y-1">
                  {result.coverage.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Next Steps:</h4>
                <ol className="space-y-2">
                  {result.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-700">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        result.likely ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className={`flex-1 font-bold ${
                    result.likely 
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  onClick={() => window.location.href = '/apply'}
                >
                  Apply Now - Free
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/funding'}
                >
                  Learn About Funding
                </Button>
              </div>
            </div>
          )}

          {/* Trust indicators */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 mb-4">
              Trusted by Indiana workforce agencies
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
              <span className="px-3 py-1 bg-gray-100 rounded-full">WIOA Approved</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">WorkOne Partner</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">VR Approved</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">DWD Listed</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default FundingQuickCheck;
