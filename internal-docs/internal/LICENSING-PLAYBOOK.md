# Licensing Playbook — Elevate Workforce Platform

## Pricing Tiers

### Self-Serve (Stripe Checkout)

| Plan | Monthly | Annual | Students | Admins | Programs |
|------|---------|--------|----------|--------|----------|
| **Starter** | $99/mo | $899/yr | 100 | 1 | 3 |
| **Professional** | $299/mo | $2,499/yr | 500 | 5 | Unlimited |

### Enterprise (Contact Sales)

| Plan | Price | Type |
|------|-------|------|
| **Implementation License** | $35,000 – $50,000 | One-time |
| **Implementation + Annual** | $60,000 – $90,000 | Year 1 |
| **Annual Renewal** | $15,000 – $30,000 | Per year |

---

## Lead Plan Strategy

**Default lead: Professional — $299/mo or $2,499/yr**

This is the plan you anchor almost every conversation around.

### Framing Script

> "Most organizations start on our Professional plan to evaluate the platform in real conditions. Larger or funded implementations usually move to an Enterprise license once scale or reporting requirements increase."

### When to Lead with Starter

Only when:
- A very small nonprofit
- A pilot cohort
- A funder-mandated proof-of-concept

Script:
> "Starter is intended for small pilots. Most teams outgrow it quickly."

---

## Hard Limits (Non-Negotiable)

These are walls, not suggestions.

### Student Limits
- **Starter**: 100 max (hard stop)
- **Professional**: 500 max (hard stop)
- **Enterprise**: Unlimited

### Admin Limits
- **Starter**: 1 admin
- **Professional**: 5 admins
- **Enterprise**: Unlimited

### Program Limits
- **Starter**: 3 programs
- **Professional**: Unlimited
- **Enterprise**: Unlimited

### Multi-Site
- Any multi-site deployment = Enterprise. Full stop.

---

## Enterprise Triggers

When any of these occur, the system forces an enterprise conversation:

1. **Student count hits limit** → Hard stop on new enrollments
2. **Admin count hits limit** → Cannot add more admins
3. **Program count hits limit** (Starter only) → Cannot create more programs
4. **Multi-site request** → Immediate enterprise gate
5. **Compliance/audit request** → Enterprise only
6. **Advanced reporting request** → Enterprise only

---

## Enterprise-Only Features

These features are gated regardless of usage:

- Custom CSV export schemas
- Multi-program outcome aggregation
- Funder-by-program reporting
- Multi-site deployment
- Multi-region deployment
- White-label branding
- Compliance audit support
- Dedicated support
- SLA guarantee
- Source code access

---

## Objection Handling

### "Professional is too expensive"

> "We're not priced for individual courses or small tools. This replaces custom development, manual workflows, and reporting risk."

Then stop talking.

If they still push:
> "Starter is available for pilots."

**Never discount Professional.**

### "Why not just stay on SaaS?"

> "Self-serve plans are designed for contained use. Enterprise licensing covers scale, customization, reporting, and long-term stability."

You are selling risk removal, not features.

---

## Limit Enforcement Behavior

### At 80% of Limit
- Warning banner appears
- "You're approaching your limit" message
- Upgrade CTA visible

### At 95% of Limit
- Critical warning banner (red)
- "Almost at limit" message
- Prominent upgrade CTA

### At 100% of Limit
- **Hard stop** on the limited action
- Modal blocks the action
- "Contact sales to continue" message
- No workarounds

---

## Upgrade Paths

| From | To | Trigger |
|------|-----|---------|
| Starter | Professional | Any limit hit |
| Professional | Enterprise | 500 students OR multi-site OR compliance needs |
| Any SaaS | Enterprise | Source code request OR audit support |

---

## What NOT to Do

❌ Add more tiers  
❌ Add "custom" SaaS pricing  
❌ Offer one-off discounts  
❌ Let limits slide quietly  
❌ Auto-upgrade without conversation  
❌ Allow silent overages  

---

## Files Implementing This

| File | Purpose |
|------|---------|
| `/lib/license/types.ts` | Plan definitions, pricing, limits |
| `/lib/license/limits.ts` | Limit checking, enterprise triggers |
| `/lib/license/enforcement.ts` | Server-side enforcement functions |
| `/components/license/LimitWarning.tsx` | UI components for warnings/blocks |
| `/app/store/page.tsx` | Store with all tiers |
| `/app/store/request-license/page.tsx` | Enterprise inquiry form |

---

## Enforcement Functions

```typescript
// Before enrolling a student
const result = canEnrollStudent(planId, status, currentCount);
if (!result.allowed) {
  // Show LimitReachedModal
  // Redirect to result.redirectTo
}

// Before adding an admin
const result = canAddAdmin(planId, status, currentCount);

// Before creating a program
const result = canCreateProgram(planId, status, currentCount);

// Before accessing enterprise features
const result = canAccessFeature(planId, status, 'compliance_audit_support');
```

---

## Revenue Protection Checklist

- [ ] Limits are enforced in code, not just UI
- [ ] No silent overages allowed
- [ ] Enterprise triggers fire automatically
- [ ] Upgrade CTAs are prominent at limits
- [ ] No discounts on Professional
- [ ] Starter positioned as "pilot only"
- [ ] Multi-site always requires enterprise
- [ ] Compliance features gated to enterprise

---

## First 90 Days Focus

1. **Lead with Professional** in all outreach
2. **Enforce limits strictly** from day one
3. **Track who hits limits** — these are enterprise leads
4. **Never negotiate on limits** — only on enterprise pricing
5. **Document every "we need more" conversation** — these validate pricing

---

## Success Metrics

- Professional conversion rate from trial
- Time to enterprise trigger (for Professional users)
- Enterprise inquiry rate from limit-hit users
- Zero silent overages
- Zero discounts given on self-serve
