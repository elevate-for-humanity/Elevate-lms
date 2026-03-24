# Course Engine

Every course on Elevate LMS is built from a **blueprint**. The blueprint is the single source of truth for structure, video format, and activity menu. No per-program code is written — define the blueprint, run the seeder, and the engine renders the course automatically.

---

## How It Works End to End

```
1. Blueprint file          lib/curriculum/blueprints/[program].ts
        ↓
2. Register it             lib/curriculum/blueprints/index.ts
        ↓
3. Run seeder              pnpm tsx scripts/seed-course-from-blueprint.ts
        ↓
4. DB rows created         courses → course_modules → course_lessons
   Each lesson gets:         lesson_type  (from slug suffix)
                             activities   (NHA-style menu, from step_type)
                             video_config (locked format from blueprint)
        ↓
5. Run video generator     node scripts/generate-blueprint-videos.mjs
   Per lesson:               GPT-4o writes unique script
                             DALL-E 3 generates unique background
                             HeyGen renders avatar video
                             ffmpeg adds branding bar
   Output:                  public/[programSlug]/videos/[lesson-slug].mp4
        ↓
6. Course is live          /lms/courses/[courseId]
   Landing page:             Module accordion with activity menu per lesson
   Lesson page:              Activity tabs (Video, Reading, Flashcards, Lab, Practice, Checkpoint)
```

---

## Adding a New Program — Step by Step

### 1. Copy the template

```bash
cp lib/curriculum/blueprints/_template.ts lib/curriculum/blueprints/[program-slug].ts
```

### 2. Fill in the blueprint

Open the file and update:

| Field | What to set |
|---|---|
| `id` | Stable machine ID: `cna-indiana-v1`, `bookkeeping-v1` |
| `credentialTitle` | Full credential name: `CNA Certification` |
| `programSlug` | Must match `programs.slug` in the DB |
| `state` | Two-letter state code or `federal` |
| `videoConfig.instructorName` | Instructor name for video overlay |
| `videoConfig.topBarColor` | Brand color for this program |
| `videoConfig.ttsVoice` | `onyx` (male) or `nova` (female) |
| `modules[]` | Define all modules with `lessons[]` arrays |
| `expectedModuleCount` | Must match `modules.length` exactly |
| `expectedLessonCount` | Must match total `lessons[]` entries exactly |

The hard guard at the bottom of the file will throw at module load time if the counts are wrong — you'll catch it before the seeder runs.

### 3. Register the blueprint

Add it to `lib/curriculum/blueprints/index.ts`:

```ts
import { MY_PROGRAM_BLUEPRINT } from './my-program';

export const BLUEPRINT_REGISTRY: CredentialBlueprint[] = [
  HVAC_EPA608_BLUEPRINT,
  MY_PROGRAM_BLUEPRINT,  // ← add here
];
```

### 4. Seed the course

```bash
# Dry run first — see what would be written
pnpm tsx scripts/seed-course-from-blueprint.ts \
  --blueprint my-program-v1 \
  --program <programs.id from DB> \
  --dry-run

# Seed (safe to re-run — skips existing lessons)
pnpm tsx scripts/seed-course-from-blueprint.ts \
  --blueprint my-program-v1 \
  --program <programs.id from DB>

# Full rebuild (wipes and re-seeds)
pnpm tsx scripts/seed-course-from-blueprint.ts \
  --blueprint my-program-v1 \
  --program <programs.id from DB> \
  --mode replace
```

### 5. Generate lesson videos

```bash
# All lessons for this program
node scripts/generate-blueprint-videos.mjs --program my-program-slug

# One module at a time (recommended — test first)
node scripts/generate-blueprint-videos.mjs --module module-one

# Single lesson
node scripts/generate-blueprint-videos.mjs --lesson module-one-01

# Dry run — see what would be generated
node scripts/generate-blueprint-videos.mjs --program my-program-slug --dry-run
```

Videos are saved to `public/[programSlug]/videos/[lesson-slug].mp4`. The lesson page reads `video_url` from `course_lessons` — run the seeder after generating videos to wire the URLs.

---

## Slug Conventions

The seeder infers `lesson_type` from the slug suffix. **Never change a slug after seeding** — it is the durable identity.

