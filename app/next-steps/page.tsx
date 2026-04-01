'use client';

import Link from 'next/link';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle,
  Phone
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type Checklist = any;

function formatPct(p?: number) {
  if (typeof p !== 'number') return '0%';
  return `${p}%`;
}

export default function NextStepsPage() {
  const [data, setData] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const progress = useMemo(
    () => data?.progress || { percent: 0, done: 0, total: 9 },
    [data]
  );

  async function load() {
    setLoading(true);
    const res = await fetch('/api/next-steps', { cache: 'no-store' });
    if (!res.ok) {
      setLoading(false);
      setData(null);
      return;
    }
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  async function patch(update: Record<string, any>) {
    setSaving(true);
    const res = await fetch('/api/next-steps', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const json = await res.json();
    setData(json);
    setSaving(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        Loading your checklist…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">Your Next Steps Checklist</h1>
        <p className="mt-2 text-sm text-black leading-relaxed">
          Please log in to view and update your checklist.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Next Steps' }]} />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Your Next Steps Checklist</h1>
      <p className="mt-2 text-sm text-black leading-relaxed">
        Complete each step so we can move you into the correct funding and
        enrollment pathway.
      </p>

      <div className="mt-6 rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Progress</p>
            <p className="text-sm text-black">
              {progress.done}/{progress.total} complete
            </p>
          </div>
          <div className="text-sm font-semibold">
            {formatPct(progress.percent)}
          </div>
        </div>

        <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-white"
            style={{ width: `${progress.percent || 0}%` }}
          />
        </div>

        {saving && <p className="mt-3 text-xs text-black">Saving…</p>}
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm font-semibold">Program Information</p>
          <p className="mt-1 text-sm text-black leading-relaxed">
            Tell us which program you're applying for so we know exactly what
            you need.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-black">
                Program Code
              </label>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                value={data.program_code ?? ''}
                onChange={(e) => patch({ program_code: e.target.value })}
              >
                <option value="">Select program</option>
                <option value="barber-apprenticeship">
                  Barber Apprenticeship
                </option>
                <option value="esthetician-apprenticeship">
                  Esthetician Apprenticeship
                </option>
                <option value="nail-technician-apprenticeship">
                  Nail Technician Apprenticeship
                </option>
                <option value="hvac-technician">HVAC Technician</option>
                <option value="cna">CNA - Certified Nursing Assistant</option>
                <option value="qma">QMA - Qualified Medication Aide</option>
                <option value="cdl">CDL - Commercial Driver's License</option>
                <option value="welding">Welding Technology</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-black">
                Program Name (if Other)
              </label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                value={data.program_name_other ?? ''}
                onChange={(e) => patch({ program_name_other: e.target.value })}
                placeholder="Enter program name"
              />
            </div>
          </div>
        </div>

        <ChecklistRow
          checked={!!data.inquiry_submitted}
          title="Step 1: Submit your Elevate for Humanity Inquiry"
          note="This tells us your goal and program interest."
          onChange={(v) =>
            patch({
              inquiry_submitted: v,
              inquiry_submitted_at: v ? new Date().toISOString() : null,
            })
          }
        />

        <div className="rounded-2xl border bg-white p-5">
          <ChecklistRow
            checked={!!data.icc_account_created}
            title="Step 2: Create or log into Indiana Career Connect"
            note="Go to indianacareerconnect.com and create/login to your account."
            onChange={(v) => patch({ icc_account_created: v })}
          />
          <div className="mt-3">
            <label className="text-xs font-semibold text-black">
              Optional: ICC Username
            </label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={data.icc_username ?? ''}
              onChange={(e) => patch({ icc_username: e.target.value })}
              placeholder="Your ICC username (optional)"
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm font-semibold">
            Step 3: Track your WorkOne appointments
          </p>
          <p className="mt-1 text-sm text-black leading-relaxed">
            WorkOne will schedule 3-4 appointments. After EACH appointment, come
            back here and document what happened. We get notified when you
            update this.
          </p>
          <div className="mt-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-xs font-semibold text-yellow-900">
              <AlertTriangle className="w-5 h-5 inline-block" /> IMPORTANT:
              Report back after EVERY appointment
            </p>
            <p className="mt-1 text-xs text-yellow-800 leading-relaxed">
              Don't wait until all appointments are done. Update this checklist
              immediately after each appointment so we can track your progress
              and help if something gets stuck.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border"
                  checked={!!data.workone_appointment_1_completed}
                  onChange={(e) =>
                    patch({ workone_appointment_1_completed: e.target.checked })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Appointment #1</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Date
                      </label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_1_date ?? ''}
                        onChange={(e) =>
                          patch({ workone_appointment_1_date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Time
                      </label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_1_time ?? ''}
                        onChange={(e) =>
                          patch({ workone_appointment_1_time: e.target.value })
                        }
                        placeholder="e.g., 10:30 AM"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Location
                      </label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_1_location ?? ''}
                        onChange={(e) =>
                          patch({
                            workone_appointment_1_location: e.target.value,
                          })
                        }
                        placeholder="City / office"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-black">
                      What happened in this appointment?
                    </label>
                    <textarea
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                      value={data.workone_appointment_1_notes ?? ''}
                      onChange={(e) =>
                        patch({ workone_appointment_1_notes: e.target.value })
                      }
                      placeholder="Example: Orientation meeting, filled out intake forms, scheduled next appointment for assessment"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border"
                  checked={!!data.workone_appointment_2_completed}
                  onChange={(e) =>
                    patch({ workone_appointment_2_completed: e.target.checked })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Appointment #2</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Date
                      </label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_2_date ?? ''}
                        onChange={(e) =>
                          patch({ workone_appointment_2_date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Time
                      </label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_2_time ?? ''}
                        onChange={(e) =>
                          patch({ workone_appointment_2_time: e.target.value })
                        }
                        placeholder="e.g., 10:30 AM"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Location
                      </label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_2_location ?? ''}
                        onChange={(e) =>
                          patch({
                            workone_appointment_2_location: e.target.value,
                          })
                        }
                        placeholder="City / office"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-black">
                      What happened in this appointment?
                    </label>
                    <textarea
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                      value={data.workone_appointment_2_notes ?? ''}
                      onChange={(e) =>
                        patch({ workone_appointment_2_notes: e.target.value })
                      }
                      placeholder="Example: Completed TABE assessment, discussed funding options, advisor said I qualify for WIOA"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border"
                  checked={!!data.workone_appointment_3_completed}
                  onChange={(e) =>
                    patch({ workone_appointment_3_completed: e.target.checked })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Appointment #3</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Date
                      </label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_3_date ?? ''}
                        onChange={(e) =>
                          patch({ workone_appointment_3_date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Time
                      </label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_3_time ?? ''}
                        onChange={(e) =>
                          patch({ workone_appointment_3_time: e.target.value })
                        }
                        placeholder="e.g., 10:30 AM"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Location
                      </label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_3_location ?? ''}
                        onChange={(e) =>
                          patch({
                            workone_appointment_3_location: e.target.value,
                          })
                        }
                        placeholder="City / office"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-black">
                      What happened in this appointment?
                    </label>
                    <textarea
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                      value={data.workone_appointment_3_notes ?? ''}
                      onChange={(e) =>
                        patch({ workone_appointment_3_notes: e.target.value })
                      }
                      placeholder="Example: Met with career advisor, submitted documents, approved for WRG funding"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border"
                  checked={!!data.workone_appointment_4_completed}
                  onChange={(e) =>
                    patch({ workone_appointment_4_completed: e.target.checked })
                  }
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Appointment #4</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Date
                      </label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_4_date ?? ''}
                        onChange={(e) =>
                          patch({ workone_appointment_4_date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Time
                      </label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_4_time ?? ''}
                        onChange={(e) =>
                          patch({ workone_appointment_4_time: e.target.value })
                        }
                        placeholder="e.g., 10:30 AM"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-black">
                        Location
                      </label>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                        value={data.workone_appointment_4_location ?? ''}
                        onChange={(e) =>
                          patch({
                            workone_appointment_4_location: e.target.value,
                          })
                        }
                        placeholder="City / office"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-black">
                      What happened in this appointment?
                    </label>
                    <textarea
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                      value={data.workone_appointment_4_notes ?? ''}
                      onChange={(e) =>
                        patch({ workone_appointment_4_notes: e.target.value })
                      }
                      placeholder="Example: Final paperwork signed, received approval letter, ready to start program"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ChecklistRow
          checked={!!data.told_advisor_efh}
          title='Step 4: Tell the advisor: "I&apos;m here for Elevate for Humanity."'
          note="This connects your appointment to the right training pathway."
          onChange={(v) => patch({ told_advisor_efh: v })}
        />

        <div className="rounded-2xl border bg-white p-5">
          <ChecklistRow
            checked={!!data.advisor_docs_uploaded}
            title="Step 5: Upload or confirm documents requested by your advisor"
            note="If they asked for anything, mark this once you've submitted it."
            onChange={(v) => patch({ advisor_docs_uploaded: v })}
          />
          <div className="mt-3">
            <label className="text-xs font-semibold text-black">
              Optional notes
            </label>
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={data.advisor_docs_note ?? ''}
              onChange={(e) => patch({ advisor_docs_note: e.target.value })}
              placeholder="What documents did they request?"
              rows={3}
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm font-semibold">
            Step 6: Funding determination received
          </p>
          <p className="mt-1 text-sm text-black leading-relaxed">
            Select what your advisor decided so we know your pathway.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-black">
                Funding status
              </label>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                value={data.funding_status ?? 'pending'}
                onChange={(e) => patch({ funding_status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-black">
                Funding type
              </label>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                value={data.funding_type ?? ''}
                onChange={(e) =>
                  patch({ funding_type: e.target.value || null })
                }
              >
                <option value="">Select</option>
                <option value="WIOA">WIOA</option>
                <option value="WRG">WRG</option>
                <option value="Job Ready Indy">Job Ready Indy</option>
                <option value="Apprenticeship">Apprenticeship</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <ChecklistRow
            checked={!!data.efh_onboarding_call_completed}
            title="Step 7: Complete your EFH onboarding call"
            note="This is where we confirm your pathway, timeline, and start steps."
            onChange={(v) => patch({ efh_onboarding_call_completed: v })}
          />
          <div className="mt-3">
            <label className="text-xs font-semibold text-black">
              Onboarding call date
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={data.efh_onboarding_call_date ?? ''}
              onChange={(e) =>
                patch({ efh_onboarding_call_date: e.target.value })
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <ChecklistRow
            checked={!!data.program_start_confirmed}
            title="Step 8: Program start date confirmed"
            note="Once this is checked, you are officially ready for your start timeline."
            onChange={(v) => patch({ program_start_confirmed: v })}
          />
          <div className="mt-3">
            <label className="text-xs font-semibold text-black">
              Program start date
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              value={data.program_start_date ?? ''}
              onChange={(e) => patch({ program_start_date: e.target.value })}
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-gray-50 p-5">
          <p className="text-sm font-semibold">What happens next</p>
          <p className="mt-1 text-sm text-black leading-relaxed">
            Once your checklist is complete, our team can move faster and ensure
            nothing falls through the cracks.
          </p>
        </div>
      </div>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

function ChecklistRow({
  checked,
  title,
  note,
  onChange,
}: {
  checked: boolean;
  title: string;
  note: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 rounded border"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm text-black leading-relaxed">{note}</p>
        </div>
      </label>
    </div>
  );
}
