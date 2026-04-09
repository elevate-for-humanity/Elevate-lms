# Module 6 — Prebuild Lock Spec
**Status:** SPEC — do not begin lesson prose until this spec is approved  
**Domain:** Chemical Services (Relaxers & Color)  
**Failure cost:** HIGH — bad content in this domain creates unsafe execution logic  
**Rule:** Validator chemical rules must be live before any lesson file is created

---

## Why This Module Is Different

Haircutting errors are visible and correctable. Chemical errors are not.

- Over-processed hair breaks and cannot be repaired
- Scalp burns from relaxer are painful, scarring, and a liability
- Color applied to compromised hair produces unpredictable results
- Contraindications ignored here cause real physical harm

Every lesson in this module must teach **when to stop** with the same weight as **how to proceed**. A student who knows the technique but not the stop conditions is more dangerous than a student who knows nothing.

---

## Lesson Map

| Lesson # | Slug | Title | Core Skill | Primary Risk |
|----------|------|-------|-----------|--------------|
| 35 | `barber-lesson-35` | Chemical Services Overview & Safety | Contraindication assessment, PPE, ventilation | Proceeding without assessment |
| 36 | `barber-lesson-36` | Relaxers — Application & Processing | Strand test, base application, timing, neutralization | Over-processing, scalp burns |
| 37 | `barber-lesson-37` | Hair Color — Theory & Application | Color wheel, developer selection, patch test, application | Allergic reaction, color on compromised hair |
| 38 | `barber-lesson-38` | Chemical Service Corrections & Aftercare | Identifying over-processing, damage assessment, client education | Compounding damage with correction |
| 39 | `barber-module-6-checkpoint` | Module 6 Checkpoint: Chemical Services | Transfer and synthesis across all four lessons | — |

---

## Checkpoint Architecture

**Gate:** 70% (7/10)  
**Question count:** 10  
**Distribution target:**

| Lesson | Questions | Topics |
|--------|-----------|--------|
| L35 | 2 | Contraindication identification, PPE/ventilation requirement |
| L36 | 3 | Strand test interpretation, timing decision, neutralization sequence |
| L37 | 2 | Developer volume selection, patch test protocol |
| L38 | 2 | Over-processing diagnosis, correction decision |
| Cross-module | 1 | Concept: chemical service decision hierarchy (assess → test → apply → monitor → stop) |

**Type distribution — non-negotiable minimums:**
- Scenario (client condition → decision): **≥4**
- Stop-or-proceed judgment (explicit go/no-go under realistic conditions): **≥2** (subset of scenario)
- Failure analysis (what went wrong and why): **≥1**
- Concept (mechanism or definition that drives a decision): **≤2** — no pure recall

**Hard rule:** If more than 2 of 10 questions can be answered by a student who only read the lesson headings, the checkpoint fails. Every question must require reasoning from content, not recognition of terms.

---

## Non-Negotiable Content Requirements Per Lesson

Every lesson in this module must contain all of the following. These are in addition to the standard Module 4 schema requirements.

### 1. Contraindication Section (hard requirement)
A dedicated section listing conditions that require the service to be refused or modified:
- Scalp abrasions, open sores, active dermatitis
- Recent chemical service (timing conflicts)
- Compromised or previously over-processed hair
- Positive patch test result (color lessons)
- Client medication interactions (where relevant)

**Format:** Table with columns: Condition | Risk | Decision (Refuse / Modify / Proceed with caution)

### 2. Strand Test Protocol (L36, L37)
Must include:
- When to perform (before every chemical service)
- How to read the result (elasticity, color lift, breakage)
- What each result means for the service decision
- What to do if the strand test fails

**This is not optional.** A lesson that teaches relaxer application without strand test protocol is incomplete and unsafe.

### 3. Timing Decision Rules (L36)
Must include:
- How to determine processing time (hair texture, previous chemical history, target result)
- How to monitor during processing (visual and tactile checks)
- When to rinse early (over-processing indicators)
- What happens if timing is exceeded (irreversible damage chain)

**Format:** IF/THEN decision rules + a timing monitoring checklist

### 4. Stop Conditions (all lessons — elevated requirement)
Chemical services have more stop conditions than haircutting. Each lesson must include at minimum:
- Pre-service stop conditions (contraindications)
- Mid-service stop conditions (client discomfort, unexpected reaction, timing exceeded)
- Post-service stop conditions (damage assessment before proceeding to next step)

**The stop condition section must be more prominent in this module than in Module 4.** It belongs in the execution standard, not just the critical thinking layer.

### 5. PPE and Ventilation (L35, L36, L37)
Must include:
- Gloves (type and when to change)
- Protective cape and barrier cream
- Ventilation requirements (Indiana shop standards)
- Eye protection for mixing

**Indiana state board tests this.** It must appear in the service order and the state board alignment section.

### 6. Neutralization Sequence (L36)
Must include:
- Why neutralization is required (pH chemistry — brief, not academic)
- Correct neutralization timing
- What happens if neutralization is skipped or rushed
- How to confirm neutralization is complete

### 7. Patch Test Protocol (L37)
Must include:
- When to perform (48 hours before service)
- How to read the result
- What a positive result means (refuse service — no exceptions)
- Documentation requirement

---

## Validator Rules to Add Before Build

The following checks must be added to `lib/curriculum/lesson-schema.ts` before any Module 6 lesson file is created. They apply to all lessons with `slug` containing `barber-lesson-3[5-8]`.

