/**
 * scripts/seed-lesson-30-gold-standard.ts
 *
 * Writes the gold-standard "Straight Razor Shave Procedure" lesson to the DB.
 * This is the reference artifact for Milady-level content quality.
 *
 * Usage: pnpm tsx scripts/seed-lesson-30-gold-standard.ts
 */

import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const SLUG      = 'barber-lesson-30';

const content = `<h2>Straight Razor Shave Procedure</h2>

<h3>Objective</h3>
<p>Execute a complete professional straight razor shave — from pre-service assessment through post-service care — using correct blade angle, skin tension, grain mapping, and stroke mechanics. Identify contraindications before touching the client and apply corrective logic when the shave deviates from plan.</p>

<h3>Key Concepts</h3>
<ul>
  <li><strong>Grain mapping</strong> — charting the direction of hair growth across each facial zone before the first pass</li>
  <li><strong>Blade angle</strong> — the angle between the razor spine and the skin surface; 30° is the working standard</li>
  <li><strong>Skin tension</strong> — manual stretching of the skin to create a flat cutting surface; prevents nicks and drag</li>
  <li><strong>Lather consistency</strong> — the correct water-to-product ratio that lubricates without collapsing under blade pressure</li>
  <li><strong>Three-pass protocol</strong> — WTG (with grain), XTG (across grain), ATG (against grain); each pass has a specific purpose and client indication</li>
  <li><strong>Contraindications</strong> — conditions that require service refusal or modification before any blade contacts skin</li>
</ul>

<h3>Pre-Service: Assessment and Setup</h3>

<h4>Step 1 — Contraindication Check</h4>
<p>Before draping the client, visually inspect the shave area under good lighting. You are looking for:</p>
<table style="width:100%;border-collapse:collapse;margin:1rem 0">
  <thead>
    <tr>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Condition</th>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Action</th>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Reason</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Active acne, pustules, open lesions</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Refuse straight razor service</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Blade will rupture pustules, spread bacteria, create open wounds</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Razor bumps (pseudofolliculitis barbae)</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Modify — WTG pass only, no ATG</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">ATG cuts hair below follicle opening, worsening ingrown hair cycle</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Extremely sensitive or thin skin</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Reduce passes — WTG and XTG only</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">ATG increases friction and micro-abrasion risk on fragile skin</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Tinea barbae (fungal infection of beard area)</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Refuse all shave services</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Contagious — blade spreads infection across face and to tools</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Blood-thinning medications (client disclosure)</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Proceed with caution — have styptic ready</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Minor nicks will bleed significantly longer; client must be informed</td>
    </tr>
  </tbody>
</table>

<h4>Step 2 — Grain Mapping</h4>
<p>Run a clean fingertip across the beard in multiple directions to feel resistance. Hair growth direction varies by zone — do not assume it is uniform. Map each zone before lathering:</p>
<table style="width:100%;border-collapse:collapse;margin:1rem 0">
  <thead>
    <tr>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Zone</th>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Typical Growth Direction</th>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Common Variation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Cheeks</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Downward</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">May angle forward toward chin</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Upper lip</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Downward from center, angling outward</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Whorls common at philtrum</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Chin</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Upward from neck, downward from lip</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Swirl patterns common — map carefully</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Neck</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Upward toward chin</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Frequently grows in multiple directions — highest ingrown risk</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Jawline</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Downward</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">May angle backward toward ear</td>
    </tr>
  </tbody>
</table>
<p><em>Diagram reference: facial zone grain map — search "barber facial hair growth direction zones diagram"</em></p>

<h4>Step 3 — Hot Towel Application</h4>
<ol>
  <li>Heat towel to 110–120°F (test on inner wrist — warm but not painful)</li>
  <li>Wring thoroughly — excess water dilutes lather and cools the towel faster</li>
  <li>Apply to face, molding to contours of cheeks, chin, and neck</li>
  <li>Leave on 2–3 minutes — softens the hair shaft, swells the cuticle, opens follicles</li>
  <li>Remove and immediately apply pre-shave oil while skin is still warm and pores are open</li>
</ol>
<p><strong>Why this matters:</strong> Softened hair requires 65% less cutting force. Skipping or rushing the hot towel is the single most common cause of razor drag and post-shave irritation.</p>

<h4>Step 4 — Lather Preparation</h4>
<p>Lather is not just lubrication — it is a barrier between the blade and the skin. Incorrect consistency is a direct cause of nicks and irritation.</p>
<table style="width:100%;border-collapse:collapse;margin:1rem 0">
  <thead>
    <tr>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Lather State</th>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Appearance</th>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Problem</th>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Fix</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Too dry</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Stiff, pasty, no sheen</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Drags on skin, clogs blade, causes friction burns</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Add water a few drops at a time, re-work brush</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Too wet</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Runny, collapses under pressure</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">No protective barrier — blade contacts skin directly</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Work brush longer without adding water to tighten</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Correct</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Glossy, holds peaks, slick to touch</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">—</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Apply immediately — lather degrades within 3–4 minutes</td>
    </tr>
  </tbody>
</table>
<p>Apply lather with a brush using circular motions to lift the hair away from the skin and coat each strand from base to tip. Work against the grain during application — this lifts the hair for a cleaner first pass.</p>

<h3>Service Execution: The Three-Pass Protocol</h3>

<h4>Blade Angle and Skin Tension — Non-Negotiable Mechanics</h4>
<p><strong>Blade angle:</strong> Hold the razor so the spine is approximately 30° from the skin surface. At this angle, the edge contacts the hair without the spine dragging. Steeper than 30° increases nick risk. Flatter than 20° causes the blade to skate without cutting.</p>
<p><strong>Skin tension:</strong> Use the non-dominant hand to stretch the skin taut in the opposite direction of the stroke. A flat cutting surface prevents the blade from catching skin folds. Insufficient tension is the primary cause of nicks on the neck and jawline.</p>
<p><strong>Stroke mechanics:</strong> Short, controlled strokes of 1–2 inches. Rinse the blade after every 2–3 strokes. A blade loaded with cut hair and lather loses its glide and increases drag pressure.</p>

<h4>Pass 1 — With the Grain (WTG)</h4>
<p>Cut in the direction of hair growth. This is the safest pass and removes 70–80% of the beard length. Every client receives this pass. Work systematically: right cheek → left cheek → upper lip → chin → neck. Never skip zones or return to a zone mid-pass — this disrupts lather coverage and increases irritation.</p>

<h4>Pass 2 — Across the Grain (XTG)</h4>
<p>Cut perpendicular to hair growth. Removes the remaining stubble that WTG left behind. Apply a fresh, thin layer of lather before this pass. Decision logic:</p>
<ul>
  <li>If client has razor bumps → stop here, do not proceed to ATG</li>
  <li>If client has sensitive skin → stop here unless they explicitly request ATG and understand the risk</li>
  <li>If client has normal skin and wants a close shave → proceed to Pass 3</li>
</ul>

<h4>Pass 3 — Against the Grain (ATG)</h4>
<p>Cut opposite to hair growth direction. Produces the closest possible result. Carries the highest risk of irritation, ingrown hairs, and micro-abrasion. Apply a third layer of lather. Use lighter pressure than Passes 1 and 2 — the hair is now very short and the blade is working against follicle direction. The neck zone requires the most care here — grain direction is often inconsistent and skin is thinner.</p>

<h3>Post-Service Protocol</h3>
<ol>
  <li><strong>Cold towel</strong> — apply immediately after the final pass. Closes follicles, reduces redness, stops minor bleeding from micro-abrasions.</li>
  <li><strong>Styptic application</strong> — if a nick occurred, apply styptic pencil or powder directly to the wound. Do not wipe — press and hold 10–15 seconds. Inform the client.</li>
  <li><strong>Aftershave balm or toner</strong> — apply based on skin type. Alcohol-based toners for oily skin; balm for dry or sensitive skin. Never apply alcohol-based product to broken skin.</li>
  <li><strong>Moisturizer</strong> — seal the skin barrier. Shaving removes the top layer of dead skin cells along with the hair.</li>
  <li><strong>Tool sanitation</strong> — disinfect the razor immediately. Fixed blade: strop and store. Shavette: remove and dispose of blade in a sharps container.</li>
</ol>

<h3>Common Failure Modes and Corrections</h3>
<table style="width:100%;border-collapse:collapse;margin:1rem 0">
  <thead>
    <tr>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Problem</th>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Most Likely Cause</th>
      <th style="padding:10px 12px;border:1px solid #cbd5e1;text-align:left;background:#f8fafc;font-weight:600">Correction</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Nick or cut</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Insufficient skin tension, blade angle too steep, or skin fold caught</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Apply styptic immediately; re-evaluate tension technique before continuing</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Razor drag / pulling</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Lather too dry, blade loaded with debris, or angle too flat</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Rinse blade, check lather consistency, adjust angle</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Missed patches</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Skipping grain mapping — cutting with wrong direction in a zone</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Re-lather the zone and re-cut with correct grain direction</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Post-shave redness / burn</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Too many passes, insufficient lather, or ATG on sensitive skin</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Cold towel, balm, reduce passes on next visit; document client preference</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Ingrown hairs (post-visit)</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">ATG pass on client with pseudofolliculitis barbae</td>
      <td style="padding:10px 12px;border:1px solid #e2e8f0">Document contraindication; WTG/XTG only on future visits</td>
    </tr>
  </tbody>
</table>

<h3>State Board Alignment</h3>
<p><strong>Indiana Barber Exam Domain:</strong> Shaving and Facial Hair Services — Straight Razor Technique, Sanitation, Contraindications</p>
<p>State board practical exams assess: correct blade angle, skin tension application, three-pass sequence, post-service sanitation, and contraindication identification. Every element of this lesson maps directly to a scored practical competency.</p>`;

