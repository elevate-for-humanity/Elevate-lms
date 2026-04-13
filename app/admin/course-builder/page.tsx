'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ProgramBuilderTemplate,
  BuilderModule,
  BuilderLesson,
} from '@/lib/course-builder/schema';

const emptyLesson = (): BuilderLesson => ({
  slug: '', title: '', orderIndex: 0, lessonType: 'reading', durationMinutes: 30,
  learningObjectives: [''], content: {}, quizQuestions: [], competencyChecks: [],
  practicalRequired: false, requiredArtifacts: [], activities: [], isRequired: true,
  generationStatus: 'draft', domainKey: null, hourCategory: null, evidenceType: null,
  deliveryMethod: null, requiresInstructorSignoff: false, instructorRequirement: null,
  minimumSeatTimeMinutes: null, fieldworkEligible: false,
});

const emptyModule = (): BuilderModule => ({
  slug: '', title: '', orderIndex: 0, domainKey: '', targetHours: 1,
  quizRequired: false, practicalRequired: false, lessons: [],
});

const initialState: ProgramBuilderTemplate = {
  title: '', slug: '', credentialTarget: 'INTERNAL', minimumHours: 1,
  requiresFinalExam: false, finalExam: { required: false },
  certificateRequirements: {
    includeHours: true, includeCompetencies: true, includeInstructorVerification: true,
    includeCompletionDate: true, includeVerificationUrl: true, requireAllCriticalCompetencies: false,
  },
  modules: [], status: 'draft',
  regulatory: {
    complianceProfileKey: 'internal_basic', credentialTarget: 'INTERNAL',
    governingBody: null, governingRegion: null, governingStandardVersion: null,
    retentionPolicyDays: null, auditNotes: null,
  },
};

