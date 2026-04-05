'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';



export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    from_name: 'Elevate for Humanity',
    from_email: 'info@elevateforhumanity.org',
    html_content: '',
    target_audience: 'all_students', // all_students, active_students, inactive_students, program_holders, instructors
  });

  // Load templates
  useEffect(() => {
    fetch('/api/crm/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []));
  }, []);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData((prev) => ({
      ...prev,
      subject: template.subject,
      html_content: template.html_content,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/crm/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Campaign sent to ${data.sent_count} recipients!`);
        router.push('/admin/crm/campaigns');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) { /* Error handled silently */ 
      alert('Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8">

      {/* Hero Image */}
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "New" }]} />
      </div>
<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">
            Create Email Campaign
          </h1>
          <p className="text-black mt-2">
            Send bulk emails to your contacts
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Templates Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-black mb-4">
                Templates
              </h2>
              <div className="space-y-2">
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
          </div>

          {/* Campaign Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow-sm p-6 space-y-6"
            >
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
                  placeholder="e.g., Weekly Check-in - March 2025"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Send To *
                </label>
                <select
                  value={formData.target_audience}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_audience: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
                >
                  <option value="all_students">All Students</option>
                  <option value="active_students">
                    Active Students (logged in last 7 days)
                  </option>
                  <option value="inactive_students">
                    Inactive Students (not logged in 7+ days)
                  </option>
                  <option value="program_holders">Program Owners</option>
                  <option value="instructors">Instructors</option>
                  <option value="employers">Employers</option>
                  <option value="staff">Staff Members</option>
                </select>
              </div>

              {/* Subject Line */}
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
                  placeholder="e.g., Your Weekly Progress Update"
                />
              </div>

              {/* From Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={formData.from_name}
                    onChange={(e) =>
                      setFormData({ ...formData, from_name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={formData.from_email}
                    onChange={(e) =>
                      setFormData({ ...formData, from_email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email Content */}
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
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent font-mono text-sm"
                  placeholder="Paste HTML content or select a template..."
                />
                <p className="text-xs text-black mt-2">
                  Use variables: {'{'}
                  {'{'} student_name {'}'}
                  {'}'}, {'{'}
                  {'{'} course_name {'}'}
                  {'}'}, {'{'}
                  {'{'} dashboard_link {'}'}
                  {'}'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
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
                      Send Campaign
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border-2 border-gray-300 text-black font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
