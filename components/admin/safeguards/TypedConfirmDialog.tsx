"use client";

import { useMemo, useState } from "react";

type Props = {
  title: string;
  description?: string;
  confirmWord?: string;
  impactText?: string;
  sampleLines?: string[];
  confirmButtonText?: string;
  isDanger?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
};

export function TypedConfirmDialog({
  title,
  description,
  confirmWord = "CONFIRM",
  impactText,
  sampleLines,
  confirmButtonText = "Confirm",
  isDanger = true,
  onConfirm,
  onCancel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const canConfirm = useMemo(() => typed.trim().toUpperCase() === confirmWord.toUpperCase(), [typed, confirmWord]);

  const close = () => {
    setOpen(false);
    setTyped("");
    setBusy(false);
    onCancel?.();
  };

  const run = async () => {
    if (!canConfirm || busy) return;
    setBusy(true);
    try {
      await onConfirm();
      close();
    } catch (e) {
      setBusy(false);
      console.error(e);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
          isDanger ? "border-brand-red-200 text-brand-red-800 hover:border-brand-red-300" : "border-gray-200 text-gray-900 hover:border-gray-300"
        }`}
      >
        {confirmButtonText}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-900">{title}</div>
              {description ? <div className="text-sm text-gray-800">{description}</div> : null}
              {impactText ? <div className="text-sm font-semibold text-gray-900">{impactText}</div> : null}

              {sampleLines?.length ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-900">Sample</div>
                  <ul className="mt-2 space-y-1 text-xs text-gray-800">
                    {sampleLines.slice(0, 10).map((line) => (
                      <li key={line} className="font-mono">{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="space-y-1 pt-2">
                <label className="text-sm font-semibold text-gray-900">
                  Type <span className="font-mono">{confirmWord}</span> to confirm
                </label>
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 outline-none focus:border-gray-400"
                  placeholder={confirmWord}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:border-gray-300"
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={run}
                  disabled={!canConfirm || busy}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                    !canConfirm || busy ? "bg-gray-400" : isDanger ? "bg-brand-red-700 hover:bg-brand-red-800" : "bg-gray-900 hover:bg-black"
                  }`}
                >
                  {busy ? "Working…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
