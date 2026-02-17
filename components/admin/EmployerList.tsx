'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Building2, MapPin, Mail, Phone, Loader2 } from 'lucide-react';

interface Employer {
  id: string;
  name: string;
  industry?: string;
  location?: string;
  city?: string;
  state?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  status?: string;
  notes?: string;
  created_at?: string;
}

export function EmployerList() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('employers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setEmployers(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!employers.length) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No employers added yet.</p>
        <Link
          href="/admin/employers/onboarding"
          className="inline-block mt-4 text-sm text-brand-blue-600 hover:text-brand-blue-800 font-medium"
        >
          + Add Employer
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border divide-y">
      {employers.map((emp) => (
        <div key={emp.id} className="p-4 hover:bg-gray-50 transition">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-brand-blue-600 font-bold">
                  {(emp.name || 'E')[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{emp.name}</p>
                {emp.industry && (
                  <p className="text-sm text-gray-500">{emp.industry}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  {(emp.city || emp.state || emp.location) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {emp.city && emp.state
                        ? `${emp.city}, ${emp.state}`
                        : emp.location || ''}
                    </span>
                  )}
                  {emp.contact_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {emp.contact_email}
                    </span>
                  )}
                  {emp.contact_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {emp.contact_phone}
                    </span>
                  )}
                </div>
                {emp.status && (
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                    emp.status === 'active'
                      ? 'bg-brand-green-100 text-brand-green-700'
                      : emp.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {emp.status}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/admin/employers/${emp.id}`}
              className="text-sm text-brand-blue-600 hover:text-brand-blue-800 font-medium flex-shrink-0"
            >
              View Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
