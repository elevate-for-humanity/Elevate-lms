# Apply pages — health check checklist

**Gold standard reference:** `/programs/barber-apprenticeship` (hero video frame clean, content below, CTAs, funding, imagery throughout).

Run automated checks:

```bash
pnpm exec tsx scripts/audit-apply-pages.mjs
pnpm exec tsx scripts/audit-apply-content-health.mjs
BASE_URL=https://www.elevateforhumanity.org pnpm exec tsx scripts/audit-apply-content-health.mjs --http
pnpm exec vitest run tests/unit/apply-menu-surfaces.test.ts tests/unit/apply-pages-audit.test.ts
```

## Apply menu (header) — must include

| Link | URL |
|------|-----|
| Quick intake | `/apply` |
| Full student app | `/apply/student` |
| FSSA waitlist | `/apply/fssa/waitlist` |
| Track | `/apply/track` |
| Barber host | `/partners/barber-host-shop/apply` |
| Cosmetology host | `/partners/cosmetology-host-shop/apply` |
| **Esthetician host** | `/partners/esthetician-apprenticeship/apply` |
| **Nail host** | `/partners/nail-technician-apprenticeship/apply` |
| Program applies | `/programs/barber-apprenticeship/apply`, cosmo, HVAC, esthetician, nail, PRS, QMA |

## Per-page manual QA (click every URL)

- [ ] **Hero:** Picture or `HeroVideo` — no gradient wash on media; no H1 on video
- [ ] **Below hero:** Headline + subhead in white panel (`text-slate-*`)
- [ ] **CTAs:** Apply + Request info (or program-specific) — real `href`, not `#`
- [ ] **Imagery:** At least one workforce photo; images use `sizes` + not stretched
- [ ] **Not sparse:** More than hero + 3 bullets (explain funding, steps, credentials)
- [ ] **Not text-wall:** Break up long paragraphs; use lists/cards
- [ ] **Form submit:** Network tab shows 2xx to correct API route
- [ ] **BNPL / pay later:** Program checkout shows Stripe/BNPL where configured

## Student paths (clarified in UI)

| Path | When to use |
|------|-------------|
| `/apply` | 3–5 min funding / eligibility screen |
| `/apply/student` | Full enrollment application |
| `/programs/{slug}/apply` | Dedicated apprenticeship/program flows |

## Host shop uploads

| Page | License upload | COI upload |
|------|----------------|------------|
| Barber host | Required | Optional at submit |
| Cosmetology host | Required | Optional at submit |

## Stripe / production

- [ ] `STRIPE_WEBHOOK_SECRET` set in production (Northflank secret group)
- [ ] Webhook endpoint: `https://www.elevateforhumanity.org/api/webhooks/stripe`
- [ ] Test mode events received in Stripe Dashboard → Developers → Webhooks
- [ ] BNPL: `lib/bnpl-config.ts` + program payment pages reference Stripe Checkout

## DB

- [ ] Run pending migrations in Supabase SQL Editor (including `beauty-career-educator` unarchive if not applied)

## Sign-off

| Area | Owner | Date | Pass? |
|------|-------|------|-------|
| Apply menu links | | | |
| Host shop forms | | | |
| Student apply UX | | | |
| Stripe webhooks | | | |
| Content/hero pass | | | |
