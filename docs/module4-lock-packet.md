# Module 4 — Lock Packet
**Status:** LOCKED  
**Locked:** 2026-04  
**Course:** Barber Apprenticeship (`3fb5ce19-1cde-434c-a8c6-f138d7d7aa17`)  
**Validator:** `scripts/validate-lesson.ts` + `lib/curriculum/lesson-schema.ts`

---

## Module Inventory

| Slug | Title | File Size | DB Row ID |
|------|-------|-----------|-----------|
| `barber-lesson-22` | Head Shape & Sectioning | 25,811c | `e149f354-3d1d-4887-93e8-1009852533f4` |
| `barber-lesson-23` | The Fade — Low, Mid & High | 27,623c | `66ff4a7c-1eae-4ff5-92e2-7ddee95c39e6` |
| `barber-lesson-24` | Clipper Over Comb | 26,291c | `bd4d57e7-9d0e-411a-a243-b2f9463eccc2` |
| `barber-lesson-25` | Scissor Over Comb | 25,800c | `1d40cf96-4565-4520-b544-a8728dc6a5e9` |
| `barber-lesson-26` | Lineup & Edging | 31,632c | `1177189e-6100-4459-a6ae-e7aa4c07e91b` |
| `barber-lesson-27` | Flat Top & Classic Cuts | 30,431c | `7d5a5336-1c9d-4de8-aacf-6f6d29e15349` |
| `barber-module-4-checkpoint` | Module 4 Checkpoint: Haircutting Techniques | — | `b6f78a26-2a37-4036-8f44-ebdeee15d99f` |

---

## Lesson → Core Skill → Displaced Concept → Quiz Intent

| Lesson | Core Skill | Displaced Concept (→ Checkpoint) | Quiz Intent |
|--------|-----------|----------------------------------|-------------|
| 22 — Head Shape & Sectioning | Sectioning pattern, elevation angle, landmark identification | Shrinkage on curly hair (→ CP Q1) | Judgment under variation (curly hair, density, cowlick) |
| 23 — The Fade | Gradient execution, scoop motion, open-lever blending | Open-lever definition (→ CP Q6 partial) | Failure diagnosis under real conditions (keloids, banding, coarse hair) |
| 24 — Clipper Over Comb | Blade parallel to comb, comb angle as length control | Blade position mechanics (→ CP Q6) | Gouge diagnosis, fine hair variation, taper angle |
| 25 — Scissor Over Comb | Still blade position, feathering, wet vs. dry | Still blade mechanics (→ CP Q6 partial) | Clicking/dull blade diagnosis, fine hair finish, short section |
| 26 — Lineup & Edging | Skin tension, blade angle, center-point-first | Edge quality variables (→ CP Q9) | Receding hairline conflict, widow's peak, sideburn asymmetry diagnosis |
| 27 — Flat Top & Classic Cuts | Level comb technique, corner definition, four-cut structure | Flat top structural definition (→ CP Q1 partial) | Sloping plane diagnosis, taper step line, curved crown assessment |

**Rule:** Do not remove or replace CP Q6 or CP Q9 without restoring concept coverage in the affected lesson quizzes. These questions carry displaced instructional weight — they are not redundant.

---

## Checkpoint Question Distribution

| Q# | ID | Lesson Coverage | Type | Topic |
|----|-----|----------------|------|-------|
| Q1 | `mod4-cp-q1` | L22 | Scenario | Shrinkage on coily hair — wet cut adjustment |
| Q2 | `mod4-cp-q2` | L22 | Concept | Parietal ridge — fade start reference point |
| Q3 | `mod4-cp-q3` | L23 | Scenario | Uneven fade line — correction direction rule |
| Q4 | `mod4-cp-q4` | L23 | Scenario | Keloid scarring — contraindication and adaptation |
| Q5 | `mod4-cp-q5` | L24 | Failure-diagnosis | Horizontal line — clipper over comb mid-pass stop |
| Q6 | `mod4-cp-q6` | L24/L25 | Concept | Comb = length control; cutting tool = removal |
| Q7 | `mod4-cp-q7` | L25 | Failure-diagnosis | Ragged ends — dull scissors diagnosis |
| Q8 | `mod4-cp-q8` | L26 | Scenario | Razor bumps — tool selection contraindication |
| Q9 | `mod4-cp-q9` | L26 | Concept | Edge quality variables: blade angle, skin tension, speed |
| Q10 | `mod4-cp-q10` | L27 | Scenario | Caesar — growth pattern conflict, pre-cut assessment |

