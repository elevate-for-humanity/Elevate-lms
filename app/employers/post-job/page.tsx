'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { createBrowserClient } from '@supabase/ssr';
function Button({ children, variant, onClick, type, className }: { children: React.ReactNode; variant?: string; onClick?: () => void; type?: 'button' | 'submit'; className?: string }) {
  const baseClass = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variantClass = variant === 'outline' ? 'border border-gray-300 hover:bg-gray-50' : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700';
  return (
    <button type={type || 'button'} onClick={onClick} className={`${baseClass} ${variantClass} ${className || ''}`}>
      {children}
    </button>
  );
}



export default function PostJobPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('employers').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    location: '',
    jobType: 'full-time',
    salary: '',
    description: '',
    requirements: '',
    contactEmail: '',
    contactPhone: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <Image
                src="/images/programs/cpr-certification-group-hd.jpg"
                alt="Success"
                fill
                className="object-cover rounded-full"
              />
            </div>
            <h1 className="text-3xl font-bold mb-4">Job Posted Successfully!</h1>
            <p className="text-black mb-6">
              Your job posting has been submitted and will be reviewed by our team.
              You'll receive a confirmation email shortly.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/employers">
                <Button variant="outline">Back to Employers</Button>
              </Link>
              <Button onClick={() => setSubmitted(false)}>
                Post Another Job
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Employers", href: "/employers" }, { label: "Post Job" }]} />
      </div>
<div className="container mx-auto px-4 max-w-4xl">
        <Link href="/employers" className="inline-flex items-center text-brand-orange-600 hover:underline mb-6">
          ← Back to Employers
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-2">Post a Job Opening</h1>
          <p className="text-black mb-8">
            Connect with qualified, certified candidates from our talent pool.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Type *
                </label>
                <select
                  required
                  value={formData.jobType}
                  onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                >
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option>
                  <option value="apprenticeship">Apprenticeship</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Salary Range
                </label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                  placeholder="$40,000 - $60,000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Job Description *
              </label>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                placeholder="Describe the role, responsibilities, and what makes this opportunity great..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Requirements *
              </label>
              <textarea
                required
                rows={4}
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                placeholder="List required skills, certifications, experience..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="px-6 py-3">
                Post Job
              </Button>
              <Link href="/employers">
                <Button type="button" variant="outline" className="px-6 py-3">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
