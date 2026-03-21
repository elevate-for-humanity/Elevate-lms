/**
 * PRS curriculum seed — Peer Recovery Specialist (JRI)
 *
 * Reads lesson definitions from lms-data/courses/program-peer-recovery.ts
 * and writes them into curriculum_lessons + curriculum_quizzes via
 * CurriculumGenerator.
 *
 * Domain mapping (IN-PRS credential, 5 domains):
 *   recovery_support    — mod-1 (Introduction), mod-3 (Recovery/Wellness), mod-4 (Peer Skills)
 *   ethics_boundaries   — mod-2 (Ethics)
 *   advocacy_navigation — mod-5 (Advocacy), mod-6 (Resource Navigation)
 *   crisis_intervention — mod-7 (Crisis Support)
 *   documentation       — mod-8 (Certification Prep)
 *
 * Run:
 *   npx tsx scripts/seed-prs-curriculum.ts
 *   npx tsx scripts/seed-prs-curriculum.ts --force   (overwrite existing)
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { CurriculumGenerator } from '../lib/services/curriculum-generator';
import type { QuizDef } from '../lib/services/curriculum-generator';
import { peerRecoveryCourse } from '../lms-data/courses/program-peer-recovery';

// PRS_PROGRAM_ID is the canonical UUID for the peer-recovery-specialist-jri program.
// PRS_CREDENTIAL_ID is the credential row UUID for the IN-PRS credential.
// course_id is resolved at runtime from the courses table — not hardcoded.
const PRS_PROGRAM_ID    = 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d';
const PRS_CREDENTIAL_ID = '00000000-0000-0000-0000-000000000109';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const MODULE_DOMAIN_MAP: Record<string, string> = {
  'peer-mod-1': 'recovery_support',
  'peer-mod-2': 'ethics_boundaries',
  'peer-mod-3': 'recovery_support',
  'peer-mod-4': 'recovery_support',
  'peer-mod-5': 'advocacy_navigation',
  'peer-mod-6': 'advocacy_navigation',
  'peer-mod-7': 'crisis_intervention',
  'peer-mod-8': 'documentation',
};

// Real quiz questions keyed by lesson id.
// Aligned to the IN-PRS exam blueprint domains.
const QUIZ_QUESTIONS: Record<string, Omit<QuizDef, 'quizOrder'>[]> = {
  'peer-1-5': [
    {
      question: 'What is the primary role of a Peer Recovery Specialist?',
      options: ['To provide clinical therapy and diagnosis', 'To share lived experience and support others in recovery', 'To prescribe medication-assisted treatment', 'To conduct intake assessments'],
      correctAnswer: 1,
      explanation: 'Peer Recovery Specialists draw on lived experience to support others, not to provide clinical services.',
    },
    {
      question: 'Which best describes the peer support model?',
      options: ['A hierarchical relationship where the specialist directs the client', 'A mutual relationship built on shared experience and empathy', 'A clinical relationship focused on symptom reduction', 'A supervisory relationship focused on compliance'],
      correctAnswer: 1,
      explanation: 'Peer support is built on mutuality and shared experience.',
    },
    {
      question: 'The peer recovery movement grew primarily from:',
      options: ['Federal government mandates in the 1970s', 'Grassroots advocacy by people with lived experience', 'Academic research on cognitive behavioral therapy', 'Insurance industry cost-reduction requirements'],
      correctAnswer: 1,
      explanation: 'The movement emerged from grassroots advocacy by individuals with lived experience.',
    },
  ],
  'peer-2-5': [
    {
      question: 'A peer specialist learns a client is involved in illegal activity with no immediate danger. The most appropriate response is:',
      options: ['Report to law enforcement immediately', 'Ignore it to maintain the relationship', 'Consult a supervisor and follow agency policy', 'Terminate services immediately'],
      correctAnswer: 2,
      explanation: 'Peer specialists consult supervisors and follow agency policy when facing ethical dilemmas.',
    },
    {
      question: 'Which is an example of a dual relationship?',
      options: ['Referring a client to a community resource', 'Attending the same recovery group as a client you serve', 'Documenting a client\'s progress', 'Conducting a needs assessment'],
      correctAnswer: 1,
      explanation: 'A dual relationship occurs when the specialist has a second role with a client outside the professional relationship.',
    },
    {
      question: 'Under HIPAA, a peer specialist may share client health information without consent when:',
      options: ['The client\'s family requests it', 'There is an imminent threat to the safety of the client or others', 'Another agency asks to coordinate services', 'The information is more than 5 years old'],
      correctAnswer: 1,
      explanation: 'HIPAA permits disclosure without consent when there is a serious and imminent threat to health or safety.',
    },
  ],
  'peer-3-5': [
    {
      question: 'In the Stages of Change model, a person in "contemplation" is:',
      options: ['Not yet aware they have a problem', 'Aware of the problem and beginning to consider change', 'Actively making changes', 'Maintaining changes made over the past six months'],
      correctAnswer: 1,
      explanation: 'Contemplation is recognizing a problem and considering change without yet committing to action.',
    },
    {
      question: 'Which wellness dimension is most directly addressed by helping a client build a daily routine?',
      options: ['Intellectual wellness', 'Occupational wellness', 'Physical wellness', 'Emotional wellness'],
      correctAnswer: 2,
      explanation: 'Daily routines support physical wellness through consistent sleep, nutrition, and activity.',
    },
    {
      question: 'A relapse prevention plan should primarily focus on:',
      options: ['Identifying triggers and developing coping strategies before a crisis', 'Documenting past relapses for clinical records', 'Restricting the client\'s social activities', 'Increasing medication dosage during high-risk periods'],
      correctAnswer: 0,
      explanation: 'Effective relapse prevention is proactive — building coping strategies before high-risk situations arise.',
    },
  ],
  'peer-4-5': [
    {
      question: 'Motivational Interviewing is best described as:',
      options: ['A confrontational technique to break through denial', 'A collaborative conversation style that strengthens a person\'s own motivation for change', 'A structured curriculum for teaching recovery skills', 'A clinical assessment tool for measuring readiness to change'],
      correctAnswer: 1,
      explanation: 'MI is a collaborative, person-centered approach that elicits and strengthens the individual\'s own motivation.',
    },
    {
      question: 'When sharing your personal recovery story, the most important consideration is:',
      options: ['Sharing every detail to build maximum trust', 'Keeping the focus on the client\'s needs, not your own experience', 'Avoiding any mention of past substance use', 'Only sharing stories with positive outcomes'],
      correctAnswer: 1,
      explanation: 'Intentional self-disclosure keeps the focus on the client. The story is a tool to build connection.',
    },
    {
      question: 'Active listening includes all of the following EXCEPT:',
      options: ['Reflecting back what the client said', 'Maintaining appropriate eye contact', 'Formulating your response while the client is still speaking', 'Asking open-ended questions'],
      correctAnswer: 2,
      explanation: 'Formulating a response while the client speaks is a barrier to active listening.',
    },
  ],
  'peer-5-4': [
    {
      question: 'Systems advocacy in peer recovery work refers to:',
      options: ['Helping an individual navigate a specific agency\'s intake process', 'Working to change policies or systems that create barriers to recovery', 'Documenting a client\'s service utilization for billing', 'Referring clients to legal aid services'],
      correctAnswer: 1,
      explanation: 'Systems advocacy addresses structural barriers at the policy or organizational level.',
    },
    {
      question: 'A client\'s right to self-determination means:',
      options: ['The peer specialist decides what is best for the client', 'The client has the right to make their own choices, even ones the specialist disagrees with', 'The client must follow the clinical team\'s treatment plan', 'The specialist can override client decisions in emergencies'],
      correctAnswer: 1,
      explanation: 'Self-determination is a core recovery value. Peer specialists support client autonomy.',
    },
  ],
  'peer-6-4': [
    {
      question: 'When mapping community resources, the peer specialist should prioritize:',
      options: ['Resources the specialist has personally used', 'Resources that match the client\'s specific needs, eligibility, and preferences', 'The least expensive options available', 'Resources recommended by the clinical supervisor'],
      correctAnswer: 1,
      explanation: 'Resource navigation is person-centered — the match to the client\'s specific situation is the primary consideration.',
    },
    {
      question: 'A client is eligible for SSI but has never applied. The peer specialist\'s role is to:',
      options: ['Complete the application on the client\'s behalf without their involvement', 'Inform the client, explain the process, and support them in applying if they choose to', 'Refer to a social worker and take no further action', 'Advise the client that benefits may interfere with recovery'],
      correctAnswer: 1,
      explanation: 'Peer specialists inform and support — they do not act for the client without consent.',
    },
  ],
  'peer-7-5': [
    {
      question: 'When a client expresses suicidal ideation, the peer specialist\'s first priority is to:',
      options: ['Immediately call 911 without speaking to the client', 'Assess the level of risk and follow the agency\'s crisis protocol', 'Remind the client of their recovery goals', 'End the session and document the conversation'],
      correctAnswer: 1,
      explanation: 'The first step is to assess risk level and follow established crisis protocols.',
    },
    {
      question: 'De-escalation techniques are most effective when the peer specialist:',
      options: ['Speaks loudly and firmly to establish authority', 'Remains calm, uses a low tone, and validates the person\'s feelings', 'Physically positions themselves between the person and the exit', 'Immediately involves law enforcement'],
      correctAnswer: 1,
      explanation: 'Calm presence, validation, and a non-threatening tone are the foundation of effective de-escalation.',
    },
    {
      question: 'A safety plan developed with a client in crisis should include:',
      options: ['Only emergency contact numbers', 'Warning signs, coping strategies, support contacts, and steps to reduce access to means', 'A list of medications the client should take', 'A schedule of mandatory check-in appointments'],
      correctAnswer: 1,
      explanation: 'A comprehensive safety plan addresses warning signs, coping strategies, social supports, professional contacts, and means restriction.',
    },
  ],
  'peer-8-3': [
    {
      question: 'The most important principle of accurate documentation is:',
      options: ['Recording your personal opinions about the client\'s progress', 'Documenting observations and client statements factually and in a timely manner', 'Summarizing multiple sessions in a single note to save time', 'Using clinical terminology to appear professional'],
      correctAnswer: 1,
      explanation: 'Accurate documentation records observable facts and direct client statements, completed promptly.',
    },
    {
      question: 'The Indiana Peer Recovery Specialist certification exam is administered by:',
      options: ['The Indiana Department of Education', 'The Indiana Division of Mental Health and Addiction (DMHA)', 'The National Alliance on Mental Illness (NAMI)', 'SAMHSA'],
      correctAnswer: 1,
      explanation: 'The IN-PRS credential is administered through the Indiana DMHA.',
    },
  ],
  'peer-8-5': [
    {
      question: 'A peer specialist\'s scope of practice is best defined as:',
      options: ['Whatever the client needs, regardless of training', 'The specific activities a peer specialist is trained, authorized, and competent to perform', 'The same as a licensed clinical social worker', 'Determined solely by personal recovery experience'],
      correctAnswer: 1,
      explanation: 'Scope of practice defines role boundaries based on training, certification, and agency authorization.',
    },
    {
      question: 'Which documentation practice best protects both the client and the peer specialist?',
      options: ['Keeping informal notes outside the official record', 'Recording only positive interactions', 'Documenting all significant interactions, decisions, and referrals in the official record', 'Sharing notes with family members to keep them informed'],
      correctAnswer: 2,
      explanation: 'Complete, accurate official documentation creates an accountable record that protects both parties.',
    },
  ],
};

async function main() {
  const mode = process.argv.includes('--force') ? 'force' : 'seed_missing';
  console.log(`Seeding PRS curriculum (mode: ${mode})`);

  // Resolve canonical course_id from the courses table.
  // The courses row is created by 20260504000000_lms_course_canonicalization.sql.
  // If it doesn't exist yet, lessons seed without course_id and the migration
  // backfills it afterward.
  const { data: courseRow } = await supabase
    .from('courses')
    .select('id, title')
    .eq('program_id', PRS_PROGRAM_ID)
    .maybeSingle();

  const courseId = courseRow?.id ?? null;
  if (courseId) {
    console.log(`Linked course: ${courseRow!.title} (${courseId})`);
  } else {
    console.log(`No courses row found for program_id ${PRS_PROGRAM_ID} — lessons will seed without course_id.`);
    console.log(`Apply 20260504000000_lms_course_canonicalization.sql to backfill course_id after seeding.`);
  }

  const gen = new CurriculumGenerator(PRS_PROGRAM_ID, PRS_CREDENTIAL_ID, mode as 'seed_missing' | 'force');
  await gen.loadExistingSlugs();

  for (const [modIndex, mod] of peerRecoveryCourse.modules.entries()) {
    const domainKey = MODULE_DOMAIN_MAP[mod.id];
    if (!domainKey) {
      console.warn(`No domain mapping for module ${mod.id} — skipping`);
      continue;
    }

    await gen.upsertModule({
      slug:        mod.id,
      title:       mod.title,
      description: mod.description,
      orderIndex:  modIndex + 1,
    });

    for (const [lessonIndex, lesson] of mod.lessons.entries()) {
      const lessonSlug    = `${mod.id}-${lesson.id}`;
      const rawQuizzes    = QUIZ_QUESTIONS[lesson.id];
      const quizzes       = rawQuizzes?.map((q, i) => ({ ...q, quizOrder: i }));
      // Module-boundary quiz lessons gate the next module
      const isCheckpoint  = lesson.type === 'quiz';

      await gen.upsertLesson({
        lessonSlug,
        lessonTitle:         lesson.title,
        moduleSlug:          mod.id,
        moduleTitle:         mod.title,
        courseId:            courseId ?? undefined,
        durationMinutes:     lesson.durationMinutes ?? 30,
        lessonOrder:         lessonIndex + 1,
        moduleOrder:         modIndex + 1,
        credentialDomainKey: domainKey,
        stepType:            isCheckpoint ? 'checkpoint' : 'lesson',
        passingScore:        isCheckpoint ? 80 : 0,
        quizzes,
      });
    }
  }

  const summary = gen.summarize();
  console.log('\nSeed complete:');
  console.log(`  modules:  ${summary.modulesUpserted}`);
  console.log(`  lessons:  ${summary.lessonsUpserted} written, ${summary.lessonsSkipped} skipped`);
  console.log(`  quizzes:  ${summary.quizzesUpserted} written`);
  if (summary.errors.length > 0) {
    console.error('\nErrors:');
    summary.errors.forEach(e => console.error(' ', e));
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