```ts
// Chemical services — contraindication table required
const hasContraindicationTable = /contraindication|Contraindication/i.test(content) && /<table/i.test(content);
if (isChemicalLesson && !hasContraindicationTable) {
  errors.push('Chemical lesson missing contraindication table — required for all Module 6 lessons');
}

// Chemical services — strand test required (L36, L37)
const requiresStrandTest = slug === 'barber-lesson-36' || slug === 'barber-lesson-37';
const hasStrandTest = /strand test/i.test(content);
if (requiresStrandTest && !hasStrandTest) {
  errors.push('Relaxer/color lesson missing strand test protocol — required');
}

// Chemical services — timing decision rules required (L36)
const requiresTiming = slug === 'barber-lesson-36';
const hasTiming = /processing time|over-process|timing/i.test(content) && /IF.*→/i.test(content);
if (requiresTiming && !hasTiming) {
  errors.push('Relaxer lesson missing timing decision rules — required');
}

// Chemical services — patch test required (L37)
const requiresPatchTest = slug === 'barber-lesson-37';
const hasPatchTest = /patch test/i.test(content);
if (requiresPatchTest && !hasPatchTest) {
  errors.push('Color lesson missing patch test protocol — required');
}

// Chemical services — neutralization required (L36)
const requiresNeutralization = slug === 'barber-lesson-36';
const hasNeutralization = /neutrali[sz]/i.test(content);
if (requiresNeutralization && !hasNeutralization) {
  errors.push('Relaxer lesson missing neutralization sequence — required');
}

// Chemical services — PPE required (L35, L36, L37)
const requiresPPE = ['barber-lesson-35', 'barber-lesson-36', 'barber-lesson-37'].includes(slug);
const hasPPE = /gloves|PPE|ventilation/i.test(content);
if (requiresPPE && !hasPPE) {
  errors.push('Chemical lesson missing PPE/ventilation requirements — required');
}
```

---

## Pre-Build Checklist

Before writing any Module 6 lesson prose:

- [ ] This spec is approved
- [ ] Chemical validator rules added to `lib/curriculum/lesson-schema.ts`
- [ ] `scripts/module6/` directory created
- [ ] `scripts/deploy-module6.ts` created (copy of deploy-module4.ts pattern)
- [ ] DB rows confirmed to exist for slugs `barber-lesson-35` through `barber-lesson-38` and `barber-module-6-checkpoint`
- [ ] Module 6 lessons written in order: L35 → L36 → L37 → L38 → checkpoint
- [ ] Each lesson validated before the next is started
- [ ] No lesson deployed until all 5 pass the validator

---

## Lesson 35 — Detailed Spec (Chemical Services Overview & Safety)

This lesson sets the foundation for the entire module. If a student skips or rushes this lesson, every subsequent chemical lesson is built on an unsafe base.

**Must teach:**
- What chemical services are and why they carry higher risk than mechanical services
- The assessment sequence that must happen before every chemical service
- Contraindications — full table
- PPE requirements — gloves, cape, barrier cream, ventilation, eye protection
- Indiana shop ventilation standards for chemical services
- The decision hierarchy: Assess → Test → Apply → Monitor → Stop

**Must not teach:**
- Specific application techniques (those belong in L36/L37)
- Product brand recommendations
- Shortcuts or time-saving modifications to the safety protocol

**Assessment intent:** Force students to apply the contraindication table and PPE requirements under realistic conditions. No recall questions.

---

## Lesson 36 — Detailed Spec (Relaxers)

This is the highest-risk lesson in the module. Over-processing is irreversible. Scalp burns are painful and a liability.

**Must teach:**
- Relaxer chemistry (lye vs. no-lye — brief, practical, not academic)
- Strand test protocol — before every service, no exceptions
- Base vs. no-base application — when and why
- Application sequence — nape first, crown last, why this order matters
- Processing time decision rules — texture, history, target result
- Mid-processing monitoring — visual and tactile checks every 5 minutes
- Over-processing indicators — when to rinse immediately
- Neutralization sequence — why, timing, confirmation
- Post-service assessment — damage check before client leaves

**Stop conditions (must be explicit):**
- Positive strand test → refuse service
- Client reports burning or stinging → rinse immediately, do not wait
- Hair begins to break during processing → rinse immediately
- Processing time exceeded → rinse immediately regardless of result
- Scalp abrasion discovered during application → stop, rinse, document

**Assessment intent:** Timing decisions, over-processing diagnosis, neutralization sequence. No question may be answered without understanding the chemistry or the risk.

---

## Lesson 37 — Detailed Spec (Hair Color)

**Must teach:**
- Color wheel — primary, secondary, complementary (practical application only)
- Level system — 1–10, what it means for developer selection
- Developer volume selection — 10/20/30/40 vol, when each is appropriate
- Patch test protocol — 48 hours before, how to read, positive result = refuse
- Application sequence — root to ends or ends to roots, why it matters
- Processing time monitoring
- Color on compromised hair — why it is contraindicated

**Stop conditions:**
- Positive patch test → refuse service, no exceptions
- Hair is over-processed or breaking → refuse color service
- Client reports scalp burning during processing → rinse immediately
- Color is lifting unevenly → stop and assess before continuing

**Assessment intent:** Developer selection under realistic conditions, patch test decision, color on compromised hair.

---

## Lesson 38 — Detailed Spec (Corrections & Aftercare)

**Must teach:**
- How to identify over-processing (elasticity test, visual assessment)
- What can and cannot be corrected after a chemical service
- The rule: do not compound damage — if hair is compromised, stop
- Client education — what to expect, what to avoid, follow-up timeline
- Product recommendations for chemical aftercare (generic categories, not brands)
- When to refer to a specialist

**Must not teach:**
- That over-processing can always be fixed — it cannot
- That additional chemical services can correct a bad chemical service — they usually cannot

**Assessment intent:** Damage assessment decisions, correction vs. referral judgment, client education scenarios.
