"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface Partner {
  id: string;
  name: string;
  industry: string;
  logo: string;
  status: 'active' | 'pending' | 'inactive';
  joinedDate: string;
  contactPerson: string;
  email: string;
  phone: string;
}

interface Collaboration {
  id: string;
  title: string;
  partner: string;
  type: 'internship' | 'job-placement' | 'curriculum' | 'mentorship' | 'funding';
  status: 'active' | 'completed' | 'planning';
  startDate: string;
  participants: number;
}

export default function IndustryPartnershipPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'collaborations' | 'opportunities'>('overview');

  const partners: Partner[] = [
    {
      id: '1',
      name: 'Tech Solutions Inc',
      industry: 'Technology',
      logo: '💻',
      status: 'active',
      joinedDate: '2023-01',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@techsolutions.com',
      phone: '(317) 314-3757',
    },
    {
      id: '2',
      name: 'Healthcare Plus',
      industry: 'Healthcare',
      logo: '🏥',
      status: 'active',
      joinedDate: '2023-03',
      contactPerson: 'Dr. Michael Chen',
      email: 'mchen@healthcareplus.com',
      phone: '(555) 200-2000',
    },
  ];

  const collaborations: Collaboration[] = [
    {
      id: '1',
      title: 'Software Development Internship Program',
      partner: 'Tech Solutions Inc',
      type: 'internship',
      status: 'active',
      startDate: '2024-01',
      participants: 25,
    },
    {
      id: '2',
      title: 'CNA Clinical Placement',
      partner: 'Healthcare Plus',
      type: 'job-placement',
      status: 'active',
      startDate: '2023-11',
      participants: 40,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Industry Partnership Portal</h1>
          <p className="text-brand-red-100">Collaborate with industry leaders</p>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {(['overview', 'partners', 'collaborations', 'opportunities'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium ${
                  activeTab === tab ? 'border-brand-red-600 text-brand-orange-600' : 'border-transparent text-gray-500'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-brand-orange-600">{partners.length}</h3>
              <p className="text-black">Active Partners</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-brand-orange-500">{collaborations.length}</h3>
              <p className="text-black">Active Collaborations</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-brand-orange-600">65</h3>
              <p className="text-black">Total Participants</p>
            </Card>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="grid gap-6">
            {partners.map((partner) => (
              <Card key={partner.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl text-2xl md:text-3xl lg:text-4xl">{partner.logo}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{partner.name}</h3>
                    <p className="text-black">{partner.industry}</p>
                    <p className="text-sm text-gray-500 mt-2">{partner.contactPerson} • {partner.email}</p>
                  </div>
                  <span className={`px-3 py-2 rounded text-sm ${
                    partner.status === 'active' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-gray-100 text-black'
                  }`}>
                    {partner.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
