/**
 * scripts/backfill-hvac-script-text.ts
 *
 * Backfills curriculum_lessons.script_text for all 95 HVAC lessons
 * using HVAC_LESSON_CONTENT + HVAC_LESSON_NUMBER_TO_DEF_ID as the source.
 *
 * Safe to re-run — only updates rows where script_text is NULL or empty.
 * Pass --force to overwrite all rows regardless.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-hvac-script-text.ts
 *   pnpm tsx scripts/backfill-hvac-script-text.ts --force
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { HVAC_LESSON_CONTENT, type LessonContent } from '../lib/courses/hvac-lesson-content';
import { HVAC_LESSON_NUMBER_TO_DEF_ID } from '../lib/courses/hvac-lesson-number-map';

/** Build HTML from a LessonContent object (not from COURSE_DEFINITIONS). */
function buildHtmlFromContent(c: LessonContent): string {
  const keyTermsHtml = c.keyTerms?.length
    ? `<h3>Key Terms</h3><dl>${c.keyTerms.map(k =>
        `<dt>${k.term}</dt><dd>${k.definition}</dd>`).join('')}</dl>`
    : '';

  const watchForHtml = c.watchFor?.length
    ? `<h3>Watch For</h3><ul>${c.watchFor.map(w => `<li>${w}</li>`).join('')}</ul>`
    : '';

  const jobHtml = c.jobApplication
    ? `<h3>Job Application</h3><p>${c.jobApplication}</p>`
    : '';

  return `<div class="lesson-content">
<p>${c.concept}</p>
${keyTermsHtml}
${jobHtml}
${watchForHtml}
</div>`.trim();
}

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PROGRAM_ID = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';
const FORCE = process.argv.includes('--force');

