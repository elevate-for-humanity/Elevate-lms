"use client";

import React, { useState, useEffect } from 'react';
import { Circle, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AcknowledgmentItem {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

interface SponsorshipAcknowledgmentProps {
  partnerId?: string;
  applicationId?: string;
  onComplete: (acknowledged: boolean) => void;
  required?: boolean;
  onSave?: (acknowledgments: Record<string, boolean>) => void;
}

const DEFAULT_ITEMS: AcknowledgmentItem[] = [
  {
    key: 'sponsor',
    label: 'I understand Elevate for Humanity is the Program Sponsor',
    description: 'EFH is responsible for program approval, workforce alignment, compliance, and reporting.',
    required: true,
  },
  {
    key: 'programName',
    label: 'I understand my program may retain its name but is sponsored by EFH',
    description: 'Your program name can be used for branding, but EFH is listed as the official sponsor on all documentation.',
    required: true,
  },
  {
    key: 'curriculum',
    label: 'I understand students must complete required online curriculum components',
    description: 'Students must complete EFH-designated online curriculum for compliance and credentialing, in addition to your instruction.',
    required: true,
  },
  {
    key: 'enrollment',
    label: 'I understand all funded enrollments flow through Elevate for Humanity',
    description: 'Partners do not independently enroll students into funded programs. All enrollments must be processed through EFH.',
    required: true,
  },
  {
    key: 'compliance',
    label: 'I agree to comply with onboarding, attendance, and reporting requirements',
    description: 'Partners must track and submit attendance/hours on schedule, notify EFH of issues, and cooperate with audits.',
    required: true,
  },
];

export function SponsorshipAcknowledgment({
  partnerId,
  applicationId,
  onComplete,
  required = true,
  onSave,
}: SponsorshipAcknowledgmentProps) {
  const [items, setItems] = useState<AcknowledgmentItem[]>(DEFAULT_ITEMS);
  const [acknowledgments, setAcknowledgments] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(!!partnerId || !!applicationId);
  const [saving, setSaving] = useState(false);

  // Initialize acknowledgments
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    items.forEach(item => {
      initial[item.key] = false;
    });
    setAcknowledgments(initial);
  }, [items]);

  // Fetch existing acknowledgments and custom items
  useEffect(() => {
    if (!partnerId && !applicationId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      const supabase = createClient();

      try {
        // Fetch custom acknowledgment items if any
        const { data: customItems } = await supabase
          .from('partner_acknowledgment_items')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (customItems && customItems.length > 0) {
          setItems(customItems.map(item => ({
            key: item.key,
            label: item.label,
            description: item.description,
            required: item.required,
          })));
        }

        // Fetch existing acknowledgments
        let query = supabase
          .from('partner_acknowledgments')
          .select('acknowledgment_key, acknowledged_at');

        if (partnerId) {
          query = query.eq('partner_id', partnerId);
        } else if (applicationId) {
          query = query.eq('application_id', applicationId);
        }

        const { data: existingAcks } = await query;

        if (existingAcks && existingAcks.length > 0) {
          const ackMap: Record<string, boolean> = {};
          existingAcks.forEach(ack => {
            ackMap[ack.acknowledgment_key] = !!ack.acknowledged_at;
          });
          setAcknowledgments(prev => ({ ...prev, ...ackMap }));
        }
      } catch (err) {
        console.error('Error fetching acknowledgments:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [partnerId, applicationId]);

  // Check if all required items are acknowledged
  const allRequiredAcknowledged = items
    .filter(item => item.required)
    .every(item => acknowledgments[item.key]);

  // Notify parent of completion status
  useEffect(() => {
    onComplete(allRequiredAcknowledged);
  }, [allRequiredAcknowledged, onComplete]);

  const handleToggle = async (key: string) => {
    const newValue = !acknowledgments[key];
    const newAcknowledgments = { ...acknowledgments, [key]: newValue };
    setAcknowledgments(newAcknowledgments);

    // Save to database if partnerId or applicationId provided
    if (partnerId || applicationId) {
      setSaving(true);
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (newValue) {
          // Insert acknowledgment
          await supabase.from('partner_acknowledgments').upsert({
            partner_id: partnerId,
            application_id: applicationId,
            acknowledgment_key: key,
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: user?.id,
          }, {
            onConflict: partnerId ? 'partner_id,acknowledgment_key' : 'application_id,acknowledgment_key',
          });
        } else {
          // Remove acknowledgment
          let deleteQuery = supabase
            .from('partner_acknowledgments')
            .delete()
            .eq('acknowledgment_key', key);

          if (partnerId) {
            deleteQuery = deleteQuery.eq('partner_id', partnerId);
          } else if (applicationId) {
            deleteQuery = deleteQuery.eq('application_id', applicationId);
          }

          await deleteQuery;
        }

        onSave?.(newAcknowledgments);
      } catch (err) {
        console.error('Error saving acknowledgment:', err);
        // Revert on error
        setAcknowledgments(acknowledgments);
      } finally {
        setSaving(false);
      }
    } else {
      onSave?.(newAcknowledgments);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Required Acknowledgments
        </h3>
        <p className="text-sm text-gray-600">
          Please read and acknowledge each statement below. All acknowledgments
          are required before program activation.
        </p>
      </div>

      {/* Acknowledgment Items */}
      <div className="space-y-4">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => handleToggle(item.key)}
            disabled={saving}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all disabled:opacity-50 ${
              acknowledgments[item.key]
                ? 'border-brand-green-500 bg-brand-green-50'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <div className="flex items-start gap-3">
              {acknowledgments[item.key] ? (
                <span className="text-slate-400 flex-shrink-0">•</span>
              ) : (
                <Circle className="w-6 h-6 text-slate-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className={`font-medium mb-1 flex items-center gap-2 ${
                  acknowledgments[item.key] ? 'text-brand-green-900' : 'text-gray-900'
                }`}>
                  {item.label}
                  {item.required && (
                    <span className="text-xs text-brand-red-500">*</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">{item.description}</div>
              </div>
              {saving && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Status Message */}
      {required && !allRequiredAcknowledged && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-amber-800">
            <strong>Action Required:</strong> You must acknowledge all
            required statements above before proceeding to digital signature.
          </div>
        </div>
      )}

      {allRequiredAcknowledged && (
        <div className="flex items-start gap-3 p-4 bg-brand-green-50 border border-brand-green-200 rounded-lg">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <div className="flex-1 text-sm text-brand-green-800">
            <strong>All acknowledgments complete.</strong> You may now proceed
            to digital signature.
          </div>
        </div>
      )}

      {/* Legal Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-gray-600">
          <strong>Legal Notice:</strong> These acknowledgments are legally
          binding. By checking each box and signing, you agree to operate under
          Elevate for Humanity sponsorship and comply with all requirements
          outlined in the partner agreement.
        </p>
      </div>
    </div>
  );
}

export default SponsorshipAcknowledgment;
