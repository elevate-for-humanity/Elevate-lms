# Line-by-line repair review — 2026-10-24

Baseline: 8212d2b9. Every source/test/migration difference below is EXPECTED for the repairs in PR #2117. Side-by-side diff -y was also inspected. No unrelated edits included.

## apps/admin/app/advanced-tools/page.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 29 |       { label: 'Import', href: '/import', desc: 'General import utility' }, | — |  | EXPECTED |
| 70 |       { label: 'Calendar Events', href: '/automation', desc: 'Manage calendar_events — orientations, sessions, deadlines' }, | 69 |       { label: 'Meetings &amp; Calendar', href: '/phone/meetings', desc: 'Manage scheduled meetings and linked Google Calendar sessions' }, | EXPECTED |
| 110 |       { label: 'Automation', href: '/automation', desc: 'Workflow automation rules' }, | — |  | EXPECTED |
| 114 |       { label: 'Sentry Test', href: '/api/sentry-test', desc: 'Dev only — trigger a test error to verify Sentry capture' }, | 112 |       { label: 'Monitoring', href: '/monitoring', desc: 'Review platform alerts, error tracking, and schema health' }, | EXPECTED |
| 174 |                   key={href} | 172 |                   key={&#96;${label}:${href}&#96;} | EXPECTED |

## apps/admin/app/api/admin/dev-studio/tasks/[id]/rollback/route.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 1 | import { NextRequest } from 'next/server'; | 1 | import { NextRequest, NextResponse } from 'next/server'; | EXPECTED |
| 4 | import { requireAdminClient } from '@/lib/supabase/admin'; | — |  | EXPECTED |
| 5 | import { safeInternalError } from '@/lib/api/safe-error'; | — |  | EXPECTED |
| 6 | import { rollbackTask } from '@/lib/devstudio/os/task-runner'; | — |  | EXPECTED |
| 7 | import { jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers'; | — |  | EXPECTED |
| 14 | export async function POST(request: NextRequest, context: RouteContext) { | 10 | export async function POST(request: NextRequest, _context: RouteContext) { | EXPECTED |
| 21 |   const { id } = await context.params; | 17 |   // The former implementation only relabeled the task; it never restored files. | EXPECTED |
| 22 |  | 18 |   // Do not acknowledge a rollback until a verified restore capability exists. | EXPECTED |
| 23 |   try { | 19 |   return NextResponse.json({ | EXPECTED |
| 24 |     const db = await requireAdminClient(); | 20 |     error: 'Automatic task rollback is unavailable. Restore a reviewed Git revision and redeploy. Task state has not been changed.', | EXPECTED |
| 25 |     await rollbackTask(db, id, auth.id); | 21 |     code: 'TASK_ROLLBACK_UNAVAILABLE', | EXPECTED |
| 26 |     const { data: task } = await db.from('ai_tasks').select('*').eq('id', id).single(); | 22 |   }, { status: 501 }); | EXPECTED |
| 27 |     return jsonOk({ task, rolledBack: true }); | — |  | EXPECTED |
| 28 |   } catch (err) { | — |  | EXPECTED |
| 29 |     const message = err instanceof Error ? err.message : ''; | — |  | EXPECTED |
| 30 |     if (message.includes('not found')) return tableNotReadyResponse(); | — |  | EXPECTED |
| 31 |     return safeInternalError(err, 'Failed to rollback task'); | — |  | EXPECTED |
| 32 |   } | — |  | EXPECTED |

## components/admin/course-builder/ProductionPanelLayout.module.css

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 2 | .mobileTabs { display: none; } | 2 | .mobileTabs { display: flex; flex-wrap: wrap; gap: .5rem; padding: .5rem; } | EXPECTED |
| 3 | .desktop { display: contents; } | 3 | .mobileTabs[hidden] { display: none; } | EXPECTED |
| 4 | .mobile { display: none; } | 4 | /* Follow the actual pane width, including when nested in the desktop Studio. */ | EXPECTED |
| 5 | @media (max-width: 767px) { | 5 | .root[data-compact=true] .operations, | EXPECTED |
| 6 |   .mobileTabs { display: flex; flex-wrap: wrap; gap: .5rem; padding: .5rem; } | 6 | .root[data-compact=true] .outline { height: auto !important; min-height: 0 !important; } | EXPECTED |
| 7 |   .desktop { display: none; } | — |  | EXPECTED |
| 8 |   .mobile { display: block; min-width: 0; } | — |  | EXPECTED |
| 9 | } | — |  | EXPECTED |
| 10 | @media (max-width: 767px) { | — |  | EXPECTED |
| 11 |   .operations, .outline { height: auto !important; min-height: 0 !important; } | — |  | EXPECTED |
| 12 |   .operations &gt; div:first-child, .outline &gt; div:first-child { display: none; } | — |  | EXPECTED |
| 13 |   .operations &gt; div:nth-child(2), .outline &gt; div:nth-child(2) { display: block; overflow: visible; } | — |  | EXPECTED |
| 14 |   .operations &gt; div:nth-child(2) &gt; [role=separator], .outline &gt; div:nth-child(2) &gt; [role=separator] { display: none; } | — |  | EXPECTED |
| 15 |   .root[data-mobile-pane=preview] .operations &gt; div:nth-child(2) &gt; section, | — |  | EXPECTED |
| 16 |   .root[data-mobile-pane=preview] .outline &gt; div:nth-child(2) &gt; section, | — |  | EXPECTED |
| 17 |   .root[data-mobile-pane=outline] .operations &gt; div:nth-child(2) &gt; section, | — |  | EXPECTED |
| 18 |   .root[data-mobile-pane=outline] .outline &gt; div:nth-child(2) &gt; div:first-child, | — |  | EXPECTED |
| 19 |   .root[data-mobile-pane=operations] .operations &gt; div:nth-child(2) &gt; div:first-child { display: none; } | — |  | EXPECTED |
| 20 |   .root[data-mobile-pane=outline] .outline &gt; div:nth-child(2) &gt; section, | — |  | EXPECTED |
| 21 |   .root[data-mobile-pane=operations] .operations &gt; div:nth-child(2) &gt; section { display: block; } | — |  | EXPECTED |
| 22 | } | — |  | EXPECTED |

## components/admin/course-builder/ProductionPanelLayout.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 17 |   const root = useRef&lt;HTMLDivElement&gt;(null); | EXPECTED |
| — |  | 18 |   const [compact, setCompact] = useState(false); | EXPECTED |
| — |  | 25 |   useEffect(() =&gt; { | EXPECTED |
| — |  | 26 |     const element = root.current; | EXPECTED |
| — |  | 27 |     if (!element) return; | EXPECTED |
| — |  | 28 |     const measure = () =&gt; setCompact(element.getBoundingClientRect().width &lt;= 760); | EXPECTED |
| — |  | 29 |     measure(); | EXPECTED |
| — |  | 30 |     if (typeof ResizeObserver === "undefined") { | EXPECTED |
| — |  | 31 |       window.addEventListener("resize", measure); | EXPECTED |
| — |  | 32 |       return () =&gt; window.removeEventListener("resize", measure); | EXPECTED |
| — |  | 33 |     } | EXPECTED |
| — |  | 34 |     const observer = new ResizeObserver(measure); | EXPECTED |
| — |  | 35 |     observer.observe(element); | EXPECTED |
| — |  | 36 |     return () =&gt; observer.disconnect(); | EXPECTED |
| — |  | 37 |   }, []); | EXPECTED |
| 37 |     &lt;div className={styles.root} data-mobile-pane={mobilePane}&gt; | 52 |     &lt;div ref={root} className={styles.root} data-compact={compact}&gt; | EXPECTED |
| — |  | 56 |         hidden={!compact} | EXPECTED |
| 42 |         {(["outline", "preview", "operations"] as const).map((pane) =&gt; ( | 58 |         {(["outline", "preview", "operations"] as const).filter((pane) =&gt; pane !== "operations" &#124;&#124; operations != null).map((pane) =&gt; ( | EXPECTED |
| 47 |             onClick={() =&gt; { | 63 |             onClick={() =&gt; setMobilePane(pane)} | EXPECTED |
| 48 |               setMobilePane(pane); | — |  | EXPECTED |
| 49 |               setOutlineOpen(pane === "outline"); | — |  | EXPECTED |
| 50 |               setOperationsOpen(pane === "operations"); | — |  | EXPECTED |
| 51 |             }} | — |  | EXPECTED |
| — |  | 81 |         activePane={compact ? mobilePane === "operations" ? "panel" : "primary" : undefined} | EXPECTED |
| — |  | 91 |           activePane={compact ? mobilePane === "outline" ? "panel" : "primary" : undefined} | EXPECTED |

## components/admin/dashboard/JobBoardPanel.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 8 |   total: number; | 8 |   count: number; | EXPECTED |
| 9 |   lastImport: string &#124; null; | 9 |   sources: Record&lt;string, { records: number; latestImport: string &#124; null }&gt;; | EXPECTED |
| 12 |     careeronestop: boolean; | 12 |     careerOneStop: boolean; | EXPECTED |
| 21 |   const [importResult, setImportResult] = useState&lt;{ imported: number; skipped: number } &#124; null&gt;(null); | 21 |   const [importResult, setImportResult] = useState&lt;number &#124; null&gt;(null); | EXPECTED |
| — |  | 22 |   const [importError, setImportError] = useState(''); | EXPECTED |
| — |  | 23 |   const [sourceErrors, setSourceErrors] = useState&lt;string[]&gt;([]); | EXPECTED |
| — |  | 24 |  | EXPECTED |
| — |  | 25 |   async function loadStats() { | EXPECTED |
| — |  | 26 |     const response = await fetch('/api/jobs/government-feed', { cache: 'no-store' }); | EXPECTED |
| — |  | 27 |     const json = await response.json().catch(() =&gt; ({})); | EXPECTED |
| — |  | 28 |     if (!response.ok) throw new Error(json.error ?? &#96;Job feed status failed (HTTP ${response.status})&#96;); | EXPECTED |
| — |  | 29 |     if (!Number.isInteger(json.count) &#124;&#124; !json.configured &#124;&#124; !json.sources) { | EXPECTED |
| — |  | 30 |       throw new Error('Job feed returned an invalid status response.'); | EXPECTED |
| — |  | 31 |     } | EXPECTED |
| — |  | 32 |     setStats(json); | EXPECTED |
| — |  | 33 |     setError(''); | EXPECTED |
| — |  | 34 |   } | EXPECTED |
| 24 |     fetch('/api/jobs/government-feed') | 37 |     void loadStats() | EXPECTED |
| 25 |       .then(async (r) =&gt; { | — |  | EXPECTED |
| 26 |         const json = await r.json().catch(() =&gt; ({})); | — |  | EXPECTED |
| 27 |         if (!r.ok) throw new Error(json.error ?? &#96;HTTP ${r.status}&#96;); | — |  | EXPECTED |
| 28 |         return json; | — |  | EXPECTED |
| 29 |       }) | — |  | EXPECTED |
| 30 |       .then((json) =&gt; { setStats(json); setError(''); }) | — |  | EXPECTED |
| — |  | 43 |     if (importing) return; | EXPECTED |
| — |  | 46 |     setImportError(''); | EXPECTED |
| — |  | 47 |     setSourceErrors([]); | EXPECTED |
| 40 |       const data = await res.json(); | 50 |       const data = await res.json().catch(() =&gt; ({})); | EXPECTED |
| 41 |       setImportResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0 }); | 51 |       if (!res.ok) throw new Error(data.error ?? &#96;Job import failed (HTTP ${res.status})&#96;); | EXPECTED |
| 42 |       // Refresh stats | 52 |       if (data.ok !== true &#124;&#124; !Number.isInteger(data.imported?.total) &#124;&#124; data.imported.total &lt; 0) { | EXPECTED |
| 43 |       const updated = await fetch('/api/jobs/government-feed').then((r) =&gt; r.json()); | 53 |         throw new Error('The server did not confirm the import result. Check job feed status before retrying.'); | EXPECTED |
| 44 |       setStats(updated); | 54 |       } | EXPECTED |
| 45 |     } catch { | 55 |       setImportResult(data.imported.total); | EXPECTED |
| 46 |       setImportResult({ imported: 0, skipped: -1 }); | 56 |       setSourceErrors([ | EXPECTED |
| — |  | 57 |         ['usaJobs', 'USAJobs'], ['careerOneStop', 'CareerOneStop'], ['onet', 'O*NET'], | EXPECTED |
| — |  | 58 |       ].flatMap(([key, label]) =&gt; typeof data.errors?.[key] === 'string' &amp;&amp; data.errors[key] ? [&#96;${label}: ${data.errors[key]}&#96;] : [])); | EXPECTED |
| — |  | 59 |       try { | EXPECTED |
| — |  | 60 |         await loadStats(); | EXPECTED |
| — |  | 61 |       } catch (reason) { | EXPECTED |
| — |  | 62 |         setError(&#96;Import completed, but status could not refresh: ${reason instanceof Error ? reason.message : 'Unknown status error'}&#96;); | EXPECTED |
| — |  | 63 |       } | EXPECTED |
| — |  | 64 |     } catch (reason) { | EXPECTED |
| — |  | 65 |       setImportError(reason instanceof Error ? reason.message : 'Job import could not complete.'); | EXPECTED |
| 54 |     { key: 'careeronestop' as const, label: 'CareerOneStop', href: 'https://www.careeronestop.org/Developers/WebAPI/', note: 'DOL-funded job listings' }, | 73 |     { key: 'careerOneStop' as const, label: 'CareerOneStop', href: 'https://www.careeronestop.org/Developers/WebAPI/', note: 'DOL-funded job listings' }, | EXPECTED |
| — |  | 75 |   const lastImport = Object.values(stats?.sources ?? {}) | EXPECTED |
| — |  | 76 |     .map(source =&gt; source.latestImport) | EXPECTED |
| — |  | 77 |     .filter((date): date is string =&gt; typeof date === 'string' &amp;&amp; Number.isFinite(Date.parse(date))) | EXPECTED |
| — |  | 78 |     .sort((a, b) =&gt; Date.parse(b) - Date.parse(a))[0]; | EXPECTED |
| 79 |             {loading ? '—' : (stats?.total ?? 0)} | 102 |             {stats?.count ?? '—'} | EXPECTED |
| 82 |             &lt;Zap className="w-3 h-3 text-amber-500" /&gt; Gov feed jobs | 105 |             &lt;Zap className="w-3 h-3 text-amber-500" /&gt; Recent feed jobs | EXPECTED |
| 88 |             {loading | 111 |             {loading &#124;&#124; !stats | EXPECTED |
| 90 |               : stats?.lastImport | 113 |               : lastImport | EXPECTED |
| 91 |               ? new Date(stats.lastImport).toLocaleDateString('en-US', { | 114 |               ? new Date(lastImport).toLocaleDateString('en-US', { | EXPECTED |
| 103 |         &lt;div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"&gt; | 126 |         &lt;div role="alert" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"&gt; | EXPECTED |
| 139 |       {importResult &amp;&amp; ( | 162 |       {importResult !== null &amp;&amp; ( | EXPECTED |
| 140 |         &lt;div className={&#96;text-xs rounded-lg px-3 py-2 mb-3 ${importResult.skipped === -1 ? 'bg-red-50 text-red-700' : 'bg-brand-green-50 text-brand-green-700'}&#96;}&gt; | 163 |         &lt;div role="status" className="text-xs rounded-lg px-3 py-2 mb-3 bg-brand-green-50 text-brand-green-700"&gt; | EXPECTED |
| 141 |           {importResult.skipped === -1 | 164 |           Imported {importResult} jobs. | EXPECTED |
| 142 |             ? 'Import failed — check server logs.' | 165 |         &lt;/div&gt; | EXPECTED |
| 143 |             : &#96;Imported ${importResult.imported} jobs, ${importResult.skipped} skipped.&#96;} | 166 |       )} | EXPECTED |
| — |  | 167 |       {(importError &#124;&#124; sourceErrors.length &gt; 0) &amp;&amp; ( | EXPECTED |
| — |  | 168 |         &lt;div role="alert" className="text-xs rounded-lg px-3 py-2 mb-3 bg-red-50 text-red-700"&gt; | EXPECTED |
| — |  | 169 |           {importError &#124;&#124; &#96;Some sources could not complete: ${sourceErrors.join('; ')}&#96;} | EXPECTED |
| — |  | 176 |           type="button" | EXPECTED |

## components/admin/dashboard/LizzyErrorsPanel.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 77 |                 &lt;Link href="/api/sentry-test" target="_blank" className="text-[#4fc1ff] hover:underline"&gt; | 77 |                 &lt;Link href="/monitoring" className="text-[#4fc1ff] hover:underline"&gt; | EXPECTED |
| 78 |                   Trigger test event (dev) | 78 |                   Open monitoring | EXPECTED |

## components/studio/ResizableWorkspace.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 27 |   /** A parent-owned compact view; keeps both panes mounted without a second toolbar. */ | EXPECTED |
| — |  | 28 |   activePane?: "primary" &#124; "panel"; | EXPECTED |
| — |  | 46 |   activePane, | EXPECTED |
| 91 |   const mobileFull = open &amp;&amp; stacked &amp;&amp; mobileExclusive; | 94 |   const controlledPane = activePane !== undefined; | EXPECTED |
| 92 |   const full = open &amp;&amp; (expanded &#124;&#124; mobileFull); | 95 |   const mobileFull = !controlledPane &amp;&amp; open &amp;&amp; stacked &amp;&amp; mobileExclusive; | EXPECTED |
| 93 |   const tabbed = open &amp;&amp; stacked &amp;&amp; stackedTabs &amp;&amp; !full; | 96 |   const full = !controlledPane &amp;&amp; open &amp;&amp; (expanded &#124;&#124; mobileFull); | EXPECTED |
| — |  | 97 |   const tabbed = !controlledPane &amp;&amp; open &amp;&amp; stacked &amp;&amp; stackedTabs &amp;&amp; !full; | EXPECTED |
| 96 |     if (!open &#124;&#124; !expanded &#124;&#124; mobileFull &#124;&#124; !element &#124;&#124; typeof element.showPopover !== "function") return; | 100 |     if (controlledPane &#124;&#124; !open &#124;&#124; !expanded &#124;&#124; mobileFull &#124;&#124; !element &#124;&#124; typeof element.showPopover !== "function") return; | EXPECTED |
| 110 |   }, [open, expanded, mobileFull]); | 114 |   }, [open, expanded, mobileFull, controlledPane]); | EXPECTED |
| 116 |       popover={open &amp;&amp; expanded &amp;&amp; !mobileFull ? "manual" : undefined} | 120 |       popover={!controlledPane &amp;&amp; open &amp;&amp; expanded &amp;&amp; !mobileFull ? "manual" : undefined} | EXPECTED |
| 117 |       className={&#96;${styles.root} ${mobileFull ? styles.mobileExclusive : ""} ${open &amp;&amp; expanded ? styles.fullScreen : ""} ${className}&#96;} | 121 |       className={&#96;${styles.root} ${mobileFull ? styles.mobileExclusive : ""} ${!controlledPane &amp;&amp; open &amp;&amp; expanded ? styles.fullScreen : ""} ${className}&#96;} | EXPECTED |
| 119 |       &lt;div className={styles.toolbar} hidden={!open &amp;&amp; hideClosedToolbar}&gt; | 123 |       &lt;div className={styles.toolbar} hidden={controlledPane &#124;&#124; (!open &amp;&amp; hideClosedToolbar)}&gt; | EXPECTED |
| 173 |         className={&#96;${styles.body} ${panelPosition === "start" ? styles.panelStart : ""} ${open ? styles.open : ""} ${full ? styles.expanded : ""} ${tabbed ? styles.tabbed : ""}&#96;} | 177 |         className={&#96;${styles.body} ${panelPosition === "start" ? styles.panelStart : ""} ${open ? styles.open : ""} ${full ? styles.expanded : ""} ${tabbed &#124;&#124; controlledPane ? styles.tabbed : ""}&#96;} | EXPECTED |
| 181 |         &lt;div id={&#96;${panelId}-primary&#96;} className={styles.primary} hidden={full &#124;&#124; (tabbed &amp;&amp; stackedPane === "panel")}&gt; | 185 |         &lt;div id={&#96;${panelId}-primary&#96;} className={styles.primary} hidden={controlledPane ? activePane === "panel" : full &#124;&#124; (tabbed &amp;&amp; stackedPane === "panel")}&gt; | EXPECTED |
| 184 |         {open &amp;&amp; !full &amp;&amp; !tabbed &amp;&amp; ( | 188 |         {open &amp;&amp; !full &amp;&amp; !tabbed &amp;&amp; !controlledPane &amp;&amp; ( | EXPECTED |
| 263 |           hidden={!open &#124;&#124; (tabbed &amp;&amp; stackedPane === "primary")} | 267 |           hidden={controlledPane ? activePane === "primary" : !open &#124;&#124; (tabbed &amp;&amp; stackedPane === "primary")} | EXPECTED |

## lib/course-builder/edit-service.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 133 |     ? db.from('course_modules').update(payload).eq('id', body.id) | 133 |     ? db.from('course_modules').update(payload).eq('id', body.id).eq('course_id', body.courseId) | EXPECTED |
| — |  | 143 |   const { data: module, error: moduleError } = await db | EXPECTED |
| — |  | 144 |     .from('course_modules') | EXPECTED |
| — |  | 145 |     .select('course_id') | EXPECTED |
| — |  | 146 |     .eq('id', body.moduleId) | EXPECTED |
| — |  | 147 |     .maybeSingle(); | EXPECTED |
| — |  | 148 |   if (moduleError) throw moduleError; | EXPECTED |
| — |  | 149 |   if (!module &#124;&#124; module.course_id !== body.courseId) { | EXPECTED |
| — |  | 150 |     throw new Error('The selected module does not belong to this course.'); | EXPECTED |
| — |  | 151 |   } | EXPECTED |
| 163 |     metadata: { | 172 |     required_artifacts: body.requiredArtifacts ?? [], | EXPECTED |
| 164 |       requiredArtifacts: body.requiredArtifacts ?? [], | 173 |     domain_key: body.domainKey ?? null, | EXPECTED |
| 165 |       domainKey: body.domainKey ?? null, | 174 |     hour_category: body.hourCategory ?? null, | EXPECTED |
| 166 |       hourCategory: body.hourCategory ?? null, | 175 |     evidence_type: body.evidenceType ?? null, | EXPECTED |
| 167 |       evidenceType: body.evidenceType ?? null, | 176 |     delivery_method: body.deliveryMethod ?? null, | EXPECTED |
| 168 |       deliveryMethod: body.deliveryMethod ?? null, | 177 |     requires_instructor_signoff: body.requiresInstructorSignoff ?? false, | EXPECTED |
| 169 |       requiresInstructorSignoff: body.requiresInstructorSignoff ?? false, | 178 |     instructor_requirement: body.instructorRequirement ?? null, | EXPECTED |
| 170 |       instructorRequirement: body.instructorRequirement ?? null, | 179 |     minimum_seat_time_minutes: body.minimumSeatTimeMinutes ?? null, | EXPECTED |
| 171 |       minimumSeatTimeMinutes: body.minimumSeatTimeMinutes ?? null, | 180 |     fieldwork_eligible: body.fieldworkEligible ?? false, | EXPECTED |
| 172 |       fieldworkEligible: body.fieldworkEligible ?? false, | — |  | EXPECTED |
| 173 |     }, | — |  | EXPECTED |
| 176 |     ? db.from('course_lessons').update(payload).eq('id', body.id) | 183 |     ? db.from('course_lessons').update(payload).eq('id', body.id).eq('course_id', body.courseId) | EXPECTED |

## lib/devstudio/os/task-runner.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| 838 |  | — |  | EXPECTED |
| 839 | export async function rollbackTask( | — |  | EXPECTED |
| 840 |   db: SupabaseClient, | — |  | EXPECTED |
| 841 |   taskId: string, | — |  | EXPECTED |
| 842 |   actorId: string, | — |  | EXPECTED |
| 843 | ): Promise&lt;void&gt; { | — |  | EXPECTED |
| 844 |   const { data: task } = await db.from('ai_tasks').select('*').eq('id', taskId).single(); | — |  | EXPECTED |
| 845 |   if (!task) throw new Error('Task not found'); | — |  | EXPECTED |
| 846 |  | — |  | EXPECTED |
| 847 |   const { data: snapshots } = await db | — |  | EXPECTED |
| 848 |     .from('ai_file_snapshots') | — |  | EXPECTED |
| 849 |     .select('id, repo_path, snapshot_type') | — |  | EXPECTED |
| 850 |     .eq('task_id', taskId) | — |  | EXPECTED |
| 851 |     .eq('snapshot_type', 'before'); | — |  | EXPECTED |
| 852 |  | — |  | EXPECTED |
| 853 |   await db | — |  | EXPECTED |
| 854 |     .from('ai_tasks') | — |  | EXPECTED |
| 855 |     .update({ | — |  | EXPECTED |
| 856 |       status: 'rolled_back', | — |  | EXPECTED |
| 857 |       completed_at: new Date().toISOString(), | — |  | EXPECTED |
| 858 |       result_json: { rolled_back: true, snapshots: snapshots?.length ?? 0 }, | — |  | EXPECTED |
| 859 |       updated_at: new Date().toISOString(), | — |  | EXPECTED |
| 860 |     }) | — |  | EXPECTED |
| 861 |     .eq('id', taskId); | — |  | EXPECTED |
| 862 |  | — |  | EXPECTED |
| 863 |   await setAgentStatus(db, task.agent_id, 'idle'); | — |  | EXPECTED |
| 864 |   await appendTaskLog( | — |  | EXPECTED |
| 865 |     db, | — |  | EXPECTED |
| 866 |     taskId, | — |  | EXPECTED |
| 867 |     &#96;Task marked rolled back (${snapshots?.length ?? 0} snapshots referenced)&#96;, | — |  | EXPECTED |
| 868 |     'warn', | — |  | EXPECTED |
| 869 |     undefined, | — |  | EXPECTED |
| 870 |     task.tenant_id, | — |  | EXPECTED |
| 871 |     actorId, | — |  | EXPECTED |
| 872 |   ); | — |  | EXPECTED |
| 873 |  | — |  | EXPECTED |
| 874 |   await writeDevAuditLog(db, { | — |  | EXPECTED |
| 875 |     actorId, | — |  | EXPECTED |
| 876 |     action: 'task.rollback', | — |  | EXPECTED |
| 877 |     resourceType: 'ai_tasks', | — |  | EXPECTED |
| 878 |     resourceId: taskId, | — |  | EXPECTED |
| 879 |     traceId: task.trace_id, | — |  | EXPECTED |
| 880 |   }); | — |  | EXPECTED |
| 881 | } | — |  | EXPECTED |

## tests/unit/production-panel-container.test.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'; | EXPECTED |
| — |  | 2 | import { afterEach, beforeEach, expect, it, vi } from 'vitest'; | EXPECTED |
| — |  | 3 | import ProductionPanelLayout from '@/components/admin/course-builder/ProductionPanelLayout'; | EXPECTED |
| — |  | 4 |  | EXPECTED |
| — |  | 5 | let width = 640; | EXPECTED |
| — |  | 6 | let observers: Array&lt;() =&gt; void&gt; = []; | EXPECTED |
| — |  | 7 | beforeEach(() =&gt; { | EXPECTED |
| — |  | 8 |   width = 640; | EXPECTED |
| — |  | 9 |   observers = []; | EXPECTED |
| — |  | 10 |   vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() =&gt; ({ | EXPECTED |
| — |  | 11 |     x: 0, y: 0, top: 0, left: 0, right: width, bottom: 800, width, height: 800, toJSON() { return {}; }, | EXPECTED |
| — |  | 12 |   })); | EXPECTED |
| — |  | 13 |   vi.stubGlobal('ResizeObserver', class { | EXPECTED |
| — |  | 14 |     constructor(callback: ResizeObserverCallback) { observers.push(() =&gt; callback([], this as unknown as ResizeObserver)); } | EXPECTED |
| — |  | 15 |     observe() {} disconnect() {} unobserve() {} | EXPECTED |
| — |  | 16 |   }); | EXPECTED |
| — |  | 17 | }); | EXPECTED |
| — |  | 18 | afterEach(() =&gt; { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); }); | EXPECTED |
| — |  | 19 |  | EXPECTED |
| — |  | 20 | function Fixture() { | EXPECTED |
| — |  | 21 |   return &lt;ProductionPanelLayout outline={&lt;button&gt;Choose lesson&lt;/button&gt;} operations={&lt;button&gt;Resume course&lt;/button&gt;}&gt; | EXPECTED |
| — |  | 22 |     &lt;video aria-label="Saved lesson film" /&gt;&lt;input aria-label="Lesson draft" defaultValue="Unsaved draft" /&gt; | EXPECTED |
| — |  | 23 |   &lt;/ProductionPanelLayout&gt;; | EXPECTED |
| — |  | 24 | } | EXPECTED |
| — |  | 25 |  | EXPECTED |
| — |  | 26 | it('uses the available pane width and exposes one complete work view inside a desktop split', () =&gt; { | EXPECTED |
| — |  | 27 |   render(&lt;Fixture /&gt;); | EXPECTED |
| — |  | 28 |   expect(screen.getByRole('textbox', { name: 'Lesson draft' })).toBeVisible(); | EXPECTED |
| — |  | 29 |   expect(screen.queryByRole('button', { name: 'Resume course' })).toBeNull(); | EXPECTED |
| — |  | 30 |   expect(screen.queryByRole('button', { name: 'Choose lesson' })).toBeNull(); | EXPECTED |
| — |  | 31 |   expect(screen.queryAllByRole('separator')).toHaveLength(0); | EXPECTED |
| — |  | 32 |   fireEvent.click(screen.getByRole('button', { name: 'Outline', exact: true })); | EXPECTED |
| — |  | 33 |   expect(screen.getByRole('button', { name: 'Choose lesson' })).toBeVisible(); | EXPECTED |
| — |  | 34 |   expect(screen.queryByRole('textbox', { name: 'Lesson draft' })).toBeNull(); | EXPECTED |
| — |  | 35 |   fireEvent.click(screen.getByRole('button', { name: 'Operations', exact: true })); | EXPECTED |
| — |  | 36 |   expect(screen.getByRole('button', { name: 'Resume course' })).toBeVisible(); | EXPECTED |
| — |  | 37 |   expect(screen.queryByRole('button', { name: 'Choose lesson' })).toBeNull(); | EXPECTED |
| — |  | 38 | }); | EXPECTED |
| — |  | 39 |  | EXPECTED |
| — |  | 40 | it('preserves the editor, player and desktop panel choices across compact navigation and resize', () =&gt; { | EXPECTED |
| — |  | 41 |   width = 1200; | EXPECTED |
| — |  | 42 |   render(&lt;Fixture /&gt;); | EXPECTED |
| — |  | 43 |   const draft = screen.getByRole('textbox', { name: 'Lesson draft' }); | EXPECTED |
| — |  | 44 |   const video = screen.getByLabelText('Saved lesson film'); | EXPECTED |
| — |  | 45 |   fireEvent.click(screen.getByRole('button', { name: 'Close Production operations' })); | EXPECTED |
| — |  | 46 |   act(() =&gt; { width = 640; observers.forEach(update =&gt; update()); }); | EXPECTED |
| — |  | 47 |   fireEvent.click(screen.getByRole('button', { name: 'Operations', exact: true })); | EXPECTED |
| — |  | 48 |   expect(screen.getByRole('button', { name: 'Resume course' })).toBeVisible(); | EXPECTED |
| — |  | 49 |   fireEvent.click(screen.getByRole('button', { name: 'Preview', exact: true })); | EXPECTED |
| — |  | 50 |   expect(screen.getByRole('textbox', { name: 'Lesson draft' })).toBe(draft); | EXPECTED |
| — |  | 51 |   expect(draft).toHaveValue('Unsaved draft'); | EXPECTED |
| — |  | 52 |   expect(screen.getByLabelText('Saved lesson film')).toBe(video); | EXPECTED |
| — |  | 53 |   act(() =&gt; { width = 1200; observers.forEach(update =&gt; update()); }); | EXPECTED |
| — |  | 54 |   expect(screen.queryByRole('button', { name: 'Resume course' })).toBeNull(); | EXPECTED |
| — |  | 55 |   expect(screen.getByRole('button', { name: 'Choose lesson' })).toBeVisible(); | EXPECTED |
| — |  | 56 |   expect(screen.getByRole('button', { name: 'Open Production operations' })).toBeVisible(); | EXPECTED |
| — |  | 57 | }); | EXPECTED |

## tests/unit/dashboard-job-board-actions.test.tsx

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'; | EXPECTED |
| — |  | 2 | import { afterEach, expect, it, vi } from 'vitest'; | EXPECTED |
| — |  | 3 | import JobBoardPanel from '@/components/admin/dashboard/JobBoardPanel'; | EXPECTED |
| — |  | 4 |  | EXPECTED |
| — |  | 5 | afterEach(() =&gt; { cleanup(); vi.unstubAllGlobals(); }); | EXPECTED |
| — |  | 6 | const stats = { count: 12, configured: { usajobs: true, careerOneStop: true }, sources: { USAJobs: { records: 12, latestImport: '2026-10-24T12:00:00Z' } } }; | EXPECTED |
| — |  | 7 | function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); } | EXPECTED |
| — |  | 8 | function responses(importResponse: Response, refreshResponse = json(stats)) { | EXPECTED |
| — |  | 9 |   const fetcher = vi.fn().mockResolvedValueOnce(json(stats)).mockResolvedValueOnce(importResponse).mockResolvedValueOnce(refreshResponse); | EXPECTED |
| — |  | 10 |   vi.stubGlobal('fetch', fetcher); | EXPECTED |
| — |  | 11 |   return fetcher; | EXPECTED |
| — |  | 12 | } | EXPECTED |
| — |  | 13 | async function importJobs() { | EXPECTED |
| — |  | 14 |   render(&lt;JobBoardPanel /&gt;); | EXPECTED |
| — |  | 15 |   await waitFor(() =&gt; expect(screen.queryByText('—')).toBeNull()); | EXPECTED |
| — |  | 16 |   fireEvent.click(screen.getByRole('button', { name: 'Run Import' })); | EXPECTED |
| — |  | 17 | } | EXPECTED |
| — |  | 18 | it('uses the real feed status contract for counts and provider connection', async () =&gt; { | EXPECTED |
| — |  | 19 |   responses(json({})); | EXPECTED |
| — |  | 20 |   render(&lt;JobBoardPanel /&gt;); | EXPECTED |
| — |  | 21 |   expect(await screen.findByText('12')).toBeVisible(); | EXPECTED |
| — |  | 22 |   expect(screen.getAllByText('Connected')).toHaveLength(2); | EXPECTED |
| — |  | 23 |   expect(screen.queryByText('Never')).toBeNull(); | EXPECTED |
| — |  | 24 | }); | EXPECTED |
| — |  | 25 | it('reports an HTTP failure and leaves the import available for retry without claiming success', async () =&gt; { | EXPECTED |
| — |  | 26 |   const fetcher = responses(json({ error: 'Import unavailable' }, 503)); | EXPECTED |
| — |  | 27 |   await importJobs(); | EXPECTED |
| — |  | 28 |   expect(await screen.findByRole('alert')).toHaveTextContent('Import unavailable'); | EXPECTED |
| — |  | 29 |   expect(screen.queryByText(/Imported .* jobs/)).toBeNull(); | EXPECTED |
| — |  | 30 |   expect(screen.getByRole('button', { name: 'Run Import' })).toBeEnabled(); | EXPECTED |
| — |  | 31 |   expect(fetcher).toHaveBeenCalledTimes(2); | EXPECTED |
| — |  | 32 | }); | EXPECTED |
| — |  | 33 | it('renders the acknowledged import total and displays partial provider failures', async () =&gt; { | EXPECTED |
| — |  | 34 |   responses(json({ ok: true, imported: { total: 3, usaJobs: 3, careerOneStop: 0 }, errors: { careerOneStop: 'Provider unavailable' } })); | EXPECTED |
| — |  | 35 |   await importJobs(); | EXPECTED |
| — |  | 36 |   expect(await screen.findByRole('status')).toHaveTextContent('Imported 3 jobs.'); | EXPECTED |
| — |  | 37 |   expect(screen.getByRole('alert')).toHaveTextContent('CareerOneStop: Provider unavailable'); | EXPECTED |
| — |  | 38 | }); | EXPECTED |
| — |  | 39 | it('keeps an acknowledged import successful when the separate status refresh fails', async () =&gt; { | EXPECTED |
| — |  | 40 |   responses(json({ ok: true, imported: { total: 3 }, errors: {} }), json({ error: 'Status unavailable' }, 503)); | EXPECTED |
| — |  | 41 |   await importJobs(); | EXPECTED |
| — |  | 42 |   expect(await screen.findByRole('status')).toHaveTextContent('Imported 3 jobs.'); | EXPECTED |
| — |  | 43 |   expect(await screen.findByRole('alert')).toHaveTextContent('Import completed, but status could not refresh'); | EXPECTED |
| — |  | 44 |   expect(screen.getByText('12')).toBeVisible(); | EXPECTED |
| — |  | 45 | }); | EXPECTED |

## tests/unit/course-editor-lesson-storage.test.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import { beforeEach, describe, expect, it, vi } from 'vitest'; | EXPECTED |
| — |  | 2 |  | EXPECTED |
| — |  | 3 | const state = vi.hoisted(() =&gt; ({ | EXPECTED |
| — |  | 4 |   writes: [] as Array&lt;{ table: string; payload: Record&lt;string, unknown&gt; }&gt;, | EXPECTED |
| — |  | 5 |   filters: [] as Array&lt;{ table: string; column: string; value: unknown }&gt;, | EXPECTED |
| — |  | 6 |   error: null as null &#124; { message: string }, | EXPECTED |
| — |  | 7 |   moduleCourseId: '11111111-1111-4111-8111-111111111111' as string &#124; null, | EXPECTED |
| — |  | 8 | })); | EXPECTED |
| — |  | 9 | const db = vi.hoisted(() =&gt; ({ | EXPECTED |
| — |  | 10 |   from: (table: string) =&gt; { | EXPECTED |
| — |  | 11 |     const query: any = { | EXPECTED |
| — |  | 12 |       insert: (payload: Record&lt;string, unknown&gt;) =&gt; { state.writes.push({ table, payload }); return query; }, | EXPECTED |
| — |  | 13 |       update: (payload: Record&lt;string, unknown&gt;) =&gt; { state.writes.push({ table, payload }); return query; }, | EXPECTED |
| — |  | 14 |       eq: (column: string, value: unknown) =&gt; { state.filters.push({ table, column, value }); return query; }, | EXPECTED |
| — |  | 15 |       select: () =&gt; query, | EXPECTED |
| — |  | 16 |       maybeSingle: async () =&gt; ({ data: state.moduleCourseId ? { course_id: state.moduleCourseId } : null, error: state.error }), | EXPECTED |
| — |  | 17 |       single: async () =&gt; ({ data: { id: 'saved-lesson' }, error: state.error }), | EXPECTED |
| — |  | 18 |     }; | EXPECTED |
| — |  | 19 |     return query; | EXPECTED |
| — |  | 20 |   }, | EXPECTED |
| — |  | 21 | })); | EXPECTED |
| — |  | 22 | vi.mock('@/lib/course-builder/db', () =&gt; ({ getServiceDb: async () =&gt; db })); | EXPECTED |
| — |  | 23 | vi.mock('@/lib/supabase/admin', () =&gt; ({ requireAdminClient: async () =&gt; db })); | EXPECTED |
| — |  | 24 |  | EXPECTED |
| — |  | 25 | import { saveCourseLesson, saveCourseModule } from '@/lib/course-builder/edit-service'; | EXPECTED |
| — |  | 26 |  | EXPECTED |
| — |  | 27 | const input = { | EXPECTED |
| — |  | 28 |   courseId: '11111111-1111-4111-8111-111111111111', | EXPECTED |
| — |  | 29 |   moduleId: '22222222-2222-4222-8222-222222222222', | EXPECTED |
| — |  | 30 |   slug: 'safety', title: 'Safety', orderIndex: 0, lessonType: 'practical', durationMinutes: 30, | EXPECTED |
| — |  | 31 |   learningObjectives: ['Demonstrate safe operation'], content: { text: 'Safety procedure' }, | EXPECTED |
| — |  | 32 |   requiredArtifacts: ['video'], domainKey: 'safety', hourCategory: 'practical', evidenceType: 'video', | EXPECTED |
| — |  | 33 |   deliveryMethod: 'in_person', requiresInstructorSignoff: true, | EXPECTED |
| — |  | 34 |   instructorRequirement: { required: true, supervisionMethod: 'observation' }, | EXPECTED |
| — |  | 35 |   minimumSeatTimeMinutes: 25, fieldworkEligible: true, | EXPECTED |
| — |  | 36 | }; | EXPECTED |
| — |  | 37 |  | EXPECTED |
| — |  | 38 | beforeEach(() =&gt; { state.writes = []; state.filters = []; state.error = null; state.moduleCourseId = input.courseId; }); | EXPECTED |
| — |  | 39 |  | EXPECTED |
| — |  | 40 | describe('manual lesson persistence uses the LMS schema', () =&gt; { | EXPECTED |
| — |  | 41 |   it.each([undefined, '33333333-3333-4333-8333-333333333333'])('persists compliance fields on create/update (%s)', async (id) =&gt; { | EXPECTED |
| — |  | 42 |     await saveCourseLesson({ ...input, id }); | EXPECTED |
| — |  | 43 |     expect(state.writes).toHaveLength(1); | EXPECTED |
| — |  | 44 |     expect(state.writes[0].table).toBe('course_lessons'); | EXPECTED |
| — |  | 45 |     expect(state.writes[0].payload).toMatchObject({ | EXPECTED |
| — |  | 46 |       course_id: input.courseId, module_id: input.moduleId, | EXPECTED |
| — |  | 47 |       required_artifacts: ['video'], domain_key: 'safety', hour_category: 'practical', evidence_type: 'video', | EXPECTED |
| — |  | 48 |       delivery_method: 'in_person', requires_instructor_signoff: true, | EXPECTED |
| — |  | 49 |       instructor_requirement: input.instructorRequirement, minimum_seat_time_minutes: 25, fieldwork_eligible: true, | EXPECTED |
| — |  | 50 |     }); | EXPECTED |
| — |  | 51 |     expect(state.writes[0].payload).not.toHaveProperty('metadata'); | EXPECTED |
| — |  | 52 |     if (id) expect(state.filters).toContainEqual({ table: 'course_lessons', column: 'course_id', value: input.courseId }); | EXPECTED |
| — |  | 53 |   }); | EXPECTED |
| — |  | 54 |  | EXPECTED |
| — |  | 55 |   it.each([null, '44444444-4444-4444-8444-444444444444'])('rejects a missing or mismatched parent module (%s)', async (moduleCourseId) =&gt; { | EXPECTED |
| — |  | 56 |     state.moduleCourseId = moduleCourseId; | EXPECTED |
| — |  | 57 |     await expect(saveCourseLesson(input)).rejects.toThrow('does not belong to this course'); | EXPECTED |
| — |  | 58 |     expect(state.writes).toHaveLength(0); | EXPECTED |
| — |  | 59 |   }); | EXPECTED |
| — |  | 60 |  | EXPECTED |
| — |  | 61 |   it('does not report a successful save after a database failure', async () =&gt; { | EXPECTED |
| — |  | 62 |     state.error = { message: 'database unavailable' }; | EXPECTED |
| — |  | 63 |     await expect(saveCourseLesson(input)).rejects.toEqual(state.error); | EXPECTED |
| — |  | 64 |   }); | EXPECTED |
| — |  | 65 |  | EXPECTED |
| — |  | 66 |   it('scopes module edits to the selected course', async () =&gt; { | EXPECTED |
| — |  | 67 |     await saveCourseModule({ | EXPECTED |
| — |  | 68 |       id: input.moduleId, courseId: input.courseId, title: 'Safety', slug: 'safety', | EXPECTED |
| — |  | 69 |       orderIndex: 0, domainKey: 'safety', targetHours: 1, quizRequired: true, practicalRequired: true, | EXPECTED |
| — |  | 70 |     }); | EXPECTED |
| — |  | 71 |     expect(state.filters).toContainEqual({ table: 'course_modules', column: 'course_id', value: input.courseId }); | EXPECTED |
| — |  | 72 |   }); | EXPECTED |
| — |  | 73 | }); | EXPECTED |

## tests/unit/studio-task-rollback-boundary.test.ts

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | import { beforeEach, describe, expect, it, vi } from 'vitest'; | EXPECTED |
| — |  | 2 | import { NextRequest, NextResponse } from 'next/server'; | EXPECTED |
| — |  | 3 |  | EXPECTED |
| — |  | 4 | const state = vi.hoisted(() =&gt; ({ authError: null as Response &#124; null, db: vi.fn() })); | EXPECTED |
| — |  | 5 | vi.mock('@/lib/api/withRateLimit', () =&gt; ({ applyRateLimit: async () =&gt; null })); | EXPECTED |
| — |  | 6 | vi.mock('@/lib/devstudio/api-auth', () =&gt; ({ apiRequireDevStudio: async () =&gt; ({ id: 'admin', error: state.authError }) })); | EXPECTED |
| — |  | 7 | vi.mock('@/lib/supabase/admin', () =&gt; ({ requireAdminClient: state.db })); | EXPECTED |
| — |  | 8 | import { POST } from '@/apps/admin/app/api/admin/dev-studio/tasks/[id]/rollback/route'; | EXPECTED |
| — |  | 9 |  | EXPECTED |
| — |  | 10 | beforeEach(() =&gt; { state.authError = null; vi.clearAllMocks(); }); | EXPECTED |
| — |  | 11 | const request = () =&gt; new NextRequest('https://admin.elevateforhumanity.org/api/admin/dev-studio/tasks/task/rollback', { method: 'POST' }); | EXPECTED |
| — |  | 12 | const context = { params: Promise.resolve({ id: 'task' }) }; | EXPECTED |
| — |  | 13 |  | EXPECTED |
| — |  | 14 | describe('Studio task rollback boundary', () =&gt; { | EXPECTED |
| — |  | 15 |   it('never reports restoration or changes task records without a restore implementation', async () =&gt; { | EXPECTED |
| — |  | 16 |     const response = await POST(request(), context); | EXPECTED |
| — |  | 17 |     expect(response.status).toBe(501); | EXPECTED |
| — |  | 18 |     expect(await response.json()).toMatchObject({ code: 'TASK_ROLLBACK_UNAVAILABLE' }); | EXPECTED |
| — |  | 19 |     expect(state.db).not.toHaveBeenCalled(); | EXPECTED |
| — |  | 20 |   }); | EXPECTED |
| — |  | 21 |   it('preserves the authenticated access boundary', async () =&gt; { | EXPECTED |
| — |  | 22 |     state.authError = NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); | EXPECTED |
| — |  | 23 |     expect((await POST(request(), context)).status).toBe(401); | EXPECTED |
| — |  | 24 |     expect(state.db).not.toHaveBeenCalled(); | EXPECTED |
| — |  | 25 |   }); | EXPECTED |
| — |  | 26 | }); | EXPECTED |

## supabase/migrations/20261024183332_course_module_authoring_settings.sql

| Before line | Before content | After line | After content | Verdict |
|---:|---|---:|---|---|
| — |  | 1 | -- Retain manual module authoring settings used by saveCourseModule. | EXPECTED |
| — |  | 2 | -- Learner progression remains in module_completion_rules; lesson compliance | EXPECTED |
| — |  | 3 | -- settings remain in the dedicated course_lessons columns. | EXPECTED |
| — |  | 4 | ALTER TABLE public.course_modules | EXPECTED |
| — |  | 5 |   ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb; | EXPECTED |
| — |  | 6 |  | EXPECTED |
| — |  | 7 | COMMENT ON COLUMN public.course_modules.metadata IS | EXPECTED |
| — |  | 8 |   'Module authoring settings. Does not replace module_completion_rules or lesson compliance fields.'; | EXPECTED |