**Distribution by lesson:** L22 ×2, L23 ×2, L24 ×2, L25 ×1, L26 ×2, L27 ×1  
**Distribution by type:** Scenario ×5, Concept ×2, Failure-diagnosis ×2, (Q10 is scenario/next-step hybrid)  
**Gate:** 70% (7/10 correct to unlock Module 5)

**⚠ L25 and L27 are under-represented (1 question each).** Acceptable at lock — both lessons have strong coverage in the lesson quizzes. If the checkpoint is ever expanded to 12 questions, add one scenario for L25 (wet vs. dry variation) and one for L27 (level comb technique).

---

## Validator Rules (as of lock date)

File: `lib/curriculum/lesson-schema.ts`

| Check | Type | Pattern |
|-------|------|---------|
| Objective present | Error | `<h3>Objective</h3>` |
| Terminology table | Error | `<table` + `Term` + `Definition` + `Why It Matters` |
| Service order `<ol>` | Error | `Non-Negotiable Service Order` + `<ol>` |
| Visual block (light) | Error | `background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px` |
| Service flow snapshot (dark) | Error | `background:#0f172a` |
| State board drill (amber) | Error | `background:#fef3c7;border:1px solid #f59e0b` |
| Failure modes table | Error | `Failure Modes` + `<table` |
| Execution standard `<ol>` | Error | `Execution Standard` + `<ol>` |
| IF/THEN decision rules | Error | `<strong>IF</strong>` (≥3 occurrences) |
| Content length ≥10,000c | Error | `content.length < 10000` |
| Stop conditions | Warning | `stop\|do not proceed\|abort\|inform the client\|contraindication` |
| Tool diagnostics | Warning | `dull blade\|blade is dull\|replace.*blade\|blade pulls\|blade skips\|dragging` |
| Pressure calibration | Warning | `skin should not\|indenting\|weight of the tool\|weight of the scissor\|taut\|no downward pressure` |
| Quiz: 5 questions | Error | `quizQuestions.length !== 5` |
| Quiz type distribution | Warning | 2 scenario, 1 next-step, 1 failure-diagnosis, 1 concept (deliberate deviations documented here) |

**Known deliberate deviations from quiz type distribution:**

| Lesson | Deviation | Reason |
|--------|-----------|--------|
| L23 | 3 scenario, 0 concept | Concept (open-lever definition) displaced to CP Q6 |
| L24 | 3 scenario, 0 concept | Concept (blade position) displaced to CP Q6 |
| L25 | 3 scenario, 0 concept | Concept (still blade mechanics) displaced to CP Q6 |
| L26 | 3 scenario, 0 concept | Concept (edge quality variables) displaced to CP Q9 |
| L27 | 3 scenario, 0 concept | Concept (flat top structure) partially covered in CP Q2/Q10 |

These are not schema drift. They are intentional redistributions. Do not "fix" them by adding recall questions back to the lessons.

---

## Validator Limitation — Texture IF/THEN Check

**Current state:** The validator does NOT check for texture IF/THEN logic. It checks for stop conditions, tool diagnostics, and pressure calibration by keyword pattern — but hair texture variation is not validated.

**Why this matters:** A lesson could pass the validator while mentioning "coarse" once in a non-instructional context. The texture IF/THEN logic in each lesson was added manually and verified by review — not by the validator.

**Recommended fix before Module 6:** Add a validator check for texture variation:
```ts
const hasTextureVariation = /IF.*coarse|IF.*fine|IF.*curly|coarse.*hair.*→|fine.*hair.*→|curly.*hair.*→/i.test(content);
if (!hasTextureVariation) {
  warnings.push('Missing hair texture variation — lesson should include IF/THEN rules for coarse, fine, or curly hair');
}
```

This check should be added to `lib/curriculum/lesson-schema.ts` before Module 6 lessons are written, so the pattern is enforced from the start rather than retrofitted.

---

## Pre-Coursebuilder Checklist

- [x] All 6 lessons pass validator with zero errors
- [x] Checkpoint passes validator
- [x] All 7 rows confirmed live in DB
- [x] Displaced concept map documented (this file)
- [x] Checkpoint question distribution audited — no topic over-weighted by recent editing
- [x] Deliberate quiz type deviations documented
- [ ] Texture IF/THEN validator check added before Module 6 begins
- [ ] Module 6 lessons written using this schema from the start (not retrofitted)
