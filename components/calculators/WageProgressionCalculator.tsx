'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, GraduationCap, Briefcase, Calculator } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface WageProgressionCalculatorProps {
  programSlug?: string;
  className?: string;
  showDetailed?: boolean;
}

interface WageStage {
  period: string;
  hourlyRate: number;
  weeklyHours: number;
  monthlyEarnings: number;
  description: string;
}

export function WageProgressionCalculator({
  programSlug = 'barbering-apprenticeship',
  className = '',
  showDetailed = true
}: WageProgressionCalculatorProps) {
  const [currentWage, setCurrentWage] = useState<string>('');
  const [employmentStatus, setEmploymentStatus] = useState<'unemployed' | 'part_time' | 'full_time'>('unemployed');
  const [calculated, setCalculated] = useState(false);
  const [animating, setAnimating] = useState(false);

  const defaultWages: WageStage[] = [
    {
      period: 'Months 1-6',
      hourlyRate: 14.00,
      weeklyHours: 40,
      monthlyEarnings: 2426.67,
      description: 'Starting apprentice wage'
    },
    {
      period: 'Months 7-12',
      hourlyRate: 16.00,
      weeklyHours: 40,
      monthlyEarnings: 2773.33,
      description: 'After 1,000 hours completed'
    },
    {
      period: 'Months 13-18',
      hourlyRate: 18.00,
      weeklyHours: 40,
      monthlyEarnings: 3120.00,
      description: 'Senior apprentice rate'
    }
  ];

  const totalApprenticeshipEarnings = defaultWages.reduce((sum, stage) => sum + stage.monthlyEarnings * 6, 0);
  const licensedBarberSalary = 42000;

  const handleCalculate = async () => {
    setAnimating(true);
    setCalculated(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('calculator_usage').insert({
        user_id: user?.id || null,
        calculator_type: 'wage_progression',
        program_slug: programSlug,
        current_wage: currentWage || null,
        employment_status: employmentStatus,
        calculated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging calculation:', error);
    }
    
    setTimeout(() => setAnimating(false), 1000);
  };

  const currentWageNum = parseFloat(currentWage) || 0;
  const currentAnnual = currentWageNum * 2080;
  const currentMonthly = currentAnnual / 12;

  return (
    <div className={`wage-calculator ${className}`}>
      <Card className="p-6 md:p-8 bg-gradient-to-br from-brand-blue-900 to-brand-blue-800 text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/10 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Wage Progression Calculator</h3>
            <p className="text-blue-200 text-sm">See how your earnings grow during apprenticeship</p>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Your Current Situation</label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-blue-200 mb-1">Employment Status</label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value as 'unemployed' | 'part_time' | 'full_time')}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="unemployed" className="text-gray-900">Unemployed</option>
                <option value="part_time" className="text-gray-900">Working Part-Time</option>
                <option value="full_time" className="text-gray-900">Working Full-Time</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-blue-200 mb-1">
                {employmentStatus === 'unemployed' ? 'Desired Starting Wage (Optional)' : 'Current Hourly Wage'}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="number"
                  value={currentWage}
                  onChange={(e) => setCurrentWage(e.target.value)}
                  placeholder={employmentStatus === 'unemployed' ? '15.00' : '14.00'}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-blue-300 focus:outline-none focus:ring-2 focus:ring-white/30"
                  disabled={employmentStatus === 'unemployed'}
                />
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleCalculate}
          className="w-full bg-white text-brand-blue-900 hover:bg-blue-50 font-bold text-lg py-4 mb-8"
        >
          Calculate My Earning Potential
        </Button>

        {calculated && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Your Apprenticeship Earnings
              </h4>
              
              <div className="space-y-4">
                {defaultWages.map((stage, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{stage.period}</p>
                      <p className="text-sm text-blue-200">{stage.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">${stage.hourlyRate.toFixed(2)}/hr</p>
                      <p className="text-sm text-blue-200">${stage.monthlyEarnings.toFixed(0)}/mo</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Earned During Apprenticeship</span>
                  <span className="text-3xl font-bold text-green-400">
                    ~${Math.round(totalApprenticeshipEarnings).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-blue-200 mt-1">
                  18 months of training • No tuition to repay
                </p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                After You Become a Licensed Barber
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-blue-200 mb-1">Entry Level</p>
                  <p className="text-3xl font-bold">$42,000<span className="text-lg font-normal">/yr</span></p>
                  <p className="text-sm text-blue-200">$20-22/hr + tips</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-blue-200 mb-1">Experienced</p>
                  <p className="text-3xl font-bold">$55,000<span className="text-lg font-normal">/yr</span></p>
                  <p className="text-sm text-blue-200">$25-28/hr + tips</p>
                </div>
              </div>
            </div>

            {currentWageNum > 0 && (
              <div className="bg-white/5 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Your Comparison
                </h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-red-500/10 rounded-lg">
                    <p className="text-sm text-blue-200 mb-1">Before Elevate</p>
                    <p className="text-2xl font-bold">${currentAnnual.toLocaleString()}/yr</p>
                    <p className="text-sm text-blue-200">${currentMonthly.toFixed(0)}/month</p>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <p className="text-sm text-blue-200 mb-1">After Elevate</p>
                    <p className="text-2xl font-bold text-green-400">$68,000/yr</p>
                    <p className="text-sm text-blue-200">$55K + $15K tips</p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-white/10 rounded-lg text-center">
                  <p className="text-4xl font-bold text-green-400">
                    +${Math.round(68000 - currentAnnual).toLocaleString()}
                  </p>
                  <p className="text-blue-200">more per year</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold"
                onClick={() => window.location.href = '/apply/barbering-apprenticeship'}
              >
                Apply for Barbering Apprenticeship
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-white text-white hover:bg-white/10"
                onClick={() => window.location.href = '/check-eligibility'}
              >
                Check Funding Eligibility
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-blue-200 mt-6 text-center">
          Wage estimates based on Indiana Bureau of Labor Statistics and Elevate graduate surveys. 
          Actual earnings may vary based on employer, location, and individual performance.
        </p>
      </Card>
    </div>
  );
}

export default WageProgressionCalculator;
