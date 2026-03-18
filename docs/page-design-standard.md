# Elevate for Humanity — Page Design Standard

This document is the locked specification for all student-facing marketing and program pages.
Every new page must follow this standard. No exceptions without explicit approval.

---

## 1. Design Tokens

All shared Tailwind class patterns live in `lib/page-design-tokens.ts`.

Import from there. Do not invent one-off class strings for typography, spacing, buttons, chips, or grids.

```ts
import { type, layout, hero, card, btn, bg, chip, grid, ICC_URL, ICC_INSTRUCTION } from '@/lib/page-design-tokens';
```

---

## 2. Required Page Structure

Every student-facing program or marketing page must contain these sections **in this order**:

1. **Hero** — clean media (video or image), no text overlay, no gradient overlay
2. **Page identity block** — white background, below the hero
   - eyebrow label (category · location)
   - H1 (program name or page title)
   - short description (1–2 sentences)
   - metadata chips (duration, format, credential)
   - CTA buttons
3. **What this is** — plain explanation of the program/page
4. **What you will learn / What this includes**
5. **Training environment / real imagery** — at least one real photo section
6. **Credential / outcome**
7. **Funding + payment options** — including Indiana Career Connect block
8. **Final CTA block** — dark background (`bg-slate-900`)

Pages that omit sections 3–8 are considered incomplete and must be expanded.

---

## 3. Hero Rules

- Hero height: `h-[45vh] min-h-[280px] max-h-[560px]`
- No gradient overlay on the hero image or video
- No text, badges, or CTAs rendered on top of the hero media
- All identity content goes in the white panel **below** the hero
- Video heroes attempt unmuted autoplay via `useHeroVideo` hook — no mute button shown

**Correct:**
```tsx
<section className="relative h-[45vh] min-h-[280px] max-h-[560px] w-full overflow-hidden">
  <Image src="..." alt="..." fill className="object-cover" priority />
</section>
<section className="bg-white border-b border-slate-100 py-10 px-4">
  {/* identity content here */}
</section>
```

**Wrong:**
```tsx
{/* ❌ text stacked on video */}
<section className="relative h-[60vh]">
  <video ... />
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 ...">
    <h1 className="text-white">...</h1>
  </div>
</section>
```

---

## 4. Typography Rules

| Element | Class |
|---------|-------|
| Page H1 | `text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight` |
| Section H2 | `text-2xl sm:text-3xl font-extrabold text-slate-900` |
| Card H3 | `text-lg font-bold text-slate-900` |
| Eyebrow | `text-brand-red-600 font-bold text-xs uppercase tracking-widest` |
| Body | `text-slate-700 text-base leading-relaxed` |
| Secondary body | `text-slate-600 text-sm leading-relaxed` |
| Metadata | `text-slate-600 text-sm font-semibold` |
| Fine print | `text-slate-500 text-xs` |

- Never use `text-gray-*` — use `text-slate-*`
- Never use `text-white` or `text-white/90` on a white or light background
- Never use `text-xs` for important body content
- Body text minimum: `text-sm` with `leading-relaxed`
- Dark section text: `text-white` for headings, `text-slate-300` for body

---

## 5. CTA Rules

Every student-facing program page must have these buttons:

| Button | Style | Action |
|--------|-------|--------|
| **Enroll Now / Apply Now** | `bg-brand-red-600` primary | `/apply?program=...` |
| **Request Information** | `border-2 border-slate-300` secondary | `/contact?program=...` |
| **Go to Indiana Career Connect** | `bg-brand-blue-600` | `https://www.indianacareerconnect.com` |

CTA row wrapper: `flex flex-col sm:flex-row items-stretch sm:items-center gap-3`

Final CTA section background: always `bg-slate-900` — never `bg-white` with white text.

---

## 6. Indiana Career Connect Rule

Any page tied to WIOA, apprenticeship, or state-funded training must include this block
in the funding/enrollment section:

```tsx
<div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
  <p className="text-brand-blue-900 font-semibold text-sm mb-1">Indiana Career Connect</p>
  <p className="text-brand-blue-800 text-sm leading-relaxed mb-4">{ICC_INSTRUCTION}</p>
  <a
    href={ICC_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors text-sm"
  >
    Go to Indiana Career Connect
  </a>
</div>
```

