// lib/courses/hvac-content-builder.ts
// Generates rich lesson HTML from course definition metadata.
// Used by the public API fallback when Supabase has only placeholder content.

import { COURSE_DEFINITIONS } from './definitions';
import type { CourseModule, CourseLesson } from './definitions';

const HVAC_DEF = COURSE_DEFINITIONS.find(c => c.slug === 'hvac-technician')!;

/** Build a reverse map: lesson ID → { module, lessonIndex } */
function buildLessonModuleMap() {
  const map: Record<string, { module: CourseModule; lessonIndex: number }> = {};
  for (const mod of HVAC_DEF.modules) {
    mod.lessons.forEach((lesson, i) => {
      map[lesson.id] = { module: mod, lessonIndex: i };
    });
  }
  return map;
}

const LESSON_MODULE_MAP = buildLessonModuleMap();

/**
 * Generate rich HTML content for a lesson based on its type and metadata.
 */
export function buildLessonContent(lessonId: string): string {
  const entry = LESSON_MODULE_MAP[lessonId];
  if (!entry) return '<p>Lesson content not found.</p>';

  const { module: mod } = entry;
  const lesson = mod.lessons.find(l => l.id === lessonId)!;
  const weekNum = mod.weekAssignment?.week;

  switch (lesson.type) {
    case 'quiz':
      return buildQuizContent(lesson, mod);
    case 'lab':
      return buildLabContent(lesson, mod);
    case 'reading':
      return buildReadingContent(lesson, mod, weekNum);
    case 'assignment':
      return buildAssignmentContent(lesson, mod);
    case 'video':
    default:
      return buildVideoLessonContent(lesson, mod, weekNum);
  }
}

function buildVideoLessonContent(lesson: CourseLesson, mod: CourseModule, week?: number): string {
  const objectives = mod.competencyObjectives
    ?.filter(co => lesson.assessesObjectives?.includes(co.id) || true)
    .slice(0, 4) || [];

  const credBadge = mod.competencyObjectives?.find(co => co.credentialAlignment)?.credentialAlignment;

  return `
<div class="lesson-content">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); color: white; padding: 2rem; border-radius: 1rem; margin-bottom: 2rem;">
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
      ${week ? `<span style="background: #dc2626; color: white; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px;">WEEK ${week}</span>` : ''}
      ${credBadge ? `<span style="background: rgba(255,255,255,0.15); color: white; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px;">${credBadge}</span>` : ''}
    </div>
    <h1 style="font-size: 1.75rem; font-weight: 800; margin: 0 0 0.5rem 0; line-height: 1.2;">${lesson.title}</h1>
    <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem; margin: 0;">${mod.title}</p>
    ${lesson.durationMinutes ? `<p style="color: rgba(255,255,255,0.5); font-size: 0.8rem; margin-top: 0.5rem;">⏱ ${lesson.durationMinutes} minutes</p>` : ''}
  </div>

  <h2>Lesson Overview</h2>
  <p>${lesson.description}</p>

  ${objectives.length > 0 ? `
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem 0;">🎯 Learning Objectives</h3>
    <ul style="margin: 0; padding-left: 1.25rem;">
      ${mod.objectives.map(obj => `<li style="margin-bottom: 0.5rem; color: #475569; line-height: 1.6;">${obj}</li>`).join('')}
    </ul>
  </div>` : ''}

  ${mod.competencyObjectives && mod.competencyObjectives.length > 0 ? `
  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #991b1b; margin: 0 0 1rem 0;">📋 Competency Standards</h3>
    <ul style="margin: 0; padding-left: 1.25rem;">
      ${mod.competencyObjectives.map(co => `<li style="margin-bottom: 0.5rem; color: #7f1d1d; line-height: 1.6;">${co.statement}${co.standard ? ` <strong>(${co.standard})</strong>` : ''}</li>`).join('')}
    </ul>
  </div>` : ''}

  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #1e40af; margin: 0 0 0.5rem 0;">📝 Instructions</h3>
    <p style="color: #1e3a5f; margin: 0; line-height: 1.6;">Watch the full video lesson. Take notes on key concepts — you will be tested on this material in the module quiz. Pay attention to specific numbers, procedures, and safety requirements.</p>
  </div>

  ${buildModuleLessonList(mod, lesson.id)}
</div>`;
}

