'use client';

/**
 * ExternalCoursesPanel
 *
 * Renders partner-hosted training requirements attached to a program.
 * Learners click through to the external provider, complete the training,
 * then upload their DOL wallet card / certificate here.
 *
 * Calls /api/programs/[slug]/external-courses (GET) and
 *       /api/programs/[slug]/external-courses/[courseId]/complete (POST multipart or JSON).
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink, CheckCircle, Circle, ChevronDown, ChevronUp,
  Upload, Loader2, X, AlertCircle, CreditCard, ShieldCheck,
} from 'lucide-react';

interface ExternalCourse {
  id: string;
  partner_name: string;
  title: string;
  external_url: string;
  description: string;
  duration_display: string;
  credential_name: string;
  enrollment_instructions: string;
  is_required: boolean;
  manual_completion_enabled: boolean;
  sort_order: number;
  cost_cents: number;
  payer_rule: 'sponsored' | 'always_student' | 'always_elevate' | null;
}

interface Completion {
  courseId: string;
  certificate_url: string | null;
}

interface Props {
  /** Program slug, e.g. "hvac-technician" */
  programSlug: string;
  /** Only show required courses */
  requiredOnly?: boolean;
  /** Student's enrollment funding source — drives pay vs sponsored display */
  fundingSource?: string;
}

const ELEVATE_SPONSORED_SOURCES = new Set([
  'wioa', 'wioa_title_i', 'wioa_title_ii',
  'workone', 'workforce_ready_grant', 'jri', 'job_ready_indy',
]);

