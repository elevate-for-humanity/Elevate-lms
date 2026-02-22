# Fake Data Audit Report

Generated: 2026-02-02

## Summary

This audit identifies hardcoded data that should either be:
1. **Removed** - If it's placeholder/fake
2. **Moved to DB** - If it's real data that should be dynamic
3. **Kept** - If it's static content that doesn't change

---

## 🔴 HIGH PRIORITY: Fake Testimonials

### app/page.tsx (Homepage)
**Lines 24-28** - Hardcoded testimonials with fake names:
```tsx
const testimonials = [
  { quote: "...", name: 'Maria S.', role: 'CNA Graduate' },
  { quote: "...", name: 'James T.', role: 'HVAC Technician' },
  { quote: "...", name: 'Ashley R.', role: 'Medical Assistant' },
];
```
**Action:** Replace with DB-backed testimonials or remove section

### app/testimonials/page.tsx
**Lines 12-48** - Full fake testimonials with names:
- Maria Rodriguez
- James Thompson  
- Aisha Johnson
**Action:** Wire to `testimonials` table or use real verified testimonials

### app/supersonic-fast-cash/multi-site/page.tsx
**Lines 93+** - Fake testimonials for tax service
**Action:** Remove or replace with real client testimonials

---

## 🟡 MEDIUM PRIORITY: Hardcoded Stats

### app/jri/page.tsx
**Lines 111-116** - Stats that may not be accurate:
```tsx
const stats = [
  { value: '100%', label: 'Free Training' },  // OK - factual
  { value: '85%', label: 'Placement Goal' },  // Verify this is real goal
  { value: '6+', label: 'Career Programs' },  // Should be dynamic
  { value: '24/7', label: 'Support' },        // OK - factual
];
```
**Action:** Verify stats are accurate, make program count dynamic

### app/transparency/page.tsx
**Lines 18-19** - Location/funding stats:
```tsx
{ label: 'Funding Sources', value: '5+' },
{ label: 'Indiana Locations', value: '3+' },
```
**Action:** Verify accuracy or make dynamic

---

## 🟢 LOW PRIORITY: Demo/Sample Pages (Acceptable)

These are intentionally demo/sample data for demonstration purposes:

- `app/store/demo/*` - Demo store pages
- `app/demo/*` - Demo pages
- `app/admin/reports/samples/*` - Sample report formats
- `app/leaderboard/page.tsx` - Gamification demo

**Action:** Keep as-is (demo pages are acceptable)

---

## 🔵 STATIC CONTENT (Keep As-Is)

These contain real organizational information:

### app/page.tsx - Partners
**Lines 37-43** - Real partner logos:
```tsx
const partners = [
  { name: 'US DOL', logo: '/images/partners/usdol.webp' },
  { name: 'WorkOne', logo: '/images/partners/workone.webp' },
  // ... real partners
];
```
**Action:** Keep - these are real partnerships

### Feature/Benefit Lists
Most `const features = [...]` and `const benefits = [...]` arrays contain:
- Accurate service descriptions
- Real program features
- Factual information

**Action:** Keep - this is marketing copy, not fake data

---

## Incomplete/Stub Pages

None found. All pages have real content.

---

## Recommended Fixes

### 1. Homepage Testimonials (app/page.tsx)
Replace hardcoded testimonials with:
```tsx
// Option A: Remove testimonials section entirely
// Option B: Wire to testimonials table
const { data: testimonials } = await supabase
  .from('testimonials')
  .select('*')
  .eq('published', true)
  .eq('featured', true)
  .limit(3);

// If no testimonials, don't render section
if (!testimonials?.length) return null;
```

### 2. Testimonials Page (app/testimonials/page.tsx)
Wire to database:
```tsx
const { data: testimonials } = await supabase
  .from('testimonials')
  .select('*')
  .eq('published', true)
  .order('created_at', { ascending: false });
```

### 3. Dynamic Stats
Create a `site_stats` table or compute from real data:
```sql
-- Get real program count
SELECT COUNT(*) FROM programs WHERE is_active = true;

-- Get real graduate count (if tracked)
SELECT COUNT(*) FROM enrollments WHERE status = 'completed';
```

---

## Files Requiring Changes

| File | Issue | Priority | Action |
|------|-------|----------|--------|
| `app/page.tsx` | Fake testimonials | 🔴 HIGH | Wire to DB or remove |
| `app/testimonials/page.tsx` | Fake testimonials | 🔴 HIGH | Wire to DB |
| `app/supersonic-fast-cash/multi-site/page.tsx` | Fake testimonials | 🟡 MED | Remove or verify |
| `app/jri/page.tsx` | Unverified stats | 🟡 MED | Verify accuracy |
| `app/transparency/page.tsx` | Hardcoded counts | 🟡 MED | Make dynamic |

---

## What's NOT Fake

The following are **real content** and should stay:
- Partner logos (real partnerships)
- Program descriptions (accurate info)
- Feature lists (real features)
- About page content (real org info)
- Team member info (real people)
- Contact information (real addresses)
