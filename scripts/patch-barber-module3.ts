/**
 * Patch Module 3 lessons 15-17: fix title/content mismatches and expand to standard.
 * Run: pnpm tsx --env-file=.env.local scripts/patch-barber-module3.ts
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

const patches = [
  {
    slug: 'barber-lesson-15',
    title: 'Clipper and Trimmer Maintenance',
    learning_objectives: [
      'Identify the components of a professional clipper and explain the function of each part',
      'Demonstrate the correct procedure for cleaning, oiling, and aligning clipper blades',
      'Explain how blade gap affects cutting length and identify common blade sizes',
      'Describe the signs of a clipper that needs professional servicing vs. routine maintenance',
      'Perform a pre-service clipper inspection and document any defects',
    ],
    content: `<h2>Clipper and Trimmer Maintenance</h2>

<h3>Why Maintenance Matters</h3>
<p>A clipper is your primary production tool. A poorly maintained clipper pulls hair instead of cutting it, causes client discomfort, and produces uneven results. Blade infections from contaminated clippers are a real risk — folliculitis outbreaks have been traced to barber shops with inadequate tool maintenance. Proper maintenance protects your clients, your reputation, and your equipment investment.</p>

<h3>Clipper Anatomy</h3>
<p>Understanding your tool starts with knowing its parts:</p>
<ul>
  <li><strong>Motor:</strong> Drives the blade movement. Rotary motors are powerful and quiet; magnetic motors are fast and precise; pivot motors are durable for heavy use.</li>
  <li><strong>Blade assembly:</strong> Consists of a stationary bottom blade and a moving top blade. The gap between them determines cutting length.</li>
  <li><strong>Taper lever:</strong> Adjusts the blade gap without changing guards. Closed = shorter cut; open = longer cut.</li>
  <li><strong>Guards (attachments):</strong> Plastic combs that attach to the blade to control cutting length. Sizes range from #0.5 (1/16") to #8 (1").</li>
  <li><strong>Housing:</strong> The body of the clipper. Inspect for cracks that could harbor bacteria.</li>
  <li><strong>Cord/battery:</strong> Corded clippers provide consistent power; cordless offer mobility but require charging discipline.</li>
</ul>

<h3>Blade Sizes and Their Uses</h3>
<p>Blade numbers are counterintuitive — higher numbers cut shorter:</p>
<ul>
  <li><strong>#10:</strong> Very close cut, used for fades near the skin</li>
  <li><strong>#5:</strong> Close cut, common for tight fades</li>
  <li><strong>#3.5 / #4:</strong> Medium-short, common for the sides of a taper</li>
  <li><strong>#1 / #1.5:</strong> Short, used for blending</li>
  <li><strong>#0 / #000:</strong> Skin-close, used for bald fades and edge work</li>
</ul>
<p>Guards add length on top of the blade. A #1 guard on a #000 blade gives approximately 1/8" of hair.</p>

<h3>Daily Maintenance Procedure</h3>
<p>Perform this procedure before your first client and after every client:</p>
<ol>
  <li><strong>Remove hair:</strong> Use the cleaning brush to remove all hair from the blade assembly. Hair left in the blade causes heat buildup and dulling.</li>
  <li><strong>Spray with clipper spray:</strong> Apply an EPA-registered clipper disinfectant spray (such as Andis Cool Care or Wahl Blade Ice) to the running blade for 3-5 seconds. This cools, cleans, and disinfects simultaneously.</li>
  <li><strong>Oil the blade:</strong> Apply 2-3 drops of clipper oil to the top blade while the clipper is running. Oil reduces friction, prevents rust, and extends blade life. Wipe off excess oil before use on a client.</li>
  <li><strong>Check blade alignment:</strong> The top blade should sit 1/16" behind the bottom blade. Misalignment causes nicks and uneven cuts.</li>
  <li><strong>Inspect the cord:</strong> Check for fraying or damage. A damaged cord is an electrical hazard — remove the clipper from service immediately.</li>
</ol>

<h3>Blade Alignment Procedure</h3>
<p>If your clipper is pulling or cutting unevenly, check blade alignment:</p>
<ol>
  <li>Turn off and unplug the clipper.</li>
  <li>Loosen the blade screws slightly — do not remove them.</li>
  <li>Align the top blade so it sits 1/16" behind the bottom blade on both sides.</li>
  <li>Tighten the screws evenly while holding the blade in position.</li>
  <li>Test on a comb before using on a client.</li>
</ol>

<h3>When to Send for Professional Servicing</h3>
<p>Some issues require a professional sharpening or repair service:</p>
<ul>
  <li>Blades that pull even after cleaning and oiling</li>
  <li>Excessive heat that persists after cooling spray</li>
  <li>Unusual noise or vibration from the motor</li>
  <li>Blade that will not align properly</li>
</ul>
<p>Most professional barbers sharpen or replace blades every 3-6 months depending on volume. Keep a log of maintenance dates.</p>`,
    competency_checks: [
      { key: 'clipper_maintenance', label: 'Clipper Maintenance Procedure', requiresInstructorSignoff: true, isCritical: false },
    ],
    practical_required: true,
    quiz_questions: [
      { id: 'l15q1', question: 'What does a higher blade number indicate on a clipper blade?', options: ['A longer cut', 'A shorter cut', 'A wider blade', 'A faster motor'], correctAnswer: 1, explanation: 'Higher blade numbers cut shorter. A #10 blade cuts closer to the skin than a #1 blade.' },
      { id: 'l15q2', question: 'How many drops of clipper oil should be applied during routine maintenance?', options: ['5-10 drops', '2-3 drops', '1 drop only', 'Soak the blade completely'], correctAnswer: 1, explanation: '2-3 drops of clipper oil on the top blade while running is the standard. Excess oil should be wiped off before client use.' },
      { id: 'l15q3', question: 'What is the correct position of the top blade relative to the bottom blade?', options: ['Flush with the bottom blade', '1/16" behind the bottom blade', '1/4" behind the bottom blade', 'Slightly in front of the bottom blade'], correctAnswer: 1, explanation: 'The top blade should sit 1/16" behind the bottom blade. Misalignment causes nicks and uneven cuts.' },
      { id: 'l15q4', question: 'A clipper continues to pull hair even after cleaning and oiling. What should you do?', options: ['Apply more oil and continue using it', 'Send it for professional blade sharpening or replacement', 'Use it only on shorter hair', 'Increase the motor speed setting'], correctAnswer: 1, explanation: 'Persistent pulling after maintenance indicates dull blades that need professional sharpening or replacement.' },
      { id: 'l15q5', question: 'What is the purpose of clipper spray (such as Andis Cool Care)?', options: ['It adds fragrance to the clipper', 'It cools, cleans, and disinfects the blade simultaneously', 'It replaces the need for clipper oil', 'It sharpens the blade edges'], correctAnswer: 1, explanation: 'Clipper spray cools the blade, removes debris, and disinfects — all in one step.' },
    ],
  },
  {
    slug: 'barber-lesson-16',
    title: 'Scissor and Shear Techniques',
    learning_objectives: [
      'Identify the parts of a barber shear and explain the function of each component',
      'Demonstrate correct scissor grip and finger placement for precision cutting',
      'Explain the difference between point cutting, slide cutting, and blunt cutting techniques',
      'Describe how to maintain and clean shears to preserve blade integrity',
      'Apply scissor-over-comb technique to blend hair at the neckline and sides',
    ],
    content: `<h2>Scissor and Shear Techniques</h2>

<h3>The Barber's Shear</h3>
<p>Shears are precision instruments. A quality pair of barber shears can cost $200-$800 and last a decade with proper care. Understanding their construction helps you use and maintain them correctly.</p>
<p>Parts of a shear:</p>
<ul>
  <li><strong>Blades:</strong> The cutting edges. Convex blades (hollow-ground) are the sharpest and most common in professional barbering. Beveled blades are more durable but less sharp.</li>
  <li><strong>Pivot screw:</strong> Controls blade tension. Too tight = difficult to open; too loose = blades separate and fold hair instead of cutting.</li>
  <li><strong>Finger rings:</strong> The thumb ring is smaller; the finger ring is larger. Some shears have an offset handle for ergonomic positioning.</li>
  <li><strong>Tang (finger rest):</strong> The small extension below the finger ring. Resting your pinky here provides control and reduces hand fatigue.</li>
  <li><strong>Heel and toe:</strong> The heel is the base of the blade near the pivot; the toe is the tip. Cutting with the heel provides power; cutting with the toe provides precision.</li>
</ul>

<h3>Correct Grip and Posture</h3>
<p>Improper grip is the leading cause of repetitive strain injuries in barbers. The correct grip:</p>
<ul>
  <li>Insert the thumb into the thumb ring — only to the first knuckle, not fully through</li>
  <li>Insert the ring finger into the finger ring</li>
  <li>Rest the pinky on the tang</li>
  <li>Keep the index and middle fingers resting lightly on the blade for control</li>
  <li><strong>Only the thumb moves</strong> — the finger ring stays stationary. Moving both rings causes fatigue and imprecision</li>
</ul>
<p>Stand with your feet shoulder-width apart, weight balanced. Raise the client's chair to a height where your elbow is at a 90-degree angle when cutting — this prevents shoulder strain.</p>

<h3>Cutting Techniques</h3>
<p><strong>Blunt cutting:</strong> Cutting straight across the hair section at a consistent angle. Creates a solid, defined line. Used for perimeters, fringes, and defined edges.</p>
<p><strong>Point cutting:</strong> Cutting into the ends of the hair at an angle with the tips of the shear. Creates texture and removes bulk without changing the overall length significantly. Used to soften blunt lines and add movement.</p>
<p><strong>Slide cutting:</strong> Gliding the open shear along the hair shaft while cutting. Creates graduation and removes length and bulk simultaneously. Requires sharp blades — dull blades will fold and pull hair.</p>
<p><strong>Scissor-over-comb:</strong> Using a comb to lift hair and cutting the hair that extends above the comb. The primary technique for blending the sides and back of a haircut. The comb angle determines the graduation.</p>

<h3>Scissor-Over-Comb Technique</h3>
<ol>
  <li>Hold the comb in your non-dominant hand, teeth pointing up.</li>
  <li>Insert the comb into the hair at the desired starting point, angled away from the head.</li>
  <li>Lift the comb upward through the hair — hair that extends above the comb spine will be cut.</li>
  <li>Cut the hair extending above the comb with smooth, consistent snips.</li>
  <li>Move the comb upward in overlapping passes, maintaining consistent comb angle for even graduation.</li>
  <li>Check your work by combing through the section — any uncut hair indicates a missed pass.</li>
</ol>

<h3>Shear Maintenance</h3>
<ul>
  <li><strong>After every client:</strong> Wipe blades with a clean cloth to remove hair and moisture. Apply a drop of shear oil to the pivot screw.</li>
  <li><strong>Daily:</strong> Disinfect with an EPA-registered spray or wipe. Do not submerge shears in Barbicide — it corrodes the metal.</li>
  <li><strong>Monthly:</strong> Check pivot tension. The shear should fall open to 45 degrees under its own weight when held by the thumb ring.</li>
  <li><strong>Annually:</strong> Professional sharpening. Never attempt to sharpen shears yourself with a household sharpener — it will damage the convex edge.</li>
</ul>`,
    quiz_questions: [
      { id: 'l16q1', question: 'Which finger should be the ONLY one moving when using barber shears?', options: ['Index finger', 'Ring finger', 'Thumb', 'Pinky'], correctAnswer: 2, explanation: 'Only the thumb moves when cutting. The finger ring stays stationary. Moving both causes fatigue and imprecision.' },
      { id: 'l16q2', question: 'What cutting technique creates texture by cutting into the ends of the hair at an angle?', options: ['Blunt cutting', 'Point cutting', 'Slide cutting', 'Scissor-over-comb'], correctAnswer: 1, explanation: 'Point cutting uses the tips of the shear to cut into hair ends at an angle, creating texture and removing bulk.' },
      { id: 'l16q3', question: 'Why should shears NOT be submerged in Barbicide?', options: ['Barbicide does not disinfect metal tools', 'Barbicide corrodes the metal and damages the blades', 'Barbicide is only for plastic tools', 'Submersion dulls the blade edge'], correctAnswer: 1, explanation: 'Barbicide corrodes metal shears. Use spray or wipe disinfection instead.' },
      { id: 'l16q4', question: 'In scissor-over-comb technique, what determines the graduation of the cut?', options: ['The speed of the cutting strokes', 'The angle of the comb', 'The size of the shear', 'The direction of hair growth'], correctAnswer: 1, explanation: 'The angle of the comb determines how much hair is lifted and therefore the graduation of the cut.' },
      { id: 'l16q5', question: 'A properly tensioned shear should fall open to what angle under its own weight?', options: ['90 degrees', '60 degrees', '45 degrees', '30 degrees'], correctAnswer: 2, explanation: 'A properly tensioned shear falls open to 45 degrees under its own weight when held by the thumb ring.' },
    ],
  },
  {
    slug: 'barber-lesson-17',
    title: 'Straight Razor Shaving Techniques',
    learning_objectives: [
      'Identify the parts of a straight razor and explain the function of each component',
      'Demonstrate correct straight razor grip, stroke angle, and skin tension technique',
      'Describe the three-pass shaving method and explain why each pass direction matters',
      'Explain the safe procedure for changing a disposable straight razor blade',
      'Identify contraindications that require declining a straight razor shave service',
    ],
    content: `<h2>Straight Razor Shaving Techniques</h2>

<h3>The Art and Science of the Straight Razor Shave</h3>
<p>The straight razor shave is the signature service that distinguishes a barber from every other beauty professional. Done correctly, it is the closest, most comfortable shave a client can receive. Done incorrectly, it causes cuts, razor burn, ingrown hairs, and potential infection. Mastery requires understanding both the tool and the skin.</p>

<h3>Anatomy of the Straight Razor</h3>
<ul>
  <li><strong>Blade:</strong> The cutting edge. Professional barbers use disposable-blade straight razors (also called shavettes) for sanitation compliance. The blade is single-use — never use the same blade on two clients.</li>
  <li><strong>Spine:</strong> The thick, dull back of the blade. The spine rests on the skin to control cutting angle.</li>
  <li><strong>Heel:</strong> The base of the blade near the pivot. Used for broad strokes.</li>
  <li><strong>Toe:</strong> The tip of the blade. Used for detail work around the nose and ears.</li>
  <li><strong>Tang:</strong> The extension of the blade that fits into the handle.</li>
  <li><strong>Handle (scales):</strong> The protective cover that folds over the blade when not in use.</li>
</ul>

<h3>Correct Grip</h3>
<p>There are two primary grips:</p>
<p><strong>Standard grip:</strong> Index, middle, and ring fingers on the back of the blade (spine side). Thumb on the underside of the blade near the heel. Pinky rests on the tang for control. This grip is used for most strokes.</p>
<p><strong>Backhand grip:</strong> The razor is rotated so the cutting edge faces away from you. Used for against-the-grain passes on the neck and under the chin. Requires practice to control safely.</p>
<p>The blade angle against the skin should be <strong>30 degrees</strong>. Too flat = no cutting. Too steep = cuts the skin.</p>

<h3>Skin Preparation</h3>
<p>Proper preparation is 50% of the shave quality:</p>
<ol>
  <li><strong>Hot towel:</strong> Apply a hot, damp towel to the face for 2-3 minutes. This softens the hair shaft, opens the follicle, and relaxes the skin. A softened hair cuts with 70% less force than a dry hair.</li>
  <li><strong>Pre-shave oil (optional):</strong> Apply a thin layer of pre-shave oil to lubricate the skin and provide an additional layer of protection.</li>
  <li><strong>Lather:</strong> Apply shaving cream or soap with a brush using circular motions to lift the hair and create a protective cushion. The lather should be thick and creamy — not thin or foamy.</li>
</ol>

<h3>The Three-Pass Method</h3>
<p>Professional straight razor shaving uses three passes for maximum closeness with minimum irritation:</p>
<ul>
  <li><strong>Pass 1 — With the grain (WTG):</strong> Shave in the direction of hair growth. Removes the bulk of the hair. Causes the least irritation. Always start here.</li>
  <li><strong>Pass 2 — Across the grain (XTG):</strong> Shave perpendicular to hair growth. Removes remaining stubble. Re-lather before this pass.</li>
  <li><strong>Pass 3 — Against the grain (ATG):</strong> Shave against the direction of hair growth. Achieves the closest result. Re-lather before this pass. Use only on clients with no history of ingrown hairs or razor bumps (pseudofolliculitis barbae).</li>
</ul>

<h3>Skin Tension Technique</h3>
<p>Proper skin tension is critical for a safe, close shave. Loose skin causes the razor to skip and cut. Use your non-dominant hand to stretch the skin taut in the opposite direction of the razor stroke. The skin should be firm but not distorted.</p>

<h3>Blade Change Procedure</h3>
<ol>
  <li>Close the razor and set it down on a clean surface.</li>
  <li>Put on gloves before handling the used blade.</li>
  <li>Open the razor and use the blade wrapper or a folded paper towel to grip the used blade — never touch the cutting edge with bare fingers.</li>
  <li>Slide the blade out of the holder and immediately place it in the sharps container.</li>
  <li>Remove the new blade from its wrapper without touching the cutting edge.</li>
  <li>Slide the new blade into the holder until it clicks into place.</li>
  <li>Verify the blade is secure before use.</li>
</ol>

<h3>Contraindications</h3>
<p>Do not perform a straight razor shave if the client has:</p>
<ul>
  <li>Active acne, open lesions, or inflamed skin in the service area</li>
  <li>Pseudofolliculitis barbae (razor bumps) — ATG passes will worsen the condition</li>
  <li>Known bleeding disorders or is on blood thinners</li>
  <li>Contagious skin conditions (ringworm, impetigo)</li>
  <li>Recent facial surgery or chemical peel</li>
</ul>`,
    competency_checks: [
      { key: 'razor_blade_change', label: 'Razor Blade Change', requiresInstructorSignoff: true, isCritical: true },
      { key: 'straight_razor_grip', label: 'Straight Razor Grip & Stroke', requiresInstructorSignoff: true, isCritical: true },
    ],
    practical_required: true,
    quiz_questions: [
      { id: 'l17q1', question: 'What is the correct blade angle for a straight razor against the skin?', options: ['10 degrees', '30 degrees', '45 degrees', '60 degrees'], correctAnswer: 1, explanation: 'The blade should be held at 30 degrees to the skin. Too flat = no cutting; too steep = cuts the skin.' },
      { id: 'l17q2', question: 'In the three-pass shaving method, which pass should always come first?', options: ['Against the grain', 'Across the grain', 'With the grain', 'The order does not matter'], correctAnswer: 2, explanation: 'Always start with the grain (WTG) to remove bulk hair with minimum irritation before subsequent passes.' },
      { id: 'l17q3', question: 'Why is a hot towel applied before a straight razor shave?', options: ['To open the pores for product absorption only', 'To soften the hair shaft and relax the skin, reducing cutting force by 70%', 'To disinfect the skin before the razor contacts it', 'To remove excess oil that would interfere with the razor'], correctAnswer: 1, explanation: 'A hot towel softens the hair shaft and opens the follicle, reducing the force needed to cut by approximately 70%.' },
      { id: 'l17q4', question: 'A client has active pseudofolliculitis barbae (razor bumps). What should you do?', options: ['Proceed with WTG and XTG passes only, skip ATG', 'Decline the straight razor service and recommend treatment', 'Apply extra lather and proceed normally', 'Use a safety razor instead of a straight razor'], correctAnswer: 1, explanation: 'Active razor bumps are a contraindication for straight razor shaving. Decline the service and recommend appropriate treatment.' },
      { id: 'l17q5', question: 'When changing a straight razor blade, what must you wear?', options: ['A face shield', 'Gloves', 'Safety glasses', 'An apron'], correctAnswer: 1, explanation: 'Gloves must be worn when handling used razor blades to prevent bloodborne pathogen exposure.' },
    ],
  },
];

async function main() {
  for (const patch of patches) {
    const updateData: Record<string, unknown> = {
      title:               patch.title,
      learning_objectives: patch.learning_objectives,
      content:             patch.content,
      quiz_questions:      patch.quiz_questions,
      updated_at:          new Date().toISOString(),
    };
    if ('competency_checks' in patch) updateData.competency_checks = patch.competency_checks;
    if ('practical_required' in patch) updateData.practical_required = patch.practical_required;

    const { error } = await db
      .from('course_lessons')
      .update(updateData)
      .eq('course_id', COURSE_ID)
      .eq('slug', patch.slug);

    if (error) {
      console.error(`❌ ${patch.slug}:`, error.message);
    } else {
      console.log(`✅ ${patch.slug} — "${patch.title}" — ${patch.learning_objectives.length} obj, ${patch.quiz_questions.length} q`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