export default function ExternalCoursesPanel({ programSlug, requiredOnly = false, fundingSource }: Props) {
  const [courses, setCourses]         = useState<ExternalCourse[]>([]);
  const [expanded, setExpanded]       = useState<Record<string, boolean>>({});
  const [completions, setCompletions] = useState<Record<string, Completion>>({});
  const [uploading, setUploading]     = useState<string | null>(null);
  const [attesting, setAttesting]     = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isElevateSponsored = fundingSource ? ELEVATE_SPONSORED_SOURCES.has(fundingSource) : false;

  useEffect(() => {
    fetch(`/api/programs/${programSlug}/external-courses`)
      .then(r => r.json())
      .then(data => {
        const list: ExternalCourse[] = (data.courses ?? [])
          .filter((c: ExternalCourse) => !requiredOnly || c.is_required)
          .sort((a: ExternalCourse, b: ExternalCourse) => a.sort_order - b.sort_order);
        setCourses(list);
      })
      .catch(() => { /* non-critical */ })
      .finally(() => setLoading(false));
  }, [programSlug, requiredOnly]);

  if (loading || courses.length === 0) return null;

  function toggleExpand(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  async function submitCompletion(courseId: string, file?: File) {
    setUploadError(null);

    let body: BodyInit;
    let headers: HeadersInit | undefined;

    if (file) {
      const form = new FormData();
      form.append('file', file);
      body = form;
    } else {
      body = '{}';
      headers = { 'Content-Type': 'application/json' };
    }

    const res = await fetch(
      `/api/programs/${programSlug}/external-courses/${courseId}/complete`,
      { method: 'POST', body, headers },
    );

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error((json as { error?: string }).error ?? 'Request failed');
    }

    const json = await res.json() as { ok: boolean; certificate_url: string | null };
    setCompletions(prev => ({
      ...prev,
      [courseId]: { courseId, certificate_url: json.certificate_url },
    }));
  }

  async function handleFileChange(courseId: string, file: File) {
    setUploading(courseId);
    try {
      await submitCompletion(courseId, file);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  }

  async function handleCheckout(courseId: string) {
    setCheckingOut(courseId);
    setUploadError(null);
    try {
      const res = await fetch(
        `/api/programs/${programSlug}/external-courses/${courseId}/checkout`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
      );
      const json = await res.json() as { ok: boolean; payer?: string; url?: string; message?: string };
      if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Checkout failed');

      if (json.payer === 'elevate') {
        // Elevate is covering it — no Stripe redirect needed, reload to show updated state
        window.location.reload();
      } else if (json.url) {
        window.location.href = json.url;
      }
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setCheckingOut(null);
    }
  }

  async function handleSelfAttest(courseId: string) {
    setAttesting(courseId);
    try {
      await submitCompletion(courseId);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Could not record completion');
    } finally {
      setAttesting(null);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="px-5 py-3 bg-amber-100 border-b border-amber-200 flex items-center gap-2">
        <span className="text-sm font-bold text-amber-900">Required External Training</span>
        <span className="ml-auto text-xs text-amber-700">Complete alongside this module</span>
      </div>

      {uploadError && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{uploadError}</span>
          <button onClick={() => setUploadError(null)} aria-label="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="divide-y divide-amber-100">
        {courses.map(course => {
          const done        = !!completions[course.id];
          const open        = expanded[course.id];
          const isUploading = uploading === course.id;
          const isAttesting = attesting === course.id;
          const certUrl     = completions[course.id]?.certificate_url;

          return (
            <div key={course.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {done
                    ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                    : <Circle className="w-5 h-5 text-amber-400" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{course.title}</span>
                    {course.is_required && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                        Required
                      </span>
                    )}
                    {done && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        ✓ Submitted
                      </span>
                    )}
                    <span className="text-xs text-slate-500">{course.duration_display}</span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1">{course.description}</p>

                  {certUrl && (
                    <a
                      href={certUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                    >
                      View uploaded certificate
                    </a>
                  )}

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Link
                      href={course.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-blue-700 hover:bg-brand-blue-800 px-3 py-1.5 rounded-lg transition"
                    >
                      Go to {course.partner_name} <ExternalLink className="w-3 h-3" />
                    </Link>

                    <button
                      onClick={() => toggleExpand(course.id)}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
                    >
                      Enrollment steps {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {!done && (
                      <>
                        {/* ── Payment / sponsorship row ── */}
                        {course.cost_cents > 0 && (
                          isElevateSponsored ? (
                            /* Elevate covers it — show status, trigger sponsored checkout */
                            <button
                              onClick={() => handleCheckout(course.id)}
                              disabled={checkingOut === course.id}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                            >
                              {checkingOut === course.id
                                ? <><Loader2 className="w-3 h-3 animate-spin" /> Processing…</>
                                : <><ShieldCheck className="w-3 h-3" /> Elevate-sponsored — Enroll</>
                              }
                            </button>
                          ) : (
                            /* Student pays — Stripe checkout */
                            <button
                              onClick={() => handleCheckout(course.id)}
                              disabled={checkingOut === course.id}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                            >
                              {checkingOut === course.id
                                ? <><Loader2 className="w-3 h-3 animate-spin" /> Redirecting…</>
                                : <><CreditCard className="w-3 h-3" /> Pay &amp; Enroll (${(course.cost_cents / 100).toFixed(2)})</>
                              }
                            </button>
                          )
                        )}

                        {/* ── Upload certificate after completing ── */}
                        <input
                          ref={el => { fileRefs.current[course.id] = el; }}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFileChange(course.id, file);
                            e.target.value = '';
                          }}
                        />
                        <button
                          onClick={() => fileRefs.current[course.id]?.click()}
                          disabled={isUploading || isAttesting}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                        >
                          {isUploading
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</>
                            : <><Upload className="w-3 h-3" /> Upload Wallet Card / Certificate</>
                          }
                        </button>

                        <button
                          onClick={() => handleSelfAttest(course.id)}
                          disabled={isUploading || isAttesting}
                          className="text-xs text-slate-500 hover:text-slate-700 transition disabled:opacity-50"
                        >
                          {isAttesting ? 'Saving…' : 'Mark complete (no file)'}
                        </button>
                      </>
                    )}
                  </div>

                  {open && (
                    <div className="mt-3 bg-white rounded-lg border border-amber-200 p-3 text-xs text-slate-700 whitespace-pre-line">
                      {course.enrollment_instructions}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 bg-amber-100 border-t border-amber-200">
        <p className="text-xs text-amber-800">
          <strong>How to submit:</strong> Complete the course on the partner site, then upload your
          DOL wallet card or completion certificate (PDF, JPG, or PNG, max 10 MB).
          Staff will verify your submission within 1–2 business days.
        </p>
      </div>
    </div>
  );
}
