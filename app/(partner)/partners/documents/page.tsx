export const dynamic = 'force-dynamic';

'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const TYPES = [
  'mou',
  'w9',
  'insurance',
  'license',
  'nda',
  'payroll',
  'other',
] as const;

export default function PartnerDocumentsPage() {
  const supabase = createClient();
  const [shopId, setShopId] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number]>('mou');
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: staff } = await supabase
        .from('shop_staff')
        .select('shop_id')
        .eq('is_active', true);
      setShopId(staff?.[0]?.shop_id ?? '');
    })();
  }, []);

  async function refresh() {
    setMsg(null);
    if (!shopId) return;
    const { data, error }: any = await supabase
      .from('partner_documents')
      .select('id, document_type, file_path, status, notes, created_at')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    if (error) setMsg(error.message);
    setDocs(data ?? []);
  }

  async function upload() {
    setMsg(null);
    if (!shopId || !file) {
      setMsg('Shop ID and file are required.');
      return;
    }

    const path = `${shopId}/${type}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from('partner-docs')
      .upload(path, file, { upsert: false });
    if (upErr) {
      setMsg(upErr.message);
      return;
    }

    const { data: u } = await supabase?.auth.getUser();

    const { error: dbErr } = await supabase?.from('partner_documents').insert({
      shop_id: shopId,
      document_type: type,
      file_path: path,
      uploaded_by: u.user?.id ?? null,
      status: 'pending',
    });

    if (dbErr) setMsg(dbErr.message);
    else {
      setMsg('Uploaded and submitted for review.');
      setFile(null);
      await refresh();
    }
  }

  return (
    <div className="rounded-2xl border p-5 space-y-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Documents" }]} />
      </div>
<div>
        <div className="font-semibold">Documents</div>
        <div className="text-sm text-black">
          Upload onboarding documents for approval.
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
          <div className="text-xs text-black mb-1">Type</div>
          <select
            className="border rounded-xl p-2"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs text-black mb-1">File</div>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <button
          className="border rounded-xl px-4 py-2 bg-brand-blue-600 text-white hover:bg-brand-blue-700 transition-colors"
          onClick={upload}
        >
          Upload
        </button>
        <button
          className="border rounded-xl px-4 py-2"
          aria-label="Button"
          onClick={refresh}
        >
          Refresh
        </button>
      </div>

      <div className="rounded-xl border p-3">
        <div className="font-medium">Submitted</div>
        <div className="mt-2 space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="rounded-lg border p-2 text-sm">
              <div className="flex items-center justify-between">
                <div>{d.document_type}</div>
                <div className="text-xs text-black">{d.status}</div>
              </div>
              <div className="text-xs text-black mt-1">{d.file_path}</div>
            </div>
          ))}
          {docs.length === 0 && (
            <div className="text-sm text-black">
              No documents submitted yet.
            </div>
          )}
        </div>
      </div>

      {msg && <div className="text-sm">{msg}</div>}
    </div>
  );
}
