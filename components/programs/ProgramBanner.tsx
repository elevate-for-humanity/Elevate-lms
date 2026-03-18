"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import Link from 'next/link';
import { useState } from 'react';

export function ProgramBanner() {
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  // Log banner view for analytics
  useEffect(() => {
    async function logBannerView() {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('program_banner_views')
        .insert({
          user_id: user?.id,
          banner_type: 'workone_appointment',
          viewed_at: new Date().toISOString()
        });
    }
    logBannerView();
  }, [supabase]);

  // Log CTA clicks
  const logCtaClick = async (ctaType: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('cta_clicks')
      .insert({
        user_id: user?.id,
        cta_type: ctaType,
        source: 'program_banner',
        clicked_at: new Date().toISOString()
      });
  };

  return (
    <section className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-black">
            Appointment-Based Information (Required Step)
          </p>
          <p className="text-sm text-black mt-1">
            1) Submit the Inquiry Form. 2) Schedule a WorkOne appointment on
            IndianaCareerConnect.com. 3) Tell them you're there for Elevate for
            Humanity. 4) Complete your checklist so we can track your progress.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/apply"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:opacity-90"
          >
            Start Inquiry Form
          </Link>

          <a
            href="https://www.indianacareerconnect.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border border-slate-300 hover:bg-slate-50"
          >
            Book WorkOne Appointment
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border border-slate-300 hover:bg-slate-50"
          >
            {open ? 'Close Checklist' : 'Open My Checklist'}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mt-4">
          <WorkOneChecklist />
        </div>
      ) : null}
    </section>
  );
}

function WorkOneChecklist() {
  const key = 'efh_workone_checklist_v1';
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(key);
    return raw
      ? JSON.parse(raw)
      : {
          inquirySubmitted: false,
          iccAccountCreated: false,
          appointmentScheduled: false,
          appointmentDate: '',
          toldAdvisorEFH: false,
          docsUploaded: false,
          callbackRequested: false,
        };
  });

  if (!state) return null;

  function save(data: any) {
    setState(next);
    localStorage.setItem(key, JSON.stringify(next));
  }

  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <p className="text-sm font-semibold text-black">
        My Progress Checklist
      </p>
      <p className="text-sm text-black mt-1">
        Check these off as you go. This helps us support you faster and keeps
        everything organized.
      </p>

      <div className="mt-4 grid gap-3">
        <CheckRow
          label="I submitted the Elevate for Humanity Inquiry Form"
          checked={state.inquirySubmitted}
          onChange={(v) => save({ ...state, inquirySubmitted: v })}
        />
        <CheckRow
          label="I created/logged into my IndianaCareerConnect account"
          checked={state.iccAccountCreated}
          onChange={(v) => save({ ...state, iccAccountCreated: v })}
        />
        <CheckRow
          label="I scheduled my WorkOne advisor appointment"
          checked={state.appointmentScheduled}
          onChange={(v) => save({ ...state, appointmentScheduled: v })}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm text-black">
            Appointment date (optional)
            <input
              value={state.appointmentDate || ''}
              onChange={(e) =>
                save({ ...state, appointmentDate: e.target.value })
              }
              placeholder="MM/DD/YYYY @ time"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </label>
          <CheckRow
            label="I told WorkOne I'm there for Elevate for Humanity"
            checked={state.toldAdvisorEFH}
            onChange={(v) => save({ ...state, toldAdvisorEFH: v })}
          />
        </div>

        <CheckRow
          label="I uploaded/collected required documents (ID, proof of address, etc.)"
          checked={state.docsUploaded}
          onChange={(v) => save({ ...state, docsUploaded: v })}
        />
        <CheckRow
          label="I called back / requested follow-up after scheduling my appointment"
          checked={state.callbackRequested}
          onChange={(v) => save({ ...state, callbackRequested: v })}
        />
      </div>

      <div className="mt-4 rounded-xl bg-white border p-3">
        <p className="text-sm font-semibold text-black">Next step</p>
        <p className="text-sm text-black mt-1">
          Once your appointment is scheduled, keep going through the checklist
          and watch for follow-up from our team.
        </p>
      </div>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-black">{label}</span>
    </label>
  );
}
