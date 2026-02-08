"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AutomatedEnrollmentWorkflow() {
  const [step, setStep] = useState(1);

  const workflow = [
    { step: 1, title: 'Student Applies', status: 'completed', automated: true },
    { step: 2, title: 'Eligibility Check', status: 'completed', automated: true },
    { step: 3, title: 'Payment Processing', status: 'in-progress', automated: true },
    { step: 4, title: 'Course Access Granted', status: 'pending', automated: true },
    { step: 5, title: 'Welcome Email Sent', status: 'pending', automated: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Automated Enrollment</h1>
          <p className="text-red-100">Streamlined student onboarding process</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Enrollment Workflow</h2>
          <div className="space-y-4">
            {workflow.map((item) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  item.status === 'completed' ? 'bg-green-500 text-white' :
                  item.status === 'in-progress' ? 'bg-blue-500 text-white' :
                  'bg-gray-300 text-black'
                }`}>
                  {item.status === 'completed' ? '•' : item.step}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{item.title}</p>
                  <p className="text-sm text-black">
                    {item.automated && '🤖 Automated'} • {item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Enrollments Today</h3>
            <p className="text-3xl font-bold text-brand-blue-600">24</p>
            <p className="text-sm text-green-600">↑ 15% from yesterday</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Avg Processing Time</h3>
            <p className="text-3xl font-bold text-orange-500">2.5 min</p>
            <p className="text-sm text-green-600">↓ 40% improvement</p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Success Rate</h3>
            <p className="text-3xl font-bold text-green-600">98%</p>
            <p className="text-sm text-black">Automated workflow</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