export default function CourseBuilderPage() {
  const [program, setProgram] = useState<ProgramBuilderTemplate>(initialState);
  const [selMod, setSelMod] = useState(0);
  const [selLes, setSelLes] = useState(0);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [complianceProfiles, setComplianceProfiles] = useState<{ key: string; label: string }[]>([]);

  useEffect(() => {
    fetch('/api/admin/course-builder/profiles')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.profiles) setComplianceProfiles(d.profiles.map((p: any) => ({ key: p.key, label: p.label ?? p.key }))); })
      .catch(() => {}); // fall back to hardcoded options if fetch fails
  }, []);

  const mod = program.modules[selMod];
  const les = mod?.lessons?.[selLes];
  const totalMinutes = useMemo(
    () => program.modules.reduce((s, m) => s + m.lessons.reduce((ls, l) => ls + (l.durationMinutes || 0), 0), 0),
    [program],
  );

  const upProg = (p: Partial<ProgramBuilderTemplate>) => setProgram(prev => ({ ...prev, ...p }));
  const upReg = (p: Partial<ProgramBuilderTemplate['regulatory']>) =>
    setProgram(prev => ({ ...prev, regulatory: { ...prev.regulatory, ...p } }));
  const upMod = (i: number, p: Partial<BuilderModule>) =>
    setProgram(prev => ({ ...prev, modules: prev.modules.map((m, mi) => mi === i ? { ...m, ...p } : m) }));
  const upLes = (mi: number, li: number, p: Partial<BuilderLesson>) =>
    setProgram(prev => ({
      ...prev,
      modules: prev.modules.map((m, mIdx) =>
        mIdx !== mi ? m : { ...m, lessons: m.lessons.map((l, lIdx) => lIdx !== li ? l : { ...l, ...p }) },
      ),
    }));

  const addModule = () => {
    const idx = program.modules.length;
    setProgram(prev => ({
      ...prev,
      modules: [...prev.modules, { ...emptyModule(), orderIndex: idx, slug: `module-${idx + 1}`, title: `Module ${idx + 1}` }],
    }));
    setSelMod(idx); setSelLes(0);
  };

  const addLesson = () => {
    if (!mod) return;
    const idx = mod.lessons.length;
    upMod(selMod, { lessons: [...mod.lessons, { ...emptyLesson(), orderIndex: idx, slug: `lesson-${idx + 1}`, title: `Lesson ${idx + 1}` }] });
    setSelLes(idx);
  };

  const runAudit = async () => {
    setBusy(true); setAuditResult(null);
    const res = await fetch('/api/admin/course-builder/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(program),
    });
    const json = await res.json();
    setAuditResult(json.audit ?? json);
    setBusy(false);
  };

  const publish = async () => {
    setBusy(true); setAuditResult(null);
    const res = await fetch('/api/admin/course-builder/publish', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(program),
    });
    setAuditResult(await res.json());
    setBusy(false);
  };

  const inp = 'w-full border rounded px-3 py-2 text-sm';
  const sel = 'w-full border rounded px-3 py-2 text-sm';

  return (
    <div className="p-6 grid grid-cols-12 gap-4 min-h-screen text-sm">

      {/* Module list */}
      <div className="col-span-3 border rounded-2xl p-4 space-y-2">
        <h2 className="font-semibold text-base mb-2">Modules</h2>
        <button className="border rounded px-3 py-1.5 w-full text-xs" onClick={addModule}>+ Add Module</button>
        {program.modules.map((m, i) => (
          <button key={i} onClick={() => { setSelMod(i); setSelLes(0); }}
            className={`w-full text-left border rounded p-2 text-xs ${i === selMod ? 'bg-gray-100 font-medium' : ''}`}>
            <div>{m.title || '(untitled)'}</div>
            <div className="text-gray-500">{m.slug} · {m.lessons.length}L</div>
          </button>
        ))}
      </div>

      {/* Program + module fields */}
      <div className="col-span-4 border rounded-2xl p-4 space-y-2 overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <h2 className="font-semibold text-base">Program</h2>
        <input className={inp} placeholder="Title" value={program.title} onChange={e => upProg({ title: e.target.value })} />
        <input className={inp} placeholder="Slug" value={program.slug} onChange={e => upProg({ slug: e.target.value })} />
        <input className={inp} type="number" placeholder="Min hours" value={program.minimumHours} onChange={e => upProg({ minimumHours: Number(e.target.value) })} />
        <select className={sel} value={program.credentialTarget} onChange={e => upProg({ credentialTarget: e.target.value as any })}>
          {['INTERNAL','STATE_BOARD','IC&RC','NAADAC','DOL_APPRENTICESHIP','CUSTOM'].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className={sel} value={program.regulatory.complianceProfileKey} onChange={e => upReg({ complianceProfileKey: e.target.value })}>
          {(complianceProfiles.length > 0
            ? complianceProfiles
            : [
                { key: 'internal_basic', label: 'Internal Basic' },
                { key: 'state_board_strict', label: 'State Board Strict' },
                { key: 'dol_apprenticeship', label: 'DOL Apprenticeship' },
                { key: 'icrc_peer_recovery', label: 'IC&RC Peer Recovery' },
                { key: 'naadac_peer_support', label: 'NAADAC Peer Support' },
                { key: 'custom_regulated', label: 'Custom Regulated' },
              ]
          ).map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        <input className={inp} placeholder="Governing body" value={program.regulatory.governingBody ?? ''}
          onChange={e => upReg({ governingBody: e.target.value || null })} />
        <input className={inp} type="number" placeholder="Retention policy days" value={program.regulatory.retentionPolicyDays ?? ''}
          onChange={e => upReg({ retentionPolicyDays: e.target.value ? Number(e.target.value) : null })} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={program.requiresFinalExam}
            onChange={e => upProg({ requiresFinalExam: e.target.checked, finalExam: { ...program.finalExam, required: e.target.checked } })} />
          Requires final exam
        </label>
        {program.requiresFinalExam && (
          <input className={inp} type="number" placeholder="Final exam passing score" value={program.finalExam.passingScore ?? ''}
            onChange={e => upProg({ finalExam: { ...program.finalExam, passingScore: Number(e.target.value) } })} />
        )}

        {mod && (
          <div className="pt-3 border-t space-y-2">
            <h3 className="font-semibold">Module</h3>
            <input className={inp} placeholder="Title" value={mod.title} onChange={e => upMod(selMod, { title: e.target.value })} />
            <input className={inp} placeholder="Slug" value={mod.slug} onChange={e => upMod(selMod, { slug: e.target.value })} />
            <input className={inp} placeholder="Domain key" value={mod.domainKey} onChange={e => upMod(selMod, { domainKey: e.target.value })} />
            <input className={inp} type="number" placeholder="Target hours" value={mod.targetHours} onChange={e => upMod(selMod, { targetHours: Number(e.target.value) })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={mod.quizRequired} onChange={e => upMod(selMod, { quizRequired: e.target.checked })} /> Quiz required</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={mod.practicalRequired} onChange={e => upMod(selMod, { practicalRequired: e.target.checked })} /> Practical required</label>
            <button className="border rounded px-3 py-1.5 w-full text-xs" onClick={addLesson}>+ Add Lesson</button>
            {mod.lessons.map((l, i) => (
              <button key={i} onClick={() => setSelLes(i)}
                className={`w-full text-left border rounded p-2 text-xs ${i === selLes ? 'bg-gray-100 font-medium' : ''}`}>
                <div>{l.title || '(untitled)'}</div>
                <div className="text-gray-500">{l.lessonType} · {l.durationMinutes}min</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lesson editor */}
      <div className="col-span-5 border rounded-2xl p-4 space-y-2 overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <h2 className="font-semibold text-base">Lesson</h2>
        {les ? (
          <>
            <input className={inp} placeholder="Title" value={les.title} onChange={e => upLes(selMod, selLes, { title: e.target.value })} />
            <input className={inp} placeholder="Slug" value={les.slug} onChange={e => upLes(selMod, selLes, { slug: e.target.value })} />
            <select className={sel} value={les.lessonType} onChange={e => upLes(selMod, selLes, { lessonType: e.target.value as any })}>
              {['video','reading','quiz','assignment','practical','checkpoint','exam','live_session','fieldwork','observation'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input className={inp} type="number" placeholder="Duration (min)" value={les.durationMinutes} onChange={e => upLes(selMod, selLes, { durationMinutes: Number(e.target.value) })} />
            <textarea className={`${inp} min-h-[80px]`} placeholder="One objective per line"
              value={les.learningObjectives.join('\n')}
              onChange={e => upLes(selMod, selLes, { learningObjectives: e.target.value.split('\n').map(x => x.trim()).filter(Boolean) })} />

            <select className={sel} value={les.domainKey ?? ''} onChange={e => upLes(selMod, selLes, { domainKey: e.target.value || null })}>
              <option value="">Domain key</option>
              {['advocacy','ethical_responsibility','mentoring_education','recovery_wellness_support','harm_reduction',
                'infection_control','haircutting','shaving','chemical_services','consultation'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className={sel} value={les.hourCategory ?? ''} onChange={e => upLes(selMod, selLes, { hourCategory: (e.target.value || null) as any })}>
              <option value="">Hour category</option>
              {['didactic','practical','clinical','fieldwork','observation','supervision','self_study','exam'].map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <select className={sel} value={les.evidenceType ?? ''} onChange={e => upLes(selMod, selLes, { evidenceType: (e.target.value || null) as any })}>
              <option value="">Evidence type</option>
              {['quiz','upload','video','audio','checklist','observation','attestation','exam','reflection'].map(ev => <option key={ev} value={ev}>{ev}</option>)}
            </select>
            <select className={sel} value={les.deliveryMethod ?? ''} onChange={e => upLes(selMod, selLes, { deliveryMethod: (e.target.value || null) as any })}>
              <option value="">Delivery method</option>
              {['online_async','online_live','in_person','hybrid','field_based'].map(dm => <option key={dm} value={dm}>{dm}</option>)}
            </select>

            <label className="flex items-center gap-2"><input type="checkbox" checked={!!les.practicalRequired} onChange={e => upLes(selMod, selLes, { practicalRequired: e.target.checked })} /> Practical required</label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!les.requiresInstructorSignoff}
                onChange={e => upLes(selMod, selLes, {
                  requiresInstructorSignoff: e.target.checked,
                  instructorRequirement: e.target.checked ? { required: true, approvalAuthority: 'lesson', supervisionMethod: 'observation', roleTypes: ['instructor'] } : null,
                })} />
              Instructor signoff
            </label>

            <div className="flex gap-2 pt-2">
              <button className="border rounded px-4 py-2 flex-1" onClick={runAudit} disabled={busy}>{busy ? '…' : 'Audit'}</button>
              <button className="border rounded px-4 py-2 flex-1 bg-black text-white disabled:opacity-40" onClick={publish} disabled={busy}>{busy ? '…' : 'Publish'}</button>
            </div>
            <div className="text-xs text-gray-500">Total: {(totalMinutes / 60).toFixed(2)}h</div>
          </>
        ) : (
          <div className="text-gray-400">Select or add a lesson.</div>
        )}

        {auditResult && (
          <pre className="mt-4 border rounded p-3 text-xs overflow-auto bg-gray-50" style={{ maxHeight: '400px' }}>
            {JSON.stringify(auditResult, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
