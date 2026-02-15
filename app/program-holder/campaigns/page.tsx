'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';



export default function ProgramOwnerCampaignsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [myStudents, setMyStudents] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    subject: '',
    html_content: '',
  });

  // Load data
  useEffect(() => {
    // Load templates
    fetch('/api/crm/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []));

    // Load my program students
    fetch('/api/program-owner/my-students')
      .then((res) => res.json())
      .then((data) => setMyStudents(data.students || []));
  }, []);

  const handleTemplateSelect = (template) => {
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

  const selectAll = () => {
    setSelectedStudents(myStudents.map((s) => s.id));
  };

  const deselectAll = () => {
    setSelectedStudents([]);
  };

  const handleSend = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/program-owner/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          student_ids: selectedStudents,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Email sent to ${data.sent_count} students!`);
        setSelectedStudents([]);
        setFormData({ subject: '', html_content: '' });
        setSelectedTemplate(null);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) { /* Error handled silently */ 
      alert('Failed to send emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Breadcrumbs
        items={[
          { label: 'Program Holder', href: '/program-holder/dashboard' },
          { label: 'Campaigns' },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">
            Email My Students
          </h1>
          <p className="text-black mt-2">
            Send emails to students in your programs
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Templates */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-black mb-4">
                Templates
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-brand-blue-600 bg-brand-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-black text-sm">
                      {template.name}
                    </p>
                    <p className="text-xs text-black mt-1 capitalize">
                      {template.category.replace('_', ' ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* My Students */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-black">
                  My Students ({myStudents.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                  >
                    All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="text-xs text-black hover:text-black font-semibold"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {myStudents.map((student: any) => (
                  <label
                    key={student.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="w-4 h-4 text-brand-blue-600 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-black text-sm truncate">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-black truncate">
                        {student.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-black">
                  Selected:{' '}
                  <span className="font-bold text-black">
                    {selectedStudents.length}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Email Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-black mb-6">
                Compose Email
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
                    placeholder="e.g., Program Update"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Email Content (HTML) *
                  </label>
                  <textarea
                    required
                    value={formData.html_content}
                    onChange={(e) =>
                      setFormData({ ...formData, html_content: e.target.value })
                    }
                    rows={16}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent font-mono text-sm"
                    placeholder="Select a template or write your own..."
                  />
                  <p className="text-xs text-black mt-2">
                    Variables: {'{{'}student_name{'}}'}, {'{{'}dashboard_link
                    {'}}'}, {'{{'}support_email{'}}'}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSend}
                    disabled={loading || selectedStudents.length === 0}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send to {selectedStudents.length} Student
                        {selectedStudents.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
