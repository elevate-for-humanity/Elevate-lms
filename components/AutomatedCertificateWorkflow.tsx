"use client";

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CertificateTemplate {
  id: string;
  name: string;
  type: string;
  preview: string;
}

interface PendingCertificate {
  id: string;
  studentName: string;
  course: string;
  completionDate: string;
  status: 'pending' | 'generated' | 'sent';
}

export function AutomatedCertificateWorkflow() {
  const [selectedTemplate, setSelectedTemplate] = useState('1');

  const templates: CertificateTemplate[] = [
    { id: '1', name: 'Professional Certificate', type: 'Course Completion', preview: '📜' },
    { id: '2', name: 'Achievement Badge', type: 'Skill Mastery', preview: '🏆' },
    { id: '3', name: 'Diploma', type: 'Program Completion', preview: '🎓' },
  ];

  const pending: PendingCertificate[] = [
    {
      id: '1',
      studentName: 'Jordan Martinez',
      course: 'Full-Stack Web Development',
      completionDate: '2024-02-01',
      status: 'pending',
    },
    {
      id: '2',
      studentName: 'Taylor Anderson',
      course: 'JavaScript Advanced',
      completionDate: '2024-02-02',
      status: 'pending',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Certificate Generation</h1>
          <p className="text-brand-red-100">Automated workflow for issuing certificates</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Pending Certificates</h2>
              <div className="space-y-3">
                {pending.map((cert) => (
                  <div key={cert.id} className="p-4 bg-gray-50 rounded flex justify-between items-center">
                    <div>
                      <p className="font-bold">{cert.studentName}</p>
                      <p className="text-sm text-black">{cert.course}</p>
                      <p className="text-xs text-gray-500">Completed: {cert.completionDate}</p>
                    </div>
                    <Button size="sm">Generate</Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Automation Rules</h2>
              <div className="space-y-3">
                <div className="p-4 bg-brand-green-50 rounded">
                  <p className="font-semibold text-brand-green-900">• Au on course completion</p>
                  <p className="text-sm text-brand-green-700">Certificates created automatically when students finish</p>
                </div>
                <div className="p-4 bg-brand-blue-50 rounded">
                  <p className="font-semibold text-brand-blue-900">• Email delivery enabled</p>
                  <p className="text-sm text-brand-blue-700">Certificates sent via email with verification link</p>
                </div>
                <div className="p-4 bg-purple-50 rounded">
                  <p className="font-semibold text-purple-900">• Blockchain verification</p>
                  <p className="text-sm text-purple-700">All certificates recorded on blockchain</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Templates</h3>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded cursor-pointer ${
                      selectedTemplate === template.id ? 'bg-brand-red-100 border-2 border-brand-red-600' : 'bg-gray-50'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{template.preview}</span>
                      <div>
                        <p className="font-semibold text-sm">{template.name}</p>
                        <p className="text-xs text-black">{template.type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-black">Generated Today:</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">This Month:</span>
                  <span className="font-semibold">456</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Pending:</span>
                  <span className="font-semibold text-yellow-600">{pending.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
