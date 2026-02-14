
'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PartnerWeeklyReportsPage() {
  const supabase = createClient();
  const [shopId, setShopId] = useState('');
  const [placementId, setPlacementId] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [hoursTotal, setHoursTotal] = useState<number>(0);
  const [hoursOjt, setHoursOjt] = useState<number>(0);
  const [hoursRelated, setHoursRelated] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [placements, setPlacements] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: staff } = await supabase
        .from('shop_staff')
        .select('shop_id');
      const id = staff?.[0]?.shop_id ?? '';
      setShopId(id);

      if (id) {
        const { data }: any = await supabase
          .from('apprentice_placements')
          .select('id, student_id, shop_id')
          .eq('shop_id', id);
        setPlacements(data ?? []);
      }
    })();
  }, []);

  async function submit() {
    setMsg(null);
    if (!placementId || !weekStart || !weekEnd) {
      setMsg('Pick a placement and week dates.');
      return;
    }

    const { data: user } = await supabase.auth.getUser();

    const { error } = await supabase.from('apprentice_weekly_reports').insert({
      placement_id: placementId,
      week_start: weekStart,
      week_end: weekEnd,
      hours_total: hoursTotal,
      hours_ojt: hoursOjt,
      hours_related: hoursRelated,
      attendance_notes: notes,
      submitted_by_user_id: user.user?.id ?? null,
    });

    if (error) setMsg(error.message);
    else setMsg('Submitted.');
  }

  return (
    <div className="rounded-2xl border p-5 space-y-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Weekly" }]} />
      </div>
<div>
        <div className="font-semibold">Weekly Reports</div>
        <div className="text-sm text-black">
          Submit weekly progress for apprentices/students.
        </div>
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
          <div className="text-xs text-black mb-1">Placement</div>
          <select
            className="border rounded-xl p-2 w-[360px]"
            value={placementId}
            onChange={(e) => setPlacementId(e.target.value)}
          >
            <option value="">Select...</option>
            {placements.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} • {p.student_id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-black mb-1">Week Start</div>
          <input
            type="date"
            className="border rounded-xl p-2 w-full"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
          />
        </div>
        <div>
          <div className="text-xs text-black mb-1">Week End</div>
          <input
            type="date"
            className="border rounded-xl p-2 w-full"
            value={weekEnd}
            onChange={(e) => setWeekEnd(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-black mb-1">Total Hours</div>
          <input
            className="border rounded-xl p-2 w-full"
            type="number"
            value={hoursTotal}
            onChange={(e) => setHoursTotal(Number(e.target.value))}
          />
        </div>
        <div>
          <div className="text-xs text-black mb-1">OJT Hours</div>
          <input
            className="border rounded-xl p-2 w-full"
            type="number"
            value={hoursOjt}
            onChange={(e) => setHoursOjt(Number(e.target.value))}
          />
        </div>
        <div>
          <div className="text-xs text-black mb-1">Related Hours</div>
          <input
            className="border rounded-xl p-2 w-full"
            type="number"
            value={hoursRelated}
            onChange={(e) => setHoursRelated(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <div className="text-xs text-black mb-1">Notes</div>
        <textarea
          className="border rounded-xl p-3 w-full min-h-[120px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button
        className="border rounded-xl px-4 py-2 bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-colors"
        onClick={submit}
      >
        Submit
      </button>
      {msg && <div className="text-sm">{msg}</div>}
    </div>
  );
}
