"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckSquare, Square } from 'lucide-react';

/**
 * Barber Enrollment Acknowledgment Component
 * 
 * REQUIRED checkbox acknowledgment for barber apprenticeship enrollment.
 * Must be checked before enrollment can proceed.
 */

interface BarberEnrollmentAcknowledgmentProps {
  onAcknowledge: (acknowledged: boolean) => void;
  acknowledged?: boolean;
  className?: string;
  userId?: string;
  programId?: string;
}

export function BarberEnrollmentAcknowledgment({ 
  onAcknowledge,
  acknowledged = false,
  className = '',
  userId,
  programId
}: BarberEnrollmentAcknowledgmentProps) {
  const [isChecked, setIsChecked] = useState(acknowledged);
  const supabase = createClient();

  // Load existing acknowledgment from DB
  useEffect(() => {
    async function loadAcknowledgment() {
      if (!userId) return;
      const { data } = await supabase
        .from('enrollment_acknowledgments')
        .select('id, acknowledged, acknowledged_at')
        .eq('user_id', userId)
        .eq('acknowledgment_type', 'barber_enrollment')
        .single();
      if (data?.acknowledged) {
        setIsChecked(true);
        onAcknowledge(true);
      }
    }
    loadAcknowledgment();
  }, [userId, supabase, onAcknowledge]);

  // Save acknowledgment to DB when checked
  const saveAcknowledgment = async () => {
    if (!userId) return;
    await supabase
      .from('enrollment_acknowledgments')
      .upsert({
        user_id: userId,
        program_id: programId,
        acknowledgment_type: 'barber_enrollment',
        acknowledged: true,
        acknowledged_at: new Date().toISOString()
      }, { onConflict: 'user_id,acknowledgment_type' });
  };

  const handleToggle = async () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onAcknowledge(newValue);
    if (newValue) {
      await saveAcknowledgment();
    }
  };

  return (
    <div className={`bg-amber-50 border-2 border-amber-300 rounded-lg p-6 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-900 mb-2">Required Acknowledgment</h3>
          <p className="text-sm text-amber-800">
            Please read and acknowledge the following before proceeding with enrollment:
          </p>
        </div>
      </div>

      <div className="bg-white border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-slate-700 leading-relaxed">
          <strong>Program Scope:</strong> This program provides apprenticeship sponsorship, oversight, and related instruction only. 
          It includes DOL Registered Apprenticeship sponsorship, compliance and RAPIDS reporting, employer coordination, 
          program monitoring, and Elevate LMS theory curriculum.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mt-3">
          <strong>What This Program Does NOT Provide:</strong> This program does not replace barber school, 
          does not provide practical hands-on barber skills training, and does not grant state licensure hours. 
          Enrollment requires concurrent or subsequent participation in a licensed barber school for state licensure eligibility.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mt-3">
          <strong>Program Fee:</strong> The program fee of $4,980 is a flat rate. Credit for prior learning (transferred hours) 
          may reduce the duration of participation but does not alter the program fee.
        </p>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
          isChecked 
            ? 'bg-brand-green-50 border-brand-green-500' 
            : 'bg-white border-slate-300 hover:border-amber-400'
        }`}
      >
        {isChecked ? (
          <CheckSquare className="w-6 h-6 text-brand-green-600 flex-shrink-0" />
        ) : (
          <Square className="w-6 h-6 text-slate-400 flex-shrink-0" />
        )}
        <span className={`text-left text-sm ${isChecked ? 'text-brand-green-800' : 'text-slate-700'}`}>
          <strong>I understand</strong> this program provides apprenticeship sponsorship, oversight, and related instruction only 
          and does not replace barber school or grant state licensure hours. I acknowledge that the program fee of $4,980 
          applies regardless of any transferred hours.
        </span>
      </button>

      {!isChecked && (
        <p className="text-xs text-amber-700 mt-3 text-center">
          You must acknowledge the above to proceed with enrollment.
        </p>
      )}
    </div>
  );
}

export default BarberEnrollmentAcknowledgment;
