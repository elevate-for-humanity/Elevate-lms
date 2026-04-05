"use client";

import React from 'react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledDate?: string;
}

export function EmailCampaignManager() {
  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'New Course Launch',
      subject: 'Introducing Advanced React Patterns',
      recipients: 1245,
      sent: 1245,
      opened: 892,
      clicked: 456,
      status: 'sent',
    },
    {
      id: '2',
      name: 'Weekly Newsletter',
      subject: 'Your Learning Progress This Week',
      recipients: 2103,
      sent: 0,
      opened: 0,
      clicked: 0,
      status: 'scheduled',
      scheduledDate: '2024-02-05',
    },
    {
      id: '3',
      name: 'Certificate Reminder',
      subject: 'Complete Your Course to Earn Certificate',
      recipients: 432,
      sent: 0,
      opened: 0,
      clicked: 0,
      status: 'draft',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Email Campaigns</h1>
          <p className="text-white">Manage your email marketing</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Campaigns</h2>
          <Button>Create Campaign</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Total Sent</h3>
            <p className="text-3xl font-bold text-brand-orange-600">
              {campaigns.reduce((sum, c) => sum + c.sent, 0).toLocaleString('en-US')}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Open Rate</h3>
            <p className="text-3xl font-bold text-brand-orange-500">
              {Math.round((campaigns.reduce((sum, c) => sum + c.opened, 0) / campaigns.reduce((sum, c) => sum + c.sent, 0)) * 100) || 0}%
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm text-black mb-2">Click Rate</h3>
            <p className="text-3xl font-bold text-brand-green-600">
              {Math.round((campaigns.reduce((sum, c) => sum + c.clicked, 0) / campaigns.reduce((sum, c) => sum + c.sent, 0)) * 100) || 0}%
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{campaign.name}</h3>
                    <span className={`px-3 py-2 rounded text-xs font-medium ${
                      campaign.status === 'sent' ? 'bg-brand-green-100 text-brand-green-700' :
                      campaign.status === 'scheduled' ? 'bg-brand-blue-100 text-brand-blue-700' :
                      'bg-gray-100 text-black'
                    }`}>
                      {campaign.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-black">{campaign.subject}</p>
                  {campaign.scheduledDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      Scheduled for: {campaign.scheduledDate}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {campaign.status === 'draft' && (
                    <>
                      <Button size="sm">Edit</Button>
                      <Button size="sm" variant="secondary">Send</Button>
                    </>
                  )}
                  {campaign.status === 'sent' && (
                    <Button size="sm" variant="secondary">View Report</Button>
                  )}
                </div>
              </div>

              {campaign.status === 'sent' && (
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-black">Recipients</p>
                    <p className="font-bold">{campaign.recipients.toLocaleString('en-US')}</p>
                  </div>
                  <div>
                    <p className="text-black">Sent</p>
                    <p className="font-bold">{campaign.sent.toLocaleString('en-US')}</p>
                  </div>
                  <div>
                    <p className="text-black">Opened</p>
                    <p className="font-bold text-brand-orange-600">
                      {campaign.opened.toLocaleString('en-US')} ({Math.round((campaign.opened / campaign.sent) * 100)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-black">Clicked</p>
                    <p className="font-bold text-brand-green-600">
                      {campaign.clicked.toLocaleString('en-US')} ({Math.round((campaign.clicked / campaign.sent) * 100)}%)
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