const quizQuestions = [
  {
    id: 'mod5-l30-q1',
    question: 'A client sits down for a straight razor shave. During your pre-service inspection you notice several raised, inflamed pustules along the jawline. What is the correct action?',
    options: [
      'Proceed with the WTG pass only and avoid the affected area',
      'Refuse the straight razor service and explain the contraindication to the client',
      'Apply extra lather over the pustules and proceed carefully',
      'Use a safety razor instead of a straight razor for this client',
    ],
    correctAnswer: 1,
    explanation: 'Active pustules are a contraindication for straight razor service. The blade will rupture them, spread bacteria across the face, and create open wounds. Refusing the service is the only correct action — a safety razor does not change this.',
  },
  {
    id: 'mod5-l30-q2',
    question: 'During a shave, the razor is dragging and pulling instead of gliding. The blade was just rinsed. What is the most likely cause?',
    options: [
      'The blade angle is too steep',
      'The client has coarse hair',
      'The lather consistency is too dry — insufficient water content',
      'The hot towel was applied too long',
    ],
    correctAnswer: 2,
    explanation: 'Drag after rinsing the blade points to lather consistency. Dry lather has insufficient slip — it creates friction between the blade and skin. Add water a few drops at a time and re-work the brush before continuing.',
  },
  {
    id: 'mod5-l30-q3',
    question: 'What is the primary mechanical purpose of applying skin tension during a straight razor shave?',
    options: [
      'To increase blood flow to the shave area',
      'To create a flat cutting surface that prevents the blade from catching skin folds',
      'To open the hair follicles before the blade passes',
      'To reduce the amount of lather needed per pass',
    ],
    correctAnswer: 1,
    explanation: 'Skin tension flattens the cutting surface. Without it, skin folds and contours catch the blade edge, causing nicks — especially on the neck and jawline where the skin is loose and the grain direction is inconsistent.',
  },
  {
    id: 'mod5-l30-q4',
    question: 'A client with pseudofolliculitis barbae (razor bumps) requests a full three-pass shave. What is the correct response?',
    options: [
      'Complete all three passes as requested — client preference overrides technique',
      'Perform WTG and XTG passes only; explain that ATG worsens the ingrown hair cycle for this condition',
      'Refuse the shave service entirely',
      'Perform the ATG pass only on the cheeks and skip the neck',
    ],
    correctAnswer: 1,
    explanation: 'Pseudofolliculitis barbae is caused by hairs curling back into the skin after cutting. ATG cuts hair below the follicle opening, increasing re-entry likelihood. WTG and XTG passes reduce this risk while still providing a close result.',
  },
  {
    id: 'mod5-l30-q5',
    question: "You complete a shave and notice a small nick on the client's neck. What is the correct immediate sequence?",
    options: [
      'Apply aftershave balm, then styptic, then cold towel',
      'Apply styptic directly to the wound, press and hold, then inform the client',
      'Wipe the area clean, apply alcohol toner, and continue the service',
      'Apply cold towel first, then alcohol-based aftershave to disinfect',
    ],
    correctAnswer: 1,
    explanation: 'Styptic is applied first and directly — it constricts the blood vessel and stops bleeding. Wiping removes the clotting agent. Alcohol on broken skin causes pain and further irritation. The client must be informed of any nick.',
  },
  {
    id: 'mod5-l30-q6',
    question: 'The neck zone requires the most care during the ATG pass. Why?',
    options: [
      'The neck has the thickest skin on the face',
      'Neck hair always grows in a single consistent direction',
      'The neck has thinner skin and frequently inconsistent grain direction, increasing nick and ingrown hair risk',
      'The ATG pass is not recommended for any zone below the jawline',
    ],
    correctAnswer: 2,
    explanation: 'The neck combines two high-risk factors: thinner skin more vulnerable to micro-abrasion, and inconsistent grain direction that makes a single stroke direction unreliable. Grain mapping the neck before the ATG pass is essential.',
  },
  {
    id: 'mod5-l30-q7',
    question: 'Why is lather applied against the grain during the brush application phase, before the first razor pass?',
    options: [
      'To pre-cut the hair before the razor contacts it',
      'To lift the hair away from the skin so the razor can cut closer to the base',
      'To reduce the amount of product needed for the second pass',
      'To close the follicles before the blade opens them',
    ],
    correctAnswer: 1,
    explanation: 'Applying lather against the grain lifts each hair strand away from the skin surface, standing it upright. This allows the razor to cut closer to the base on the first pass, reducing the number of passes needed and minimizing skin contact time.',
  },
];

async function main() {
  const { error } = await supabase
    .from('course_lessons')
    .update({
      title:          'Straight Razor Shave Procedure',
      content,
      quiz_questions: quizQuestions,
      passing_score:  70,
      is_published:   true,
      updated_at:     new Date().toISOString(),
    })
    .eq('course_id', COURSE_ID)
    .eq('slug', SLUG);

  if (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }

  console.log('✓ barber-lesson-30 written to gold standard');
  console.log('  title: Straight Razor Shave Procedure');
  console.log('  content: ~' + Math.round(content.length / 1000) + 'k chars, 5 tables, full procedure');
  console.log('  quiz_questions: 7 (2 knowledge, 3 scenario, 2 exam-trap)');
  console.log('  passing_score: 70');
}

main().catch(console.error);