`ICC_URL` and `ICC_INSTRUCTION` are exported from `lib/page-design-tokens.ts`.

---

## 7. Funding / Payment Clarity

Every program page must plainly state:

- Funding may be available for eligible Indiana residents
- WIOA and apprenticeship pathways may require Indiana Career Connect
- Out-of-state students may still enroll where applicable
- BNPL / flexible payment options are available for students who do not qualify for funding

Do not bury this in fine print. It belongs in a dedicated section, not a footnote.

---

## 8. Program Card Rules

All program cards use `components/programs/ProgramCard.tsx`. Structure is locked:

1. Top image — `aspect-[16/9]`, flush (no padding around image)
2. Program name — `text-base font-bold text-slate-900`
3. Short description — `text-slate-600 text-sm leading-relaxed`
4. Metadata chips — duration, format, level
5. CTA — `bg-brand-red-600` "View Program" button

**Prohibited in cards:**
- Green checkmarks
- Colored badge clutter
- Lucide icons as content items
- Icon-led feature lists

---

## 9. Responsive Rules

- All layouts must reflow cleanly at 375px, 768px, 1024px, 1440px
- No fixed pixel widths on content containers
- Use `max-w-6xl mx-auto px-4 sm:px-6` for standard containers
- CTA rows stack vertically on mobile: `flex flex-col sm:flex-row`
- Grid columns: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (never start at 3 cols)
- Images: always use `fill` + `sizes` prop, never fixed `width`/`height` on responsive images

---

## 10. Prohibited Patterns

These patterns are banned on all student-facing pages:

| Pattern | Why |
|---------|-----|
| `text-gray-*` | Use `text-slate-*` |
| `bg-green-*` / `text-green-*` | Use `brand-green-*` |
| `CheckCircle2` / `✓` as list bullets | Use `w-1.5 h-1.5 rounded-full bg-brand-red-500` dot |
| `Award` / `Briefcase` / `GraduationCap` as content icons | Use text-only cards |
| Gradient overlay on hero | Content goes below hero |
| `text-white` on `bg-white` | Invisible — use `bg-slate-900` for dark CTAs |
| `text-white/90` on light background | Invisible |
| `bg-white/10 border-white/10` on white | Invisible |
| `bg-gradient-to-r from-indigo-600 to-purple-600` | Non-brand color |
| Step numbers: `bg-white text-white` | Invisible — use `bg-brand-red-600 text-white` |
| Sparse pages (hero + 2 cards + CTA) | Every page must fully explain itself |
| Icon-led content sections | Use real images or text-only cards |

---

## 11. Shared Components

Use these components. Do not create page-specific alternatives.

| Component | Path | Purpose |
|-----------|------|---------|
| `ProgramDetailPage` | `components/programs/ProgramDetailPage.tsx` | All individual program pages |
| `ProgramPageLayout` | `components/programs/ProgramPageLayout.tsx` | Category-level program pages |
| `ProgramCard` | `components/programs/ProgramCard.tsx` | All program grid cards |
| `ProgramCategoryPage` | `components/programs/ProgramCategoryPage.tsx` | Healthcare, Trades, Tech category pages |
| `ProgramHeroBanner` | `components/ProgramHeroBanner.tsx` | Video hero for program pages |
| `PageVideoHero` | `components/ui/PageVideoHero.tsx` | Video hero for marketing pages |
| `HomeHeroVideo` | `components/ui/HomeHeroVideo.tsx` | Home page video only |

---

## 12. Section Rhythm

Alternate section backgrounds to create visual separation:

```
bg-white → bg-slate-50 → bg-white → bg-slate-50 → bg-slate-900 (final CTA)
```

Add `border-t border-slate-100` between same-color adjacent sections.

Section padding: `py-12 sm:py-16` standard, `py-8 sm:py-12` tight, `py-16 sm:py-20` wide.

---

## 13. Accessibility

- All images must have descriptive `alt` text — never `alt=""`
- Buttons must be tappable on mobile: minimum `py-3` (44px touch target)
- Color contrast: body text minimum 4.5:1 against background
- `text-slate-600` on white passes WCAG AA — `text-slate-400` does not for body text
- Focus states must be visible — do not remove `focus-visible:` styles
- Page hierarchy must be clear: one H1 per page, H2 for sections, H3 for cards
