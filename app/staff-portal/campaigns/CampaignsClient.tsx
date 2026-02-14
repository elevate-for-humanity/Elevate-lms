'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Send, Users, Loader2 } from 'lucide-react';

interface Template {
  id: string;
  subject: string;
  html_content: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface CampaignsClientProps {
  initialTemplates: Template[];
  initialStudents: Student[];
}

export default function CampaignsClient({ 
  initialTemplates, 
  initialStudents 
}: CampaignsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    subject: '',
    html_content: '',
  });

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      subject: template.subject,
      html_content: template.html_content,
    });
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSend = async () => {
    if (!formData.subject || !formData.html_content || selectedStudents.length === 0) {
      alert('Please fill all fields and select at least one student');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/crm/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recipients: selectedStudents,
        }),
      });

      if (res.ok) {
        alert('Campaign sent successfully!');
        router.refresh();
      } else {
        alert('Failed to send campaign');
      }
    } catch (error) {
      alert('Error sending campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Email Campaigns</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Templates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Templates
          </h2>
          <div className="space-y-2">
            {initialTemplates.map((template: any) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`w-full text-left p-3 rounded border ${
                  selectedTemplate?.id === template.id
                    ? 'border-brand-blue-500 bg-brand-blue-50'
                    : 'border-gray-200 hover:border-brand-blue-300'
                }`}
              >
                <div className="font-medium">{template.subject}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Students */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            My Students ({selectedStudents.length} selected)
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {initialStudents.map((student: any) => (
              <label
                key={student.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-black">{student.email}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Email Editor */}
      {selectedTemplate && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Customize Email</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={formData.html_content}
                onChange={(e) =>
                  setFormData({ ...formData, html_content: e.target.value })
                }
                rows={10}
                className="w-full px-3 py-2 border rounded font-mono text-sm"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-6 py-3 bg-brand-blue-600 text-white rounded hover:bg-brand-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Campaign
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
