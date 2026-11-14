'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ROICalculatorProps {
  defaultStudents?: number;
  defaultHours?: number;
  defaultRate?: number;
}

export function ROICalculator({ 
  defaultStudents = 50,
  defaultHours = 40,
  defaultRate = 25 
}: ROICalculatorProps) {
  const [students, setStudents] = useState(defaultStudents);
  const [hoursPerStudent, setHoursPerStudent] = useState(defaultHours);
  const [currentCostPerHour, setCurrentCostPerHour] = useState(defaultRate);
  const [platformCost, setPlatformCost] = useState(99);

  // Calculations
  const currentTotalHours = students * hoursPerStudent;
  const currentAnnualCost = currentTotalHours * currentCostPerHour;
  
  const efficiencyGain = 0.4; // 40% time savings with platform
  const newTotalHours = currentTotalHours * (1 - efficiencyGain);
  const newAnnualCost = newTotalHours * currentCostPerHour + (platformCost * 12);
  
  const annualSavings = currentAnnualCost - newAnnualCost;
  const roi = ((annualSavings / (platformCost * 12)) * 100).toFixed(0);
  const paybackMonths = Math.round((platformCost * 12) / (annualSavings / 12));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <Calculator className="w-5 h-5 text-white" />
          <h3 className="text-white font-bold">ROI Calculator</h3>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Students per Year
              </label>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={students}
                onChange={(e) => setStudents(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-sm text-slate-500 mt-1">
                <span>10</span>
                <span className="font-bold text-slate-900">{students}</span>
                <span>500</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Hours per Student (Training + Admin)
              </label>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={hoursPerStudent}
                onChange={(e) => setHoursPerStudent(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-sm text-slate-500 mt-1">
                <span>5 hrs</span>
                <span className="font-bold text-slate-900">{hoursPerStudent} hrs</span>
                <span>200 hrs</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Your Cost per Hour ($/hr)
              </label>
              <input
                type="range"
                min={15}
                max={150}
                step={5}
                value={currentCostPerHour}
                onChange={(e) => setCurrentCostPerHour(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-sm text-slate-500 mt-1">
                <span>$15</span>
                <span className="font-bold text-slate-900">${currentCostPerHour}/hr</span>
                <span>$150</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Platform Cost ($/mo)
              </label>
              <input
                type="range"
                min={29}
                max={499}
                step={10}
                value={platformCost}
                onChange={(e) => setPlatformCost(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-sm text-slate-500 mt-1">
                <span>$29</span>
                <span className="font-bold text-slate-900">${platformCost}/mo</span>
                <span>$499</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-5">
              <p className="text-sm text-slate-500 mb-1">Current Annual Cost</p>
              <p className="text-3xl font-bold text-slate-900">
                ${currentAnnualCost.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {currentTotalHours.toLocaleString()} hours × ${currentCostPerHour}/hr
              </p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
              <p className="text-sm text-emerald-600 mb-1">With Elevate Platform</p>
              <p className="text-3xl font-bold text-emerald-700">
                ${newAnnualCost.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                40% efficiency gain + platform cost
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-brand-blue-50 rounded-xl p-4 text-center">
                <TrendingUp className="w-6 h-6 text-brand-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-brand-blue-700">{roi}%</p>
                <p className="text-xs text-brand-blue-600">ROI</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-700">{paybackMonths} mo</p>
                <p className="text-xs text-purple-600">Payback</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 text-white text-center">
              <p className="text-sm text-slate-300 mb-1">Estimated Annual Savings</p>
              <p className="text-3xl font-bold text-emerald-400">
                ${annualSavings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <Link
            href="/contact?subject=ROI+Demo"
            className="flex items-center justify-center gap-2 w-full bg-brand-blue-600 text-white font-bold py-3 rounded-xl hover:bg-brand-blue-700 transition-colors"
          >
            Get Your Custom ROI Analysis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