| Slug suffix | lesson_type | Activity menu | Completion rule |
|---|---|---|---|
| `-checkpoint` | `checkpoint` | Video · Reading · Flashcards · Practice · **Checkpoint Quiz** | Pass quiz (70%) — gates next module |
| `-exam` | `exam` | Video · Flashcards · Practice · **Exam** | Pass exam (75%) |
| `-lab` | `lab` | Video · Reading · **Hands-On Lab** | Instructor sign-off |
| `-assignment` | `assignment` | Video · Reading · **Assignment** | Instructor sign-off |
| `-quiz` | `quiz` | Video · Flashcards · Practice · **Quiz** | Pass quiz (no gate) |
| anything else | `lesson` | Video · Reading · Flashcards · Practice | Mark complete |

---

## Activity Menu

Every lesson gets an `activities` JSONB column that drives the NHA-style tab bar on the lesson page. The seeder sets this automatically based on `lesson_type`. Instructors can override per-lesson in the admin curriculum builder.

```
Lesson 4: Compressors and Their Function
─────────────────────────────────────────
▶ Watch Lesson Video          ● Required
📖 Reading                    ● Required
🃏 Flashcards                 ○ Optional
⚡ Practice Questions         ○ Optional
```

```
Lesson 5: Module Checkpoint Quiz
─────────────────────────────────────────
▶ Watch Lesson Video          ● Required
📖 Reading                    ● Required
🃏 Flashcards                 ○ Optional
⚡ Practice Questions         ● Required
🛡 Checkpoint Quiz            🔒 Complete above first
```

---

## Video Format

The `videoConfig` in the blueprint locks the visual identity for every lesson video. The video generator reads it — do not change after videos are produced.

```ts
videoConfig: {
  template:           'elevate-slide',
  instructorName:     'Marcus Johnson',
  instructorTitle:    'Lead Instructor',
  instructorImagePath: '/images/instructors/marcus-johnson.jpg',
  topBarColor:        '#f97316',   // orange top bar
  accentColor:        '#3b82f6',
  backgroundColor:    '#0f172a',   // dark navy
  ttsVoice:           'onyx',
  ttsSpeed:           0.95,
  slideCount:         5,
  segments:           ['intro', 'concept', 'visual', 'application', 'wrapup'],
  generateDalleImage: true,
  dalleImageStyle:    'natural',
  width:              1920,
  height:             1080,
}
```

Each lesson gets a **unique** video:
- GPT-4o writes a 4-minute script using the lesson title + module context
- DALL-E 3 generates a relevant background image for the lesson topic
- HeyGen renders the avatar with the script
- ffmpeg adds the orange top bar + title overlay

---

## File Map

| File | Purpose |
|---|---|
| `lib/curriculum/blueprints/types.ts` | All blueprint types — `CredentialBlueprint`, `BlueprintModule`, `BlueprintVideoConfig` |
| `lib/curriculum/blueprints/_template.ts` | Copy this to create a new blueprint |
| `lib/curriculum/blueprints/hvac-epa-608.ts` | HVAC / EPA 608 blueprint (reference implementation) |
| `lib/curriculum/blueprints/index.ts` | Registry — all blueprints registered here |
| `lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts` | Seeder core — writes courses → course_modules → course_lessons |
| `scripts/seed-course-from-blueprint.ts` | CLI seeder — run this to seed any blueprint |
| `scripts/generate-blueprint-videos.mjs` | Video generator — produces one video per lesson |
| `supabase/migrations/20260503000022_course_lessons_activity_config.sql` | Adds `video_config` + `activities` columns to `course_lessons` |
| `components/lms/CourseModuleAccordion.tsx` | Module accordion with per-lesson activity menu |
| `app/lms/(app)/courses/[courseId]/page.tsx` | Course landing page |
| `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` | Lesson page with activity tabs |

---

## Rules

- **Never change a slug after seeding.** Slugs are the durable identity for lesson progress, checkpoint scores, and video files.
- **Never hardcode per-program logic in the lesson page.** Set `lesson_type` in the blueprint and the renderer handles it.
- **Never write to `training_lessons` for new programs.** That table is HVAC legacy archive only.
- **Always run `--dry-run` before seeding a new program** to verify the lesson count and structure.
- **Always run one module first** when generating videos to verify the format before generating all 48+.
- **The hard guard in each blueprint file is non-negotiable.** `expectedModuleCount` and `expectedLessonCount` must match exactly or the file throws at load time.