async function main() {
  console.log(`Backfilling HVAC script_text${FORCE ? ' (force mode)' : ' (empty only)'}...\n`);

  const { data: lessons, error } = await db
    .from('curriculum_lessons')
    .select('id, lesson_slug, lesson_title, lesson_order, script_text')
    .eq('program_id', PROGRAM_ID)
    .order('lesson_order');

  if (error) { console.error('Fetch failed:', error.message); process.exit(1); }
  if (!lessons?.length) { console.error('No curriculum lessons found.'); process.exit(1); }

  console.log(`Found ${lessons.length} lessons.\n`);

  // Inline content for lessons 92-95 which have no entry in HVAC_LESSON_CONTENT
  const INLINE_CONTENT: Record<string, string> = {
    'hvac-lesson-92': `<h2>Employer Partner Introductions</h2>
<p>Elevate for Humanity maintains active partnerships with HVAC employers across the Indianapolis metro area. These companies have committed to interviewing program graduates and offering apprentice positions to qualified candidates.</p>
<h3>What Employer Partners Provide</h3>
<ul>
<li>Entry-level apprentice positions starting at $18–$22/hr</li>
<li>On-the-job training hours toward journeyman licensure</li>
<li>Mentorship from licensed technicians</li>
<li>Benefits including health insurance and tool allowances at many companies</li>
</ul>
<h3>How to Prepare for Employer Introductions</h3>
<p>Your resume should be complete before this session. Dress professionally. Bring copies of your certifications — EPA 608, OSHA 10, and CPR/AED cards. Employers are evaluating your professionalism and attitude as much as your technical knowledge.</p>
<h3>Key Terms</h3>
<dl>
<dt>Apprentice</dt><dd>Entry-level technician working under a licensed journeyman, accumulating on-the-job hours toward licensure.</dd>
<dt>Journeyman</dt><dd>Licensed technician who has completed required OJT hours and passed the state licensing exam.</dd>
<dt>OJT</dt><dd>On-the-Job Training — documented work hours required for licensure, typically 2,000–8,000 hours depending on state.</dd>
</dl>`,

    'hvac-lesson-93': `<h2>OJT Internship Orientation</h2>
<p>Your on-the-job training (OJT) internship is where classroom knowledge becomes field competency. This lesson covers what to expect in your first weeks on the job, how to document your hours, and how to build a professional reputation quickly.</p>
<h3>First 30 Days on the Job</h3>
<ul>
<li>Arrive early, stay late — your work ethic is your first impression</li>
<li>Ask questions, but attempt the task first</li>
<li>Keep your tools organized and your van clean</li>
<li>Document every job: equipment model, serial number, work performed, parts used</li>
<li>Never work on equipment you are not trained on without supervision</li>
</ul>
<h3>Documenting OJT Hours</h3>
<p>Indiana requires documented OJT hours for journeyman licensure. Keep a log of every job you work, signed by your supervising journeyman. Your employer may have a system — use it. If not, use a simple spreadsheet: date, job type, hours, supervisor signature.</p>
<h3>Key Terms</h3>
<dl>
<dt>OJT Log</dt><dd>Documentation of on-the-job training hours, required for licensure applications.</dd>
<dt>Supervising Journeyman</dt><dd>Licensed technician responsible for overseeing and signing off on apprentice work.</dd>
<dt>Callback Rate</dt><dd>Percentage of jobs requiring a return visit to fix the same problem — a key quality metric employers track.</dd>
</dl>`,

    'hvac-lesson-94': `<h2>Program Completion Checklist</h2>
<p>Before you leave this program, verify that every credential and document is in order. Missing paperwork after graduation is harder to fix than before.</p>
<h3>Credentials to Verify</h3>
<ul>
<li><strong>EPA 608 Universal</strong> — Certificate from ESCO Group or equivalent proctor. Verify your name is spelled correctly.</li>
<li><strong>OSHA 10</strong> — DOL wallet card mailed within 2–4 weeks of exam completion. Confirm your mailing address is current.</li>
<li><strong>CPR/AED/First Aid</strong> — Card from American Red Cross or American Heart Association. Check expiration date (2 years).</li>
<li><strong>Program Completion Certificate</strong> — Issued by Elevate for Humanity. Required for WIOA closeout.</li>
</ul>
<h3>Documents to Collect</h3>
<ul>
<li>Unofficial transcript or training record from Elevate</li>
<li>WIOA closeout paperwork signed by your case manager</li>
<li>Reference letters from instructors if requested</li>
<li>OJT log if you completed an internship</li>
</ul>
<h3>Next Steps After Graduation</h3>
<p>Register with the Indiana Professional Licensing Agency (IPLA) to begin tracking your journeyman hours. Connect with your employer partner contact within 48 hours of graduation. Update your resume with all new credentials.</p>`,

    'hvac-lesson-95': `<h2>Career Readiness Quiz</h2>
<p>This final checkpoint covers career readiness, professional conduct, credential documentation, and the pathway from apprentice to journeyman technician. Review the following before taking the quiz.</p>
<h3>Key Review Points</h3>
<ul>
<li>Starting wages for EPA 608 certified HVAC apprentices: $18–$22/hr in Indianapolis</li>
<li>Journeyman technician wages: $22–$35/hr</li>
<li>OJT hours required for Indiana journeyman license: varies by jurisdiction, typically 2,000–4,000 hours</li>
<li>EPA 608 Universal certification is federally required to purchase or handle refrigerants</li>
<li>OSHA 10 DOL card is required by most HVAC employers before field work</li>
<li>CPR/AED certification is required for most employer partner positions</li>
<li>Callback rate, punctuality, and documentation quality are the top three things employers evaluate in the first 90 days</li>
</ul>
<h3>Professional Standards</h3>
<p>HVAC technicians enter customers' homes and businesses. Your professionalism — appearance, communication, and respect for property — directly affects your employer's reputation and your own advancement. Technicians who build trust with customers get promoted faster and earn more referrals.</p>`,
  };

  let updated = 0;
  let skipped = 0;
  const missing: string[] = [];

  for (const lesson of lessons) {
    // Skip if already has content and not forcing
    if (!FORCE && lesson.script_text && lesson.script_text.trim().length > 100) {
      skipped++;
      continue;
    }

    // Resolve defId: first by lesson_order number map, then by slug direct match
    const lessonNum = lesson.lesson_order;
    const defId =
      HVAC_LESSON_NUMBER_TO_DEF_ID[lessonNum] ??
      lesson.lesson_slug;

    // Check inline content first (lessons 92-95), then HVAC_LESSON_CONTENT
    const inlineHtml = INLINE_CONTENT[lesson.lesson_slug];
    const contentDef = HVAC_LESSON_CONTENT[defId];

    if (!inlineHtml && !contentDef) {
      missing.push(`${lesson.lesson_slug} (order=${lessonNum}, defId=${defId})`);
      continue;
    }

    const html = inlineHtml ?? buildHtmlFromContent(contentDef!);

    const { error: updateError } = await db
      .from('curriculum_lessons')
      .update({ script_text: html })
      .eq('id', lesson.id);

    if (updateError) {
      console.error(`Failed: ${lesson.lesson_slug}: ${updateError.message}`);
      process.exit(1);
    }

    console.log(`  ✅ ${lesson.lesson_slug.padEnd(25)} [${defId}] ${lesson.lesson_title?.slice(0, 45)}`);
    updated++;
  }

  console.log(`\nUpdated: ${updated}  Skipped (already had content): ${skipped}`);

  if (missing.length) {
    console.error(`\n❌ No content definition found for ${missing.length} lessons:`);
    missing.forEach(m => console.error(`  - ${m}`));
    process.exit(1);
  }

  console.log('\n✅ Backfill complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
