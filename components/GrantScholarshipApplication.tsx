"use client";

import React from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
interface Grant {
  id: string;
  name: string;
  amount: number;
  deadline: string;
  eligibility: string[];
  status: 'open' | 'closed' | 'upcoming';
}
export default function GrantScholarshipApplication() {
  const [selectedGrant, setSelectedGrant] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    program: '',
    gpa: '',
    essay: '',
  });
  const grants: Grant[] = [
    {
      id: '1',
      name: 'Merit Scholarship',
      amount: 5000,
      deadline: '2024-06-30',
      eligibility: ['GPA 3.5+', 'Full-time enrollment', 'First-time applicant'],
      status: 'open',
    },
    {
      id: '2',
      name: 'Need-Based Grant',
      amount: 3000,
      deadline: '2024-07-15',
      eligibility: ['Financial need', 'US citizen or permanent resident'],
      status: 'open',
    },
  ];
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    //
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Grants & Scholarships</h1>
          <p className="text-brand-red-100">Apply for financial assistance</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-4">Available Opportunities</h2>
            <div className="space-y-4">
              {grants.map((grant) => (
                <Card
                  key={grant.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedGrant === grant.id ? 'ring-2 ring-brand-red-600' : ''
                  }`}
                  onClick={() => setSelectedGrant(grant.id)}
                >
                  <h3 className="font-bold text-lg">{grant.name}</h3>
                  <p className="text-2xl font-bold text-brand-orange-600">${grant.amount.toLocaleString('en-US')}</p>
                  <p className="text-sm text-black">Deadline: {grant.deadline}</p>
                  <span className={`inline-block mt-2 px-2 py-2 rounded text-xs ${
                    grant.status === 'open' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-gray-100 text-black'
                  }`}>
                    {grant.status}
                  </span>
                </Card>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            {selectedGrant ? (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Application Form</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded"
                        value={formData.firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded"
                        value={formData.lastName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border rounded"
                      value={formData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Essay (500 words)</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded h-32"
                      value={formData.essay}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, essay: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Submit Application</Button>
                </form>
              </Card>
            ) : (
              <Card className="p-6 text-center text-gray-500">
                Select a grant or scholarship to begin your application
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
