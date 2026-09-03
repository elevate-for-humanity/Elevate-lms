# ORPHANED & SHADOWED ROUTE MAP (PITCH AUDIT)

This report maps the 180+ "Review Needed" admin routes identified in the System Integrity Audit.

## 1. SHADOWED ROUTES (Redirected but Code Exists)
The following routes have `page.tsx` files but are bypassed by `next.config.mjs` redirects. 

| Route | Redirects To | Recommendation |
|-------|--------------|----------------|
| `/admin/governance` | `/admin/compliance` | **Archive** - Code is from 2024 and refers to old schema. |
| `/admin/course-generator` | `/admin/courses/create` | **Merge** - Generator logic is superior to the basic create form. |
| `/admin/autopilot` | `/admin/dashboard` | **Restore** - This is a "Brain" component for the pitch. |
| `/admin/email-marketing` | `/admin/campaigns` | **Archive** - Use the new `/staff/campaigns` architecture. |

## 2. SNAP E&T ORPHANS (Proposed for Deletion)
The following routes are specific to the ended SNAP program.

| Route | Status |
|-------|--------|
| `/app/admin/fssa-impact` | **Orphaned Stub** - No inbound links. |
| `/app/fssa` | **Marketing Orphan** - Points to dead program. |
| `/app/snap-et-partner` | **Marketing Orphan** - Dead agency link. |

## 3. VR & STUDIO PROTECTION (DO NOT DELETE)
These are your "Moat" components.

| Route | Purpose | Status |
|-------|---------|--------|
| `/admin/studio` | Dev Studio Deviant (Platform Brain) | **PROTECTED** |
| `/admin/staff-portal/vr` | The Bosses (VR OS) | **RESTORED & PROTECTED** |
| `/api/devstudio/*` | Automation Engine | **PROTECTED** |

## 4. NEXT STEPS
- [ ] Approve the **Archive** of Shadowed routes.
- [ ] Approve the **Systematic Purge** of SNAP E&T text references.
- [ ] Approve the **Restoration** of the Autopilot dashboard.

---
*Mapping generated for Elizabeth Greene - Pitch Readiness Audit*
