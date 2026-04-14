/**
 * Patch modules 4-5 (lessons 22-33) to Milady-exceeding standard.
 * Expands all lessons from 5 quiz questions to 8+.
 * Run: pnpm tsx --env-file=.env.local scripts/patch-barber-modules4-5.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

// ─── Additional quiz questions for each lesson ────────────────────────────────
// Each lesson already has 5 questions. We merge these in to reach 8+.

const EXTRA_QUESTIONS: Record<string, object[]> = {

  // ── Lesson 22: Head Shape & Sectioning ──────────────────────────────────────
  'barber-lesson-22': [
    {
      id: 'mod4-l22-q6',
      type: 'multiple_choice',
      question: 'A client has a pronounced occipital bone that projects significantly. How does this affect your sectioning plan?',
      options: [
        'No adjustment needed — the occipital bone does not affect sectioning',
        'Set the fade line lower than usual to avoid the projection creating a weight buildup',
        'Set the fade line higher than usual so the projection falls within the blended section, preventing a shelf',
        'Use scissor over comb only — clippers cannot navigate the projection',
      ],
      correctAnswer: 2,
      explanation: 'A pronounced occipital bone creates a natural shelf if the fade line is set below it. Setting the fade line higher so the projection falls within the blended section prevents weight buildup and produces a smooth graduation.',
    },
    {
      id: 'mod4-l22-q7',
      type: 'multiple_choice',
      question: 'Which reference point determines where the fade transitions from the sides to the top?',
      options: [
        'The occipital bone',
        'The apex',
        'The parietal ridge',
        'The temporal recession',
      ],
      correctAnswer: 2,
      explanation: 'The parietal ridge is the widest point of the head and the natural transition point between the sides and the top. Fade lines that cross the parietal ridge require careful blending to avoid a visible shelf.',
    },
    {
      id: 'mod4-l22-q8',
      type: 'multiple_choice',
      question: 'Before beginning any haircut service, which sanitation step must be completed first?',
      options: [
        'Apply disinfectant spray to the client\'s hair',
        'Pre-clean all tools to remove hair and debris, then apply EPA-registered disinfectant',
        'Apply disinfectant directly to tools without pre-cleaning',
        'Sanitize the workstation only — tools are cleaned after the service',
      ],
      correctAnswer: 1,
      explanation: 'Pre-cleaning removes organic matter (hair, skin cells) that blocks disinfectant contact. Disinfectant applied to a dirty surface cannot reach the tool surface and will not achieve the required kill. Pre-clean first, then disinfect.',
    },
  ],

  // ── Lesson 23: The Fade — Low, Mid & High ───────────────────────────────────
  'barber-lesson-23': [
    {
      id: 'mod4-l23-q6',
      type: 'multiple_choice',
      question: 'A client requests a mid fade. Where does the fade line begin?',
      options: [
        'Just above the ear and nape',
        'At the temple, level with the top of the ear',
        'At the parietal ridge',
        'At the occipital bone',
      ],
      correctAnswer: 1,
      explanation: 'A mid fade begins at the temple, level with the top of the ear. This is the most versatile and most-requested fade type. A low fade starts just above the ear; a high fade starts at the parietal ridge.',
    },
    {
      id: 'mod4-l23-q7',
      type: 'multiple_choice',
      question: 'You are executing a skin fade and notice the clipper is leaving track marks near the skin. What is the most likely cause?',
      options: [
        'The blade is set too open — close the taper lever',
        'The blade is dull or misaligned — clean, oil, and check alignment before continuing',
        'The client\'s hair is too coarse for a skin fade',
        'The clipper speed is too high — reduce to a lower setting',
      ],
      correctAnswer: 1,
      explanation: 'Track marks near the skin are the signature of a dull or misaligned blade. A dull blade drags rather than cuts cleanly, leaving visible lines. Clean, oil, and check that the top blade sits 1/16" behind the bottom blade. If the blade is worn, replace it before continuing.',
    },
    {
      id: 'mod4-l23-q8',
      type: 'multiple_choice',
      question: 'After completing a fade, you notice a visible line between the #1.5 and #2 guard sections. What is the correct correction technique?',
      options: [
        'Take the entire #2 section shorter to match the #1.5',
        'Use the open-lever technique with the #1.5 guard at the boundary, blending with a flicking motion',
        'Apply thinning shears across the line to soften it',
        'The line will disappear when the hair dries — no correction needed',
      ],
      correctAnswer: 1,
      explanation: 'A visible line between guard sizes means no blending pass was made at the transition. The correction is to use the open-lever technique with the smaller guard at the boundary, blending with a flicking motion upward through the transition zone. This creates a gradual graduation without removing significant length.',
    },
  ],

  // ── Lesson 24: Clipper Over Comb ────────────────────────────────────────────
  'barber-lesson-24': [
    {
      id: 'mod4-l24-q6',
      type: 'multiple_choice',
      question: 'What is the primary advantage of clipper over comb compared to using guards alone?',
      options: [
        'It is faster than using guards',
        'It allows precise length control on curved surfaces where guards cannot follow the contour',
        'It produces a closer cut than any guard size',
        'It requires less skill than guard work',
      ],
      correctAnswer: 1,
      explanation: 'Guards are fixed-length tools that cannot adapt to the curves of the head. Clipper over comb allows the barber to control length precisely by adjusting comb angle and position, making it essential for blending on curved surfaces like the occipital area and around the ears.',
    },
    {
      id: 'mod4-l24-q7',
      type: 'multiple_choice',
      question: 'Which comb type is most appropriate for clipper over comb work on fine hair?',
      options: [
        'Wide-tooth comb — lifts more hair per pass for faster removal',
        'Barber comb with fine teeth on one end — provides precise control and lifts hair evenly',
        'Rat-tail comb — the handle provides better grip during the technique',
        'Detangling comb — prevents breakage on fine hair',
      ],
      correctAnswer: 1,
      explanation: 'A barber comb with fine teeth on one end provides the precise control needed for clipper over comb. The fine teeth lift hair evenly and allow accurate length control. Wide-tooth combs lift too much hair at once, making fine control difficult.',
    },
    {
      id: 'mod4-l24-q8',
      type: 'multiple_choice',
      question: 'During a clipper over comb pass, the comb should be held at what position relative to the clipper blade?',
      options: [
        'The comb spine should angle into the blade to guide hair toward the cutting edge',
        'The comb spine should be parallel to the blade, with the clipper running across the top of the comb teeth',
        'The comb should be held perpendicular to the blade for maximum lift',
        'The comb position does not matter — only the clipper angle affects the result',
      ],
      correctAnswer: 1,
      explanation: 'The clipper runs parallel across the top of the comb teeth. The comb lifts the hair to the desired length; the clipper cuts whatever projects above the comb. Angling the blade into the comb causes gouging. The comb spine parallel to the blade is the correct position.',
    },
  ],

  // ── Lesson 25: Scissor Over Comb ────────────────────────────────────────────
  'barber-lesson-25': [
    {
      id: 'mod4-l25-q6',
      type: 'multiple_choice',
      question: 'When is scissor over comb preferred over clipper over comb for blending?',
      options: [
        'When the client has very coarse hair that clippers cannot cut cleanly',
        'When a softer, more diffused blend is required — particularly on fine or thin hair where clipper marks show easily',
        'When the barber needs to work faster — scissors are quicker than clippers',
        'Scissor over comb is never preferred — clippers always produce a better result',
      ],
      correctAnswer: 1,
      explanation: 'Scissor over comb produces a softer, more diffused blend than clipper over comb because scissors cut individual hairs rather than all hairs at a fixed length. This makes it the preferred technique for fine or thin hair where clipper marks show easily, and for the final blending passes on any fade.',
    },
    {
      id: 'mod4-l25-q7',
      type: 'multiple_choice',
      question: 'What is the correct scissor position during scissor over comb?',
      options: [
        'Blades open wide and stationary — the comb moves through the open blades',
        'Blades parallel to the comb spine, cutting with a continuous opening-and-closing motion as the comb moves upward',
        'Blades perpendicular to the comb, cutting across the lifted hair in a single snip',
        'One blade stationary against the comb, the other blade moving to cut',
      ],
      correctAnswer: 1,
      explanation: 'In scissor over comb, the blades are parallel to the comb spine and cut with a continuous opening-and-closing motion as the comb moves upward through the section. This produces a smooth, even cut across the lifted hair. Stopping the scissor motion mid-pass creates a visible line.',
    },
    {
      id: 'mod4-l25-q8',
      type: 'multiple_choice',
      question: 'A client\'s hair is showing scissor marks (visible lines) after scissor over comb blending. What is the most likely cause?',
      options: [
        'The scissors are too sharp — dull scissors produce a softer result',
        'The scissor motion stopped mid-pass, cutting all hair at the same point and creating a line',
        'The comb angle was too flat, lifting too much hair above the teeth',
        'The client\'s hair is too fine for scissor over comb',
      ],
      correctAnswer: 1,
      explanation: 'Scissor marks are caused by stopping the scissor motion mid-pass. When the scissors stop, they cut all the lifted hair at the same point, creating a visible horizontal line. The scissor must maintain a continuous opening-and-closing motion throughout the entire comb pass.',
    },
  ],

  // ── Lesson 26: Lineup & Edging ───────────────────────────────────────────────
  'barber-lesson-26': [
    {
      id: 'mod4-l26-q6',
      type: 'multiple_choice',
      question: 'A client\'s natural hairline is uneven on one side. How should you approach the lineup?',
      options: [
        'Follow the natural hairline exactly on both sides — never alter the natural line',
        'Create a symmetrical line based on the client\'s facial structure, consulting with the client before cutting',
        'Always create a straight horizontal line regardless of the natural hairline',
        'Refuse to do a lineup if the natural hairline is uneven',
      ],
      correctAnswer: 1,
      explanation: 'A lineup should enhance the client\'s appearance. When the natural hairline is uneven, the barber should create a symmetrical line based on the client\'s facial structure — but must consult with the client first. Cutting without consultation risks removing more hair than the client expects.',
    },
    {
      id: 'mod4-l26-q7',
      type: 'multiple_choice',
      question: 'Which tool produces the sharpest, most defined lineup edge?',
      options: [
        'A T-outliner with a zero-gap blade',
        'A straight razor with a fresh blade',
        'A standard clipper with a #000 blade',
        'Thinning shears along the hairline',
      ],
      correctAnswer: 1,
      explanation: 'A straight razor with a fresh blade produces the sharpest possible lineup edge because it cuts at the skin level with no gap. T-outliners are the most common tool for lineups, but a razor finish produces a crisper line. The razor must be a shavette with a single-use blade — never a fixed-blade straight razor for this purpose.',
    },
    {
      id: 'mod4-l26-q8',
      type: 'multiple_choice',
      question: 'After completing a lineup, you notice the sideburn on the left is 3mm lower than the right. What is the correct correction?',
      options: [
        'Lower the right sideburn to match the left',
        'Raise the left sideburn to match the right — always correct by removing less, not more',
        'Leave it — minor asymmetry is acceptable in a lineup',
        'Consult the client and correct whichever side they prefer adjusted',
      ],
      correctAnswer: 3,
      explanation: 'Asymmetry corrections require client consultation. The barber should show the client the discrepancy and ask which side they prefer adjusted. The general principle is to correct by removing less (raising the lower side), but the client\'s preference takes priority. Never make a correction without informing the client.',
    },
  ],

  // ── Lesson 27: Flat Top & Classic Cuts ──────────────────────────────────────
  'barber-lesson-27': [
    {
      id: 'mod4-l27-q6',
      type: 'multiple_choice',
      question: 'What is the defining structural requirement of a flat top haircut?',
      options: [
        'The sides must be faded to the skin',
        'Every hair on the crown must be cut to the same height, creating a perfectly level top plane',
        'The front must be longer than the back to create a forward slope',
        'The top must be cut with scissors only — clippers cannot achieve a flat top',
      ],
      correctAnswer: 1,
      explanation: 'The flat top is defined by a perfectly level top plane — every hair on the crown cut to the same height. Any deviation from level is immediately visible. A level comb and a flat clipper pass are the tools; the barber\'s eye for level is the skill.',
    },
    {
      id: 'mod4-l27-q7',
      type: 'multiple_choice',
      question: 'A client requests an Ivy League cut. What distinguishes it from a standard taper?',
      options: [
        'The Ivy League has a skin fade on the sides; the taper does not',
        'The Ivy League has enough length on top to part and comb; the taper may be cut too short for a part',
        'The Ivy League uses scissors only; the taper uses clippers',
        'There is no difference — Ivy League and taper are the same cut',
      ],
      correctAnswer: 1,
      explanation: 'The Ivy League is a taper with enough length on top to create a clean part and comb the hair. The sides and back are tapered short, but the top retains enough length to lie flat when combed. A standard taper may be cut shorter on top without the requirement for a combable part.',
    },
    {
      id: 'mod4-l27-q8',
      type: 'multiple_choice',
      question: 'What is the defining characteristic of a Caesar cut?',
      options: [
        'A skin fade on the sides with a textured top',
        'Uniform length throughout with a horizontal fringe cut straight across the forehead',
        'A hard part on one side with a longer top combed over',
        'A disconnected undercut with a long top',
      ],
      correctAnswer: 1,
      explanation: 'The Caesar cut is defined by uniform length throughout and a horizontal fringe cut straight across the forehead. There is no graduation — the same length from front to back. The fringe must be straight and even; any angle to the fringe changes the cut\'s character.',
    },
  ],

  // ── Lesson 30: Straight Razor Shaving Technique ─────────────────────────────
  // DB already has q1-q7; add q8 to reach the 8-question standard
  'barber-lesson-30': [
    {
      id: 'mod5-l30-q8',
      type: 'multiple_choice',
      question: 'After completing a straight razor shave, which step is required before storing the razor?',
      options: [
        'Rinse with water only and air dry',
        'Pre-clean to remove debris, then immerse in EPA-registered disinfectant for the full contact time',
        'Wipe the blade with a dry towel and return it to the case',
        'Apply shaving cream to the blade to prevent rust',
      ],
      correctAnswer: 1,
      explanation: 'Straight razors are multi-use implements that contact blood-contact surfaces. Pre-cleaning removes organic matter, then full-contact-time disinfection with an EPA-registered solution is required before storage. Rinsing or wiping alone does not meet state board sanitation standards.',
    },
  ],

  // ── Lesson 29: Shave Preparation & Hot Towel Service ────────────────────────
  'barber-lesson-29': [
    {
      id: 'mod5-l29-q6',
      type: 'multiple_choice',
      question: 'Why is pre-shave oil applied before shaving cream or soap?',
      options: [
        'Pre-shave oil replaces the need for shaving cream on most clients',
        'Pre-shave oil lubricates and protects the skin beneath the lather, reducing razor drag and irritation',
        'Pre-shave oil softens the beard — shaving cream does not soften hair',
        'Pre-shave oil is only used for clients with sensitive skin',
      ],
      correctAnswer: 1,
      explanation: 'Pre-shave oil creates a protective layer directly on the skin before the lather is applied. This reduces razor drag, protects against nicks, and allows the razor to glide more smoothly. The lather sits on top of the oil, providing additional lubrication. Together they produce a closer, more comfortable shave.',
    },
    {
      id: 'mod5-l29-q7',
      type: 'multiple_choice',
      question: 'A client presents with several active pustules on the neck. What is the correct action?',
      options: [
        'Proceed with the shave but avoid the affected area',
        'Apply antiseptic to the pustules before beginning the shave',
        'Decline the shave service — active pustules are a contraindication',
        'Use a safety razor instead of a straight razor on the affected area',
      ],
      correctAnswer: 2,
      explanation: 'Active pustules are a contraindication for shaving services. Shaving over pustules risks spreading infection, causing additional skin trauma, and exposing the barber to bloodborne pathogens if the pustule is nicked. The service must be declined and the client referred to a dermatologist.',
    },
    {
      id: 'mod5-l29-q8',
      type: 'multiple_choice',
      question: 'How long should a hot towel be applied to the face during pre-shave preparation?',
      options: [
        '30 seconds — longer application causes skin irritation',
        '1 minute — sufficient to open pores',
        '2–3 minutes — enough to soften the beard and open pores without overheating the skin',
        '5–7 minutes — maximum softening requires extended application',
      ],
      correctAnswer: 2,
      explanation: '2–3 minutes is the standard hot towel application time. This is sufficient to soften the beard, open the pores, and prepare the skin for shaving. Shorter application does not fully soften the beard; longer application can cause skin irritation or discomfort.',
    },
  ],

  // ── Lesson 31: Beard Design & Shaping ───────────────────────────────────────
  'barber-lesson-31': [
    {
      id: 'mod5-l31-q6',
      type: 'multiple_choice',
      question: 'Where is the correct neckline position for a beard trim?',
      options: [
        'At the Adam\'s apple',
        'One finger-width above the Adam\'s apple',
        'Two finger-widths above the Adam\'s apple',
        'At the jawline',
      ],
      correctAnswer: 2,
      explanation: 'Two finger-widths above the Adam\'s apple is the standard neckline position. Setting the neckline at or below the Adam\'s apple creates an unkempt appearance. Setting it too high (at the jawline) makes the neck appear short and the beard disconnected from the face.',
    },
    {
      id: 'mod5-l31-q7',
      type: 'multiple_choice',
      question: 'A client with a round face requests a beard style. Which approach best enhances their facial structure?',
      options: [
        'Keep the beard full and round on all sides to complement the face shape',
        'Add length on the chin and keep the sides tight to create the illusion of an oval face',
        'Keep the beard very short all over to minimize the round appearance',
        'Create a wide cheek line to balance the round face',
      ],
      correctAnswer: 1,
      explanation: 'For a round face, adding length on the chin elongates the face visually while keeping the sides tight prevents additional width. This creates the illusion of a more oval face shape. A full, round beard on a round face amplifies the roundness.',
    },
    {
      id: 'mod5-l31-q8',
      type: 'multiple_choice',
      question: 'What is the most common beard design error barbers make?',
      options: [
        'Setting the cheek line too high',
        'Setting the neckline too high, making the neck appear short',
        'Making the mustache line too thin',
        'Using a trimmer instead of a razor for the cheek line',
      ],
      correctAnswer: 1,
      explanation: 'Setting the neckline too high is the most common beard design error. When the neckline is set at or near the jawline, the beard appears to float on the face and the neck looks short. Two finger-widths above the Adam\'s apple is the correct position for most clients.',
    },
  ],

  // ── Lesson 32: Post-Shave Care & Skin Treatment ─────────────────────────────
  'barber-lesson-32': [
    {
      id: 'mod5-l32-q6',
      type: 'multiple_choice',
      question: 'A client experiences razor burn after a shave. Which post-shave product is most appropriate?',
      options: [
        'Alcohol-based aftershave — kills bacteria and closes pores',
        'Alum block — reduces inflammation and closes pores without alcohol irritation',
        'Witch hazel followed by a fragrance-free moisturizer — soothes and hydrates without further irritation',
        'Pre-shave oil applied after the shave to rehydrate the skin',
      ],
      correctAnswer: 2,
      explanation: 'Razor burn is inflammation — alcohol-based products will worsen it. Witch hazel is a mild astringent that reduces inflammation without the harshness of alcohol. Following with a fragrance-free moisturizer restores the skin barrier. Alum is appropriate for nicks, not razor burn.',
    },
    {
      id: 'mod5-l32-q7',
      type: 'multiple_choice',
      question: 'What is the purpose of an alum block in post-shave care?',
      options: [
        'It moisturizes the skin after shaving',
        'It is a mild antiseptic and astringent that stops minor bleeding from nicks and closes pores',
        'It softens ingrown hairs for easier removal',
        'It neutralizes the pH of the skin after alkaline shaving products',
      ],
      correctAnswer: 1,
      explanation: 'An alum block is a potassium alum crystal that acts as a mild antiseptic and astringent. When applied to nicks, it constricts blood vessels to stop minor bleeding and closes pores. It is a standard post-shave tool in professional barbering.',
    },
    {
      id: 'mod5-l32-q8',
      type: 'multiple_choice',
      question: 'After a shave service, a client develops a small nick that is bleeding. What is the correct sequence of actions?',
      options: [
        'Apply styptic pencil or alum block directly to the nick, then continue the service',
        'Stop the service, put on gloves, apply antiseptic to the nick, dispose of contaminated materials, then complete the service if bleeding stops',
        'Apply direct pressure with a clean towel and continue the service without stopping',
        'Apply aftershave to the nick — the alcohol will stop the bleeding',
      ],
      correctAnswer: 1,
      explanation: 'A nick that draws blood triggers the blood exposure protocol: stop the service, put on gloves before touching the affected area, apply antiseptic (alum or styptic), dispose of all contaminated single-use materials in a sealed bag, and clean blood-contaminated tools. The service may continue only after bleeding stops and the area is properly treated.',
    },
  ],

  // ── Lesson 33: Mustache Trimming & Styling ───────────────────────────────────
  'barber-lesson-33': [
    {
      id: 'mod5-l33-q6',
      type: 'multiple_choice',
      question: 'Where should the mustache line be set relative to the upper lip?',
      options: [
        'At the top of the upper lip — the mustache should not touch the lip',
        'Along the natural lip line — the mustache hair should just touch the top of the upper lip',
        '3mm above the lip line — this creates a cleaner appearance',
        'The mustache line position depends entirely on client preference with no standard',
      ],
      correctAnswer: 1,
      explanation: 'The mustache line follows the natural lip line — the mustache hair should just touch the top of the upper lip. Setting the line above the lip creates a gap that looks unnatural. Setting it below removes the definition of the mustache shape.',
    },
    {
      id: 'mod5-l33-q7',
      type: 'multiple_choice',
      question: 'A client requests a chevron mustache. What is its defining characteristic?',
      options: [
        'A thin, pencil-line mustache that follows the lip line exactly',
        'A full, wide mustache that covers the entire upper lip and extends slightly past the corners of the mouth',
        'A handlebar mustache with waxed, upturned ends',
        'A mustache that connects to the beard on both sides',
      ],
      correctAnswer: 1,
      explanation: 'The chevron is a full, wide mustache that covers the entire upper lip and extends slightly past the corners of the mouth. It is one of the most classic mustache styles. The defining feature is its full coverage of the upper lip with a clean, straight bottom edge.',
    },
    {
      id: 'mod5-l33-q8',
      type: 'multiple_choice',
      question: 'Before trimming a mustache, what is the correct preparation step?',
      options: [
        'Apply pre-shave oil to soften the mustache hair',
        'Comb the mustache downward to its natural fall before trimming to its natural length',
        'Wet the mustache thoroughly — dry trimming causes uneven results',
        'Apply mustache wax before trimming to hold the hair in position',
      ],
      correctAnswer: 1,
      explanation: 'Combing the mustache downward to its natural fall before trimming ensures you are cutting the hair at its actual length, not stretched or compressed. Trimming without combing first produces uneven results because the hair is not in its natural position.',
    },
  ],
};

// ─── Patch runner ─────────────────────────────────────────────────────────────

async function getLessonId(slug: string): Promise<string | null> {
  const { data, error } = await db
    .from('course_lessons')
    .select('id, quiz_questions')
    .eq('course_id', COURSE_ID)
    .eq('slug', slug)
    .single();
  if (error || !data) { console.error(`  ✗ Not found: ${slug}`, error?.message); return null; }
  return data.id;
}

async function patchLesson(slug: string, extraQuestions: object[]) {
  console.log(`\nPatching ${slug}...`);

  // Fetch current quiz_questions
  const { data, error } = await db
    .from('course_lessons')
    .select('id, quiz_questions')
    .eq('course_id', COURSE_ID)
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error(`  ✗ Not found: ${slug}`, error?.message);
    return;
  }

  const existing: any[] = Array.isArray(data.quiz_questions) ? data.quiz_questions : [];
  const existingIds = new Set(existing.map((q: any) => q.id));

  // Only add questions not already present
  const toAdd = extraQuestions.filter((q: any) => !existingIds.has(q.id));
  if (toAdd.length === 0) {
    console.log(`  ✓ Already at standard (${existing.length} questions)`);
    return;
  }

  const merged = [...existing, ...toAdd];

  const { error: updateError } = await db
    .from('course_lessons')
    .update({ quiz_questions: merged, updated_at: new Date().toISOString() })
    .eq('id', data.id);

  if (updateError) {
    console.error(`  ✗ Update failed:`, updateError.message);
  } else {
    console.log(`  ✓ ${existing.length} → ${merged.length} questions`);
  }
}

async function main() {
  console.log('Patching barber modules 4-5 quiz questions to 8+ standard...\n');

  for (const [slug, questions] of Object.entries(EXTRA_QUESTIONS)) {
    await patchLesson(slug, questions);
  }

  console.log('\nDone.');
}

main().catch(console.error);