function buildReadingContent(lesson: CourseLesson, mod: CourseModule, week?: number): string {
  const credBadge = mod.competencyObjectives?.find(co => co.credentialAlignment)?.credentialAlignment;

  return `
<div class="lesson-content">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); color: white; padding: 2rem; border-radius: 1rem; margin-bottom: 2rem;">
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
      <span style="background: #2563eb; color: white; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px;">📖 READING</span>
      ${week ? `<span style="background: rgba(255,255,255,0.15); color: white; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px;">WEEK ${week}</span>` : ''}
      ${credBadge ? `<span style="background: rgba(255,255,255,0.15); color: white; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px;">${credBadge}</span>` : ''}
    </div>
    <h1 style="font-size: 1.75rem; font-weight: 800; margin: 0 0 0.5rem 0; line-height: 1.2;">${lesson.title}</h1>
    <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem; margin: 0;">${mod.title}</p>
  </div>

  <h2>Reading Material</h2>
  <p style="font-size: 1.05rem; line-height: 1.8; color: #334155;">${lesson.description}</p>

  ${mod.objectives.length > 0 ? `
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem 0;">🎯 What You'll Learn</h3>
    <ul style="margin: 0; padding-left: 1.25rem;">
      ${mod.objectives.map(obj => `<li style="margin-bottom: 0.5rem; color: #475569; line-height: 1.6;">${obj}</li>`).join('')}
    </ul>
  </div>` : ''}

  ${mod.competencyObjectives && mod.competencyObjectives.length > 0 ? `
  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #991b1b; margin: 0 0 1rem 0;">📋 Competency Standards</h3>
    <ul style="margin: 0; padding-left: 1.25rem;">
      ${mod.competencyObjectives.map(co => `<li style="margin-bottom: 0.5rem; color: #7f1d1d; line-height: 1.6;">${co.statement}${co.standard ? ` <strong>(${co.standard})</strong>` : ''}</li>`).join('')}
    </ul>
  </div>` : ''}

  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #166534; margin: 0 0 0.5rem 0;">📝 Study Tips</h3>
    <p style="color: #15803d; margin: 0; line-height: 1.6;">Read the material thoroughly and take notes on key terms, numbers, and procedures. This content will appear on your module quiz and may be tested on the EPA 608 certification exam. Highlight anything you don't understand and review it before the quiz.</p>
  </div>

  ${buildModuleLessonList(mod, lesson.id)}
</div>`;
}

function buildQuizContent(lesson: CourseLesson, mod: CourseModule): string {
  const passThreshold = lesson.passThreshold || 70;
  const credBadge = mod.competencyObjectives?.find(co => co.credentialAlignment)?.credentialAlignment;

  return `
<div class="lesson-content">
  <div style="background: linear-gradient(135deg, #7c2d12 0%, #451a03 100%); color: white; padding: 2rem; border-radius: 1rem; margin-bottom: 2rem;">
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
      <span style="background: #dc2626; color: white; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px;">📝 ASSESSMENT</span>
      ${credBadge ? `<span style="background: rgba(255,255,255,0.15); color: white; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px;">${credBadge}</span>` : ''}
    </div>
    <h1 style="font-size: 1.75rem; font-weight: 800; margin: 0 0 0.5rem 0; line-height: 1.2;">${lesson.title}</h1>
    <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem; margin: 0;">${mod.title}</p>
  </div>

  <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #92400e; margin: 0 0 0.75rem 0;">⚠️ Quiz Instructions</h3>
    <ul style="margin: 0; padding-left: 1.25rem; color: #78350f;">
      <li style="margin-bottom: 0.5rem;">Read each question carefully before selecting your answer</li>
      <li style="margin-bottom: 0.5rem;">You need <strong>${passThreshold}%</strong> to pass this assessment</li>
      <li style="margin-bottom: 0.5rem;">You can retry if you don't pass on the first attempt</li>
      <li style="margin-bottom: 0.5rem;">Review the explanation after each question to reinforce learning</li>
      ${lesson.durationMinutes ? `<li>Time limit: <strong>${lesson.durationMinutes} minutes</strong></li>` : ''}
    </ul>
  </div>

  <p style="color: #475569; line-height: 1.6;">${lesson.description}</p>

  ${lesson.assessesObjectives && lesson.assessesObjectives.length > 0 ? `
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem 0;">This quiz assesses:</h3>
    <ul style="margin: 0; padding-left: 1.25rem;">
      ${mod.competencyObjectives
        ?.filter(co => lesson.assessesObjectives?.includes(co.id))
        .map(co => `<li style="margin-bottom: 0.5rem; color: #475569;">${co.statement}</li>`)
        .join('') || ''}
    </ul>
  </div>` : ''}
</div>`;
}

