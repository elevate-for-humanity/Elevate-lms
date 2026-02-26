"use client";

import { useState, useEffect } from 'react';
import { Info, Building2, Users, DollarSign, FileCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SponsorshipInfo {
  sponsor_name: string;
  sponsor_logo?: string;
  curriculum_type: string;
  enrollment_manager: string;
  funding_source: string;
  compliance_notes: string;
  contact_email?: string;
  contact_phone?: string;
}

interface Props {
  programId?: string;
  partnerId?: string;
  variant?: 'full' | 'compact' | 'tooltip';
}

export function SponsorshipInfoPanel({ programId, partnerId, variant = 'full' }: Props) {
  const [info, setInfo] = useState<SponsorshipInfo>({
    sponsor_name: '2Exclusive LLC-S (DBA Elevate for Humanity Career & Technical Institute)',
    curriculum_type: 'Partner-provided + required online components',
    enrollment_manager: 'Managed by EFH',
    funding_source: 'Coordinated through WorkOne',
    compliance_notes: 'All programs operate under 2Exclusive LLC-S sponsorship.',
  });
  const [loading, setLoading] = useState(!!programId || !!partnerId);

  useEffect(() => {
    if (!programId && !partnerId) {
      setLoading(false);
      return;
    }

    async function fetchSponsorshipInfo() {
      const supabase = createClient();

      try {
        let query = supabase
          .from('program_sponsorships')
          .select(`
            sponsor_name,
            sponsor_logo,
            curriculum_type,
            enrollment_manager,
            funding_source,
            compliance_notes,
            contact_email,
            contact_phone
          `);

        if (programId) {
          query = query.eq('program_id', programId);
        } else if (partnerId) {
          query = query.eq('partner_id', partnerId);
        }

        const { data, error } = await query.single();

        if (!error && data) {
          setInfo(data);
        }
      } catch (err) {
        console.error('Error fetching sponsorship info:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSponsorshipInfo();
  }, [programId, partnerId]);

  if (loading) {
    return (
      <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-brand-blue-800">
          <Info className="w-4 h-4 text-brand-blue-600" />
          <span>Sponsored by <strong>{info.sponsor_name}</strong></span>
        </div>
      </div>
    );
  }

  if (variant === 'tooltip') {
    return <SponsorshipTooltip info={info} />;
  }

  return (
    <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-brand-blue-900 mb-3">
            Program Sponsorship
          </h3>
          <div className="space-y-3 text-sm text-brand-blue-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-brand-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-brand-blue-900">Sponsor</div>
                  <div>{info.sponsor_name}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-brand-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-brand-blue-900">Curriculum</div>
                  <div>{info.curriculum_type}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-brand-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-brand-blue-900">Enrollment</div>
                  <div>{info.enrollment_manager}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-brand-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-brand-blue-900">Funding</div>
                  <div>{info.funding_source}</div>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-brand-blue-200">
              <p className="text-xs text-brand-blue-700">
                {info.compliance_notes}
              </p>
            </div>
            {(info.contact_email || info.contact_phone) && (
              <div className="pt-3 border-t border-brand-blue-200 flex gap-4 text-xs">
                {info.contact_email && (
                  <a href={`mailto:${info.contact_email}`} className="text-brand-blue-600 hover:underline">
                    {info.contact_email}
                  </a>
                )}
                {info.contact_phone && (
                  <a href={`tel:${info.contact_phone}`} className="text-brand-blue-600 hover:underline">
                    {info.contact_phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SponsorshipTooltip({ info }: { info?: SponsorshipInfo }) {
  const sponsorName = info?.sponsor_name || '2Exclusive LLC-S (DBA Elevate for Humanity Career & Technical Institute)';
  
  return (
    <div className="max-w-sm">
      <div className="text-sm space-y-2">
        <p className="font-semibold">What does "Sponsored by {sponsorName}" mean?</p>
        <p>
          {sponsorName} is the official Program Sponsor responsible for:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Workforce system alignment (WIOA, WRG, JRI)</li>
          <li>Enrollment processing and eligibility</li>
          <li>Compliance and reporting</li>
          <li>Payment coordination</li>
        </ul>
        <p className="text-xs text-gray-600 pt-2 border-t">
          Partners retain their program name and curriculum. {sponsorName} handles the funding
          and compliance.
        </p>
      </div>
    </div>
  );
}

export default SponsorshipInfoPanel;
