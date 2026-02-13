
'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

export default function PartnerAttendancePage() {
  const supabase = createClient();
  const [shopId, setShopId] = useState<string>('');
  const [weekStart, setWeekStart] = useState<string>(startOfWeek(new Date()));
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data: staff } = await supabase
        .from('shop_staff')
        .select('shop_id, role, shops:shops(id,name,active)')
        .eq('is_active', true);

      const first = staff?.[0]?.shop_id ?? '';
      setShopId(first);
    })();
  }, [supabase]);

  async function loadPlacements() {
    setMsg(null);
    if (!shopId || !supabase) return;

    const { data: placements, error } = await supabase
      .from('apprentice_placements')
      .select('student_id, program_slug')
      .eq('shop_id', shopId);

    if (error) {
      setMsg(error.message);
      return;
    }

    setRows(
      (placements ?? []).map((p) => ({
        student_id: p.student_id,
        program_slug: p.program_slug,
        mon_hours: 0,
        tue_hours: 0,
        wed_hours: 0,
        thu_hours: 0,
        fri_hours: 0,
        sat_hours: 0,
        sun_hours: 0,
        notes: '',
      }))
    );
  }

  async function save() {
    setMsg(null);
    if (!shopId) return;

    const payload = rows.map((r) => ({
      shop_id: shopId,
      student_id: r.student_id,
      program_slug: r.program_slug,
      week_start: weekStart,
      mon_hours: r.mon_hours,
      tue_hours: r.tue_hours,
      wed_hours: r.wed_hours,
      thu_hours: r.thu_hours,
      fri_hours: r.fri_hours,
      sat_hours: r.sat_hours,
      sun_hours: r.sun_hours,
      notes: r.notes,
      submitted: false,
    }));

    if (!supabase) {
      setMsg('Service unavailable');
      return;
    }
    const { error } = await supabase
      .from('partner_attendance')
      .upsert(payload, {
        onConflict: 'shop_id,student_id,program_slug,week_start',
      });

    if (error) setMsg(error.message);
    else setMsg('Saved.');
  }

  const totalHours = useMemo(() => {
    return rows.reduce((sum, r) => {
      const t =
        Number(r.mon_hours || 0) +
        Number(r.tue_hours || 0) +
        Number(r.wed_hours || 0) +
        Number(r.thu_hours || 0) +
        Number(r.fri_hours || 0) +
        Number(r.sat_hours || 0) +
        Number(r.sun_hours || 0);
      return sum + t;
    }, 0);
  }, [rows]);

  return (
    <div className="rounded-2xl border p-5 space-y-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Attendance" }]} />
      </div>
<div>
        <div className="font-semibold">Attendance</div>
        <div className="text-sm text-black">Weekly hours per student.</div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs text-black mb-1">Shop ID</div>
          <input
            className="border rounded-xl p-2 w-[360px]"
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
          />
        </div>
        <div>
          <div className="text-xs text-black mb-1">Week Start (Mon)</div>
          <input
            type="date"
            className="border rounded-xl p-2"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
          />
        </div>
        <button
          className="border rounded-xl px-4 py-2"
          onClick={loadPlacements}
        >
          Load Students
        </button>
        <button
          className="border rounded-xl px-4 py-2 bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-colors"
          onClick={save}
        >
          Save
        </button>
        <div className="text-sm text-black">Total hours: {totalHours}</div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Student</th>
              <th className="py-2">Program</th>
              <th className="py-2">Mon</th>
              <th className="py-2">Tue</th>
              <th className="py-2">Wed</th>
              <th className="py-2">Thu</th>
              <th className="py-2">Fri</th>
              <th className="py-2">Sat</th>
              <th className="py-2">Sun</th>
              <th className="py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={`${r.student_id}-${r.program_slug}-${idx}`}
                className="border-b"
              >
                <td className="py-2">{r.student_id}</td>
                <td className="py-2">{r.program_slug}</td>
                {(
                  [
                    'mon_hours',
                    'tue_hours',
                    'wed_hours',
                    'thu_hours',
                    'fri_hours',
                    'sat_hours',
                    'sun_hours',
                  ] as const
                ).map((k) => (
                  <td key={k} className="py-2">
                    <input
                      className="border rounded-lg p-1 w-20"
                      type="number"
                      step="0.25"
                      value={r[k]}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) => {
                          const copy = [...prev];
                          copy[idx] = { ...copy[idx], [k]: v };
                          return copy;
                        });
                      }}
                    />
                  </td>
                ))}
                <td className="py-2">
                  <input
                    className="border rounded-lg p-1 w-[240px]"
                    value={r.notes}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRows((prev) => {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], notes: v };
                        return copy;
                      });
                    }}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-3 text-black" colSpan={11}>
                  Load students to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {msg && <div className="text-sm">{msg}</div>}
    </div>
  );
}
