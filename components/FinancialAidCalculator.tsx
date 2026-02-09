"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export function FinancialAidCalculator() {
  const [income, setIncome] = useState('');
  const [dependents, setDependents] = useState('0');
  const [tuition, setTuition] = useState('');
  const [results, setResults] = useState<any>(null);

  const calculateAid = async () => {
    const incomeNum = parseFloat(income) || 0;
    const tuitionNum = parseFloat(tuition) || 0;
    const dependentsNum = parseInt(dependents) || 0;

    let eligibleGrant = 0;
    if (incomeNum < 30000) eligibleGrant = tuitionNum * 0.8;
    else if (incomeNum < 50000) eligibleGrant = tuitionNum * 0.5;
    else if (incomeNum < 75000) eligibleGrant = tuitionNum * 0.3;

    eligibleGrant += dependentsNum * 500;

    const maxLoan = Math.min(tuitionNum - eligibleGrant, 20000);
    const outOfPocket = Math.max(0, tuitionNum - eligibleGrant - maxLoan);

    const calculationResults = {
      totalCost: tuitionNum,
      grants: eligibleGrant,
      loans: maxLoan,
      outOfPocket: outOfPocket,
    };

    setResults(calculationResults);

    // Log calculation for analytics
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('financial_aid_calculations').insert({
        user_id: user?.id || null,
        income_range: incomeNum < 30000 ? 'low' : incomeNum < 50000 ? 'medium' : 'high',
        dependents: dependentsNum,
        tuition_amount: tuitionNum,
        estimated_grant: eligibleGrant,
        estimated_loan: maxLoan,
        out_of_pocket: outOfPocket,
      }).catch(() => {});
    } catch {
      // Analytics logging is non-critical
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Financial Aid Calculator</h1>
          <p className="text-red-100">Estimate your financial aid eligibility</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Your Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Annual Household Income</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded"
                  value={income}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setIncome(e.target.value)}
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Number of Dependents</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded"
                  value={dependents}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setDependents(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Program Tuition</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded"
                  value={tuition}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTuition(e.target.value)}
                  placeholder="15000"
                />
              </div>

              <Button onClick={calculateAid} className="w-full">Calculate Aid</Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Estimated Aid Package</h2>
            {results ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-black">Total Program Cost</p>
                  <p className="text-2xl font-bold">${results.totalCost.toLocaleString()}</p>
                </div>

                <div className="p-4 bg-green-50 rounded">
                  <p className="text-sm text-green-700">Grants & Scholarships</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${results.grants.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded">
                  <p className="text-sm text-blue-700">Student Loans</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${results.loans.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded">
                  <p className="text-sm text-orange-700">Out of Pocket</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${results.outOfPocket.toLocaleString()}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-bold mb-2">Payment Plan Options</h3>
                  <ul className="space-y-2 text-sm text-black">
                    <li>• Monthly payment: ${(results.outOfPocket / 12).toFixed(2)}</li>
                    <li>• Quarterly payment: ${(results.outOfPocket / 4).toFixed(2)}</li>
                    <li>• Semester payment: ${(results.outOfPocket / 2).toFixed(2)}</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Enter your information and click Calculate Aid to see your estimated package
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
