# Page Design Standard — Elevate for Humanity

This document defines the non-negotiable rules for every page on the Elevate platform. All new pages must follow this standard. Deviations require explicit justification.

---

## Hero

- Use `components/marketing/HeroVideo.tsx` for every hero banner
- Define per-page content in `content/heroBanners.ts`
- **No gradient overlays** on the video frame (`bg-gradient-to-t`, `from-black`, pseudo-element overlays)
- **No text on the video** — no headlines, subheadlines, paragraphs, checklists, or CTAs rendered on top of the video
- All primary messaging renders **below the video frame**
- Provide a `posterImage` on every hero (reduced-motion and load-failure fallback)
- Provide a `transcript` for every hero with a voiceover
- Allowed on-video: sound toggle (bottom-right), play/pause (bottom-right), micro-label 2–4 words max (bottom-left)

Full spec: `docs/hero-video-standard.md`

---

## Program Pages

Every program page uses `components/programs/ProgramDetailPage.tsx` and must render these sections in this order:

1. Hero (video or image — no text overlay)
2. Program identity block (title, subtitle, spec panel)
3. What the program is (intro paragraphs)
4. What you will learn (curriculum modules)
5. Training environment (real images, facility info)
6. Credential / outcome (credentials earned, outcomes list)
7. Funding + payment (enrollment tracks, WIOA, self-pay, payment plan)
8. Final CTA (Apply, Request Information, Indiana Career Connect where applicable)

No section may be omitted. No section may be reordered.

---

## Program Cards

Every program card must use the shared card component and include:

- Real photograph (no icons, no gradients as content)
- Program name
- Short description (1–2 sentences)
- Meta row: duration + credential
- CTA row: primary action button

No green checkmarks. No badge clutter. No icon-based feature blocks. No inconsistent layouts between cards.

---

## CTA System

Every page must answer: **what do I do next?**

Standard CTA order (where applicable):
1. **Apply Now** / **Enroll Now** — primary action
2. **Request Information** — links to `/contact?program=<slug>` (pre-fills program context)
3. **Indiana Career Connect** — only on WIOA/apprenticeship program pages, opens in new tab

Rules:
- No `href="#"` dead links
- No buttons without routes or handlers
- No conflicting CTAs on the same page
- CTA style is consistent: use brand color buttons, not custom per-page styles
- Payment plan mention required on every self-pay program page

---

## Indiana Career Connect

- Only shown on WIOA-eligible and apprenticeship program pages
- Must be clearly labeled as an external link (↗ indicator)
- Opens in new tab with `target="_blank" rel="noopener noreferrer"`
- Set via `cta.careerConnectHref` in the program schema — do not hardcode
- Not shown on non-WIOA pages

---

## Typography

- Body text: `text-slate-700` minimum on white backgrounds
- Headings: `text-slate-900`
- No `text-slate-400` or lighter for body copy
- No `text-white` on white or near-white backgrounds
- No `text-*-100` or `text-*-200` on light backgrounds
- Minimum readable size: `text-sm` (14px) for body, `text-xs` (12px) for metadata only
- Line height: `leading-relaxed` for body paragraphs

---

## Invisible Text — Prohibited Patterns

These combinations are always bugs:

| Background | Prohibited text color |
|---|---|
| `bg-white` | `text-white`, `text-slate-100`, `text-*-100` |
| `bg-slate-50` | `text-white`, `text-slate-100` |
| Any dark bg (`bg-slate-900`, `bg-brand-blue-7+`) | `text-slate-900`, `text-slate-600`, `text-gray-600` |

---

## Shared Components — Required Usage

| Element | Component |
|---|---|
| Hero banner | `components/marketing/HeroVideo.tsx` |
| Program page | `components/programs/ProgramDetailPage.tsx` |
| Program card | shared card component (do not inline) |
| CTA section | use `cta` fields from program schema |
| Forms | standardized form components with labels, validation, error/success states |
| Rate limiting | `lib/api/withRateLimit.ts` — `applyRateLimit` |
| Auth guard | `lib/admin/guards.ts` — `apiAuthGuard` / `apiRequireAdmin` |
| Error responses | `lib/api/safe-error.ts` — `safeError` / `safeInternalError` |

No page may bypass these shared components without explicit justification in code comments.

---

## Forms

Every form must have:
- Labels on all fields
- Required field markers
- Correct placeholder text (no lorem ipsum, no "Enter value here")
- Client-side validation with visible error states
- Server-side validation
- Success state or confirmation message
- Correct backend route or server action
- No silent failures

---

## Page Completeness

Every page must answer all of these:
- What is this?
- Who is it for?
- What do I get?
- What do I learn? (program pages)
- What outcome do I get?
- How do I pay?
- What do I do next?

No empty sections. No placeholder content. No thin layouts with one paragraph and a button.

---

## Routing

- No broken internal links
- No `href="#"` anywhere
- Program cards → correct program pages
- CTAs → correct destination (no mismatch)
- No duplicate pages with different URLs
- Marketing ↔ LMS routing is intentional and consistent
- External links clearly identified with ↗ and `target="_blank"`

---

## Mobile

- All buttons minimum 44px tap target
- No overlapping UI elements
- No hidden CTAs on mobile
- Forms usable without zoom
- Navigation works on all screen sizes
- Images do not overflow or get cut off

---

## What Is Never Acceptable

- A page that looks different from all others without justification
- A button that does nothing
- A link that goes to the wrong place
- A form that fails silently
- A page that doesn't tell the user what to do next
- Content that repeats on the same page
- Placeholder or lorem ipsum text in production
- Icons used as primary content (use real images)