function buildLabContent(lesson: CourseLesson, mod: CourseModule): string {
  return `
<div class="lesson-content">
  <div style="background: linear-gradient(135deg, #065f46 0%, #064e3b 100%); color: white; padding: 2rem; border-radius: 1rem; margin-bottom: 2rem;">
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
      <span style="background: #059669; color: white; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px;">🔧 HANDS-ON LAB</span>
    </div>
    <h1 style="font-size: 1.75rem; font-weight: 800; margin: 0 0 0.5rem 0; line-height: 1.2;">${lesson.title}</h1>
    <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem; margin: 0;">${mod.title}</p>
    ${lesson.durationMinutes ? `<p style="color: rgba(255,255,255,0.5); font-size: 0.8rem; margin-top: 0.5rem;">⏱ ${lesson.durationMinutes} minutes</p>` : ''}
  </div>

  <h2>Lab Exercise</h2>
  <p style="font-size: 1.05rem; line-height: 1.8; color: #334155;">${lesson.description}</p>

  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #991b1b; margin: 0 0 0.75rem 0;">⚠️ Safety Requirements</h3>
    <ul style="margin: 0; padding-left: 1.25rem; color: #7f1d1d;">
      <li style="margin-bottom: 0.5rem;">This lab must be completed at an approved training facility</li>
      <li style="margin-bottom: 0.5rem;">Instructor supervision is required at all times</li>
      <li style="margin-bottom: 0.5rem;">Wear required PPE: safety glasses, gloves, closed-toe shoes</li>
      <li style="margin-bottom: 0.5rem;">Follow all lockout/tagout procedures before working on equipment</li>
    </ul>
  </div>

  ${lesson.assessesObjectives && lesson.assessesObjectives.length > 0 ? `
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #166534; margin: 0 0 1rem 0;">✅ Competencies Assessed</h3>
    <ul style="margin: 0; padding-left: 1.25rem;">
      ${mod.competencyObjectives
        ?.filter(co => lesson.assessesObjectives?.includes(co.id))
        .map(co => `<li style="margin-bottom: 0.5rem; color: #15803d;">${co.statement}${co.standard ? ` — <strong>${co.standard}</strong>` : ''}</li>`)
        .join('') || ''}
    </ul>
  </div>` : ''}

  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #1e40af; margin: 0 0 0.5rem 0;">📋 Completion</h3>
    <p style="color: #1e3a5f; margin: 0; line-height: 1.6;">Demonstrate competency to your instructor to receive credit for this lab. Your instructor will evaluate your technique, safety compliance, and results against the competency standards listed above.</p>
  </div>
</div>`;
}

function buildAssignmentContent(lesson: CourseLesson, mod: CourseModule): string {
  return `
<div class="lesson-content">
  <div style="background: linear-gradient(135deg, #4338ca 0%, #312e81 100%); color: white; padding: 2rem; border-radius: 1rem; margin-bottom: 2rem;">
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
      <span style="background: #6366f1; color: white; font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 9999px;">📋 ASSIGNMENT</span>
    </div>
    <h1 style="font-size: 1.75rem; font-weight: 800; margin: 0 0 0.5rem 0; line-height: 1.2;">${lesson.title}</h1>
    <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem; margin: 0;">${mod.title}</p>
  </div>

  <h2>Assignment</h2>
  <p style="font-size: 1.05rem; line-height: 1.8; color: #334155;">${lesson.description}</p>

  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #1e40af; margin: 0 0 0.5rem 0;">📝 Submission</h3>
    <p style="color: #1e3a5f; margin: 0; line-height: 1.6;">Complete the assignment and submit for instructor review. Mark as complete when finished.</p>
  </div>
</div>`;
}

/** Builds a "Module Lessons" sidebar showing all lessons in the module */
function buildModuleLessonList(mod: CourseModule, currentLessonId: string): string {
  const typeEmoji: Record<string, string> = {
    video: '🎬', reading: '📖', quiz: '📝', lab: '🔧', assignment: '📋',
  };

  return `
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; margin-top: 2rem;">
    <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem 0;">📚 Module: ${mod.title}</h3>
    <ol style="margin: 0; padding-left: 1.25rem;">
      ${mod.lessons.map(l => {
        const isCurrent = l.id === currentLessonId;
        const emoji = typeEmoji[l.type] || '📄';
        return `<li style="margin-bottom: 0.5rem; color: ${isCurrent ? '#dc2626' : '#475569'}; font-weight: ${isCurrent ? '700' : '400'}; line-height: 1.5;">
          ${emoji} ${l.title}${isCurrent ? ' ← You are here' : ''}${l.durationMinutes ? ` <span style="color: #94a3b8; font-size: 0.8rem;">(${l.durationMinutes} min)</span>` : ''}
        </li>`;
      }).join('')}
    </ol>
  </div>`;
}

/**
 * Get content for all HVAC lessons as a map: lessonId → HTML
 */
export function getAllLessonContent(): Record<string, string> {
  const content: Record<string, string> = {};
  for (const mod of HVAC_DEF.modules) {
    for (const lesson of mod.lessons) {
      content[lesson.id] = buildLessonContent(lesson.id);
    }
  }
  return content;
}

/**
 * Check if a lesson's DB content is just a placeholder (one-line HTML)
 */
export function isPlaceholderContent(html: string | null | undefined): boolean {
  if (!html) return true;
  // Placeholder content is typically < 200 chars and has generic patterns
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped.length < 150;
}
