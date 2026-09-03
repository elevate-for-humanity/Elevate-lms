# Design System

Single source of truth for UI components, tokens, and usage rules.

## Import path

Always import from the barrel:

```ts
import { Button, Card, StatCard, DataTable, StatusBadge, FormField, PageHeader, EmptyState } from '@/components/ui/design-system';
```

Never import from individual files (`@/components/ui/design-system/Button`).

---

## Tokens

Defined in `tailwind.config.js` (theme.extend) and `styles/design-tokens.css`.

### Brand colors

| Token | Value | Use for |
|---|---|---|
| `brand-red-600` | `#dc2626` | Primary CTA, nav, danger actions |
| `brand-blue-600` | `#2563eb` | Links, info, secondary CTA |
| `brand-orange-600` | `#ea580c` | Accent, highlights |
| `brand-green-600` | `#16a34a` | Success, funded status |

### Content colors (text)

| Token | Use for |
|---|---|
| `content-primary` (`#111827`) | Headings, primary body text |
| `content-secondary` (`#374151`) | Supporting text |
| `content-muted` (`#4B5563`) | Labels, captions |
| `content-disabled` (`#6B7280`) | Disabled states |

Do not use raw `text-gray-*` — use `text-content-*` instead.

### Typography scale

Defined in `tailwind.config.js`. Key sizes:

| Class | Size | Use for |
|---|---|---|
| `text-display-lg` | 50px | Hero headlines |
| `text-h1` | 34px | Page titles |
| `text-h2` | 26px | Section headings |
| `text-h3` | 21px | Card headings |
| `text-body` | 17px | Body copy |
| `text-body-sm` | 15px | Secondary text |
| `text-meta` | 14px | Labels, captions |

### Spacing

| Token | Value | Use for |
|---|---|---|
| `py-section-y` | 64px | Section vertical padding |
| `px-container-x` | 16px | Mobile container padding |
| `p-card-p` | 24px | Card padding |
| `gap-stack` | 24px | Vertical stack spacing |

---

## Components

### Button

```tsx
<Button variant="primary">Apply Now</Button>
<Button variant="secondary">Learn More</Button>
<Button variant="danger" onClick={handleDelete}>Delete</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button loading={isSubmitting}>Submit</Button>
```

**Variants:** `primary` (orange), `secondary` (white/border), `tertiary` (ghost orange), `danger` (red), `outline`, `ghost`, `link`

**Sizes:** `sm` (40px min-h), `md` (48px, default), `lg` (56px), `icon`

Do not use raw `<button>` elements with Tailwind classes — use `Button`.

---

### Card

```tsx
<Card variant="default">...</Card>
<Card variant="elevated" padding="lg">...</Card>
<Card variant="bordered" onClick={handleClick}>...</Card>
```

**Variants:** `default` (border), `bordered` (2px border), `elevated` (shadow)
**Padding:** `none`, `sm` (p-4), `md` (p-4 md:p-6, default), `lg` (p-6 md:p-8)

---

### StatCard

```tsx
<StatCard label="Enrolled" value={142} icon={Users} color="blue" trend="up" trendValue="+12 this week" />
<StatCard label="Revenue" value="$48,200" color="green" loading={isLoading} />
```

**Colors:** `blue`, `green`, `amber`, `red`, `purple`, `slate`

---

### DataTable

```tsx
<DataTable
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'enrolled_at', label: 'Enrolled', sortable: true },
  ]}
  rows={students}
  loading={isLoading}
  onRowClick={(row) => router.push(`/students/${row.id}`)}
  emptyTitle="No students yet"
  emptyMessage="Students will appear here once enrolled."
/>
```

Handles: loading skeletons, empty state, client-side sort, row click. For server-side sort, pass `sortKey`, `sortDir`, and `onSort`.

---

### StatusBadge

```tsx
<StatusBadge status="active" />
<StatusBadge status="pending" dot />
<StatusBadge status="rejected" label="Denied" />
<StatusBadge color="teal" label="Custom" />
```

**Semantic statuses** (auto-map to color + label): `active`, `inactive`, `pending`, `approved`, `rejected`, `completed`, `cancelled`, `draft`, `published`, `archived`, `enrolled`, `waitlisted`, `graduated`, `withdrawn`, `funded`, `unfunded`, `paid`, `unpaid`, `overdue`, `passed`, `failed`, `in_progress`, `not_started`

Do not hand-roll colored spans for status — use `StatusBadge`.

---

### FormField

```tsx
<FormField label="Email" name="email" type="email" required error={errors.email} />
<FormField label="Notes" name="notes" as="textarea" rows={4} hint="Optional context for the reviewer." />
<FormField label="Status" name="status" as="select" value={status} onChange={handleChange}>
  <option value="active">Active</option>
  <option value="inactive">Inactive</option>
</FormField>
```

Handles: label, hint, error message, aria attributes, disabled state. Do not hand-roll label+input+error — use `FormField`.

---

### PageHeader

```tsx
<PageHeader
  title="Enrolled Students"
  subtitle="All active enrollments across programs"
  badge="142 total"
  badgeColor="blue"
  actions={<Button size="sm">Export CSV</Button>}
  breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Students' }]}
/>
```

---

### EmptyState

```tsx
<EmptyState
  title="No applications yet"
  description="Applications will appear here once submitted."
  icon={FileText}
  action={<Button size="sm">Create Application</Button>}
/>
```

---

### PortalShell

Unified sidebar shell for all portals (staff, employer, instructor, program-holder, workforce-board).

```tsx
<PortalShell nav={NAV_ITEMS} portalName="Staff Portal" userEmail={user.email}>
  {children}
</PortalShell>
```

---

## Anti-patterns

| ❌ Don't | ✅ Do |
|---|---|
| `<button className="bg-brand-orange-600 ...">` | `<Button variant="primary">` |
| `<span className="bg-green-100 text-green-800 ...">Active</span>` | `<StatusBadge status="active" />` |
| `<div className="text-gray-500">` | `<div className="text-content-muted">` |
| `<input className="border rounded px-3 ...">` + `<label>` + `<p className="text-red-500">` | `<FormField label="..." error={...} />` |
| One-off table with `<thead>/<tbody>` | `<DataTable columns={...} rows={...} />` |
| `import { Button } from '@/components/ui/design-system/Button'` | `import { Button } from '@/components/ui/design-system'` |

---

## Adding new components

1. Create `components/ui/design-system/ComponentName.tsx`
2. Export from `components/ui/design-system/index.ts`
3. Add usage example to this doc
4. Do not duplicate an existing component — extend it with a new variant/prop instead
