# Blueprint Catalog

**ARCHITECTURE: Canonical Course Model**

> One canonical blueprint per program. Enrollment type determines features.
> DO NOT create separate blueprints for "Program" and "Apprenticeship" variants.

---

## CANONICAL COURSES

| # | Program | Credential | Modules | Lessons | File | Apprenticeship? |
|---|---------|------------|---------|---------|------|----------------|
| 1 | HVAC | EPA Section 608 | 10 | 95 | `hvac.ts` | No |
| 2 | Barber | Indiana Barber License | 8 | 50 | `barber.ts` | **Yes** |
| 3 | CNA | Certified Nursing Assistant | 7 | 49 | `cna.ts` | No |
| 4 | CDL | Class A Driver's License | 6 | 42 | `cdl.ts` | No |
| 5 | Cosmetology | Indiana Cosmetology | 8 | 45 | `cosmetology.ts` | **Yes** |
| 6 | Esthetician | Indiana Esthetician | 7 | 30 | `esthetician.ts` | **Yes** |
| 7 | Manicurist | Indiana Nail Tech | 6 | 26 | `manicurist.ts` | **Yes** |
| 8 | Building Services | Building Services Tech | 7 | 42 | `building-services.ts` | **Yes** |
| 9 | Culinary | Youth Culinary | 6 | 36 | `culinary.ts` | **Yes** |

---

## All Blueprints

### Healthcare Programs

| Blueprint | Credential | Modules | Lessons |
|----------|------------|---------|---------|
| **CNA** | Indiana Certified Nursing Assistant | 7 | 49 |
| **CCMA** | Certified Clinical Medical Assistant | 12 | - |
| **Medical Assistant** | Medical Assistant Certificate | 7 | 49 |
| **Peer Recovery Specialist** | Indiana Peer Recovery Specialist | 6 | 37 |
| **CRS Indiana** | Certified Recovery Specialist | 8 | 40 |

### Skilled Trades Programs

| Blueprint | Credential | Modules | Lessons |
|----------|------------|---------|---------|
| **HVAC** | EPA Section 608 Technician | 10 | 95 |
| **Electrical** | NCCER Level 1 Electrical | 7 | 49 |
| **Plumbing** | NCCER Level 1 Plumbing | 6 | 42 |
| **Welding** | AWS D1.1 Entry Level | 6 | 42 |

### Personal Services Programs

| Blueprint | Credential | Modules | Lessons |
|----------|------------|---------|---------|
| **Barber** | Indiana Barber License | 8 | 50 |
| **Cosmetology** | Indiana Cosmetology License | 8 | 45 |
| **Esthetician** | Indiana Esthetician License | 7 | 30 |
| **Nail Technician** | Indiana Nail Technician License | 6 | 26 |

### Transportation Programs

| Blueprint | Credential | Modules | Lessons |
|----------|------------|---------|---------|
| **CDL Training** | Class A Commercial Driver's License | 6 | 42 |

### Business Programs

| Blueprint | Credential | Modules | Lessons |
|----------|------------|---------|---------|
| **Bookkeeping** | QuickBooks Certified | 5 | 43 |
| **Entrepreneurship** | ESB Certification | 6 | 36 |
| **IT Help Desk** | CompTIA A+ | 7 | 49 |

---

## Barber Apprenticeship - Module Breakdown

The barber blueprint is split into 8 modules for modular content authoring:

| Module | Title | Lessons |
|--------|-------|---------|
| 1 | Infection Control & Safety | 8 |
| 2 | Tool Mastery | 8 |
| 3 | Haircutting Fundamentals | 8 |
| 4 | Advanced Haircutting | 8 |
| 5 | Shaving & Facial Hair | 7 |
| 6 | Color & Chemical Services | 6 |
| 7 | Business & Client Relations | 7 |
| 8 | State Exam Preparation | 6 |
| **Total** | | **50** |

### Barber Module 1 - Sample Content

**Lesson 1: Introduction to Barbering**

Content includes:
- History and legal framework of barbering in Indiana
- DOL apprenticeship structure
- Scope of practice for licensed barbers

**Sample Quiz Question:**
```
Question: What is the minimum contact time for tools 
immersed in EPA-registered barbicide?

Options:
A. 5 minutes
B. 10-15 minutes ✓
C. 20-25 minutes
D. 30 minutes

Explanation: EPA-registered disinfectants like Barbicide typically 
require 10-15 minutes of contact time to ensure proper sanitation.
```

---

## Blueprint File Locations

```
lib/curriculum/blueprints/
├── barber/
│   ├── index.ts           # Main blueprint
│   ├── module-1.ts       # Infection Control & Safety
│   ├── module-2.ts       # Tool Mastery
│   ├── module-3.ts       # Haircutting Fundamentals
│   ├── module-4.ts       # Advanced Haircutting
│   ├── module-5.ts       # Shaving & Facial Hair
│   ├── module-6.ts       # Color & Chemical Services
│   ├── module-7.ts       # Business & Client Relations
│   └── module-8.ts       # State Exam Preparation
├── hvac-epa-608.ts       # HVAC (10 modules, 95 lessons)
├── cna.ts                # CNA (7 modules, 49 lessons)
├── cdl-training.ts       # CDL (6 modules, 42 lessons)
├── cosmetology.ts        # Cosmetology (8 modules, 45 lessons)
├── esthetician.ts        # Esthetics (7 modules, 30 lessons)
├── nail-technician.ts    # Nail Tech (6 modules, 26 lessons)
├── peer-recovery-specialist.ts
├── ccma.ts
├── electrical.ts
├── plumbing.ts
├── welding.ts
└── ...
```

---

## Blueprint Program Data

Program metadata (titles, descriptions, credentials) is stored in:

```
data/programs/
├── barber-apprenticeship.ts
├── cna.ts
├── cdl-training.ts
├── cosmetology-apprenticeship.ts
├── esthetician-apprenticeship.ts
├── nail-technician-apprenticeship.ts
├── hvac-epa-608.ts
├── peer-recovery-specialist.ts
└── ...
```

---

## Usage

### Load a Blueprint

```typescript
import { loadBlueprintWithProgram } from '@/lib/course-factory/blueprint-loader';

// By program slug
const blueprint = await loadBlueprintWithProgram(db, { 
  programSlug: 'barber-apprenticeship' 
});

// By program ID
const blueprint = await loadBlueprintWithProgram(db, { 
  programId: '123e4567-e89b-12d3-a456-426614174000' 
});
```

### Create a Course from Blueprint

```typescript
import { courseFactory } from '@/lib/course-factory';

const result = await courseFactory({
  programSlug: 'barber-apprenticeship',
  mode: 'missing-only',
  contentSource: 'blueprint',
});
```

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete (has full content) |
| ⚠️ | Partial (missing content) |
| 🆕 | Recently created |
| 🔄 | In migration |
