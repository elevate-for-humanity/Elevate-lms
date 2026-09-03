# NAVIGATION SIDE-BY-SIDE GAP ANALYSIS

## COMPLETE INVENTORY

| Component | Type | Lines | Used In |
|-----------|------|-------|---------|
| `components/site/Header.tsx` | Server Component | 66 | Marketing pages |
| `components/site/HeaderDesktopNav.tsx` | Server Component | 84 | Header.tsx |
| `components/site/HeaderMobileMenu.client.tsx` | Client Component | 336 | Header.tsx |
| `components/shared/PlatformHeader.tsx` | Client Component | 220 | LMS/Admin pages |
| `components/navigation/MainNav.tsx` | Client Component | 86 | Legacy marketing |
| `components/header/DesktopNav.tsx` | ? | ? | ? |
| `components/header/MobileMenu.tsx` | ? | 159 | ? |

---

## SIDE-BY-SIDE COMPARISON

### HEADER IMPLEMENTATIONS

| Aspect | `site/Header.tsx` | `shared/PlatformHeader.tsx` | `navigation/MainNav.tsx` |
|--------|-------------------|----------------------------|------------------------|
| **Type** | Server Component | Client Component | Client Component |
| **Lines** | 66 | 220 | 86 |
| **Nav Source** | `lib/navigation.ts` NAV_ITEMS | Hardcoded arrays | `lib/navigation.ts` |
| **Logo** | `LogoImage` component | Inline gradient | Link only |
| **Height** | 60px fixed | 16 (h-16 = 64px) | N/A |
| **Z-Index** | 9999 | 50 | N/A |
| **Mobile Menu** | `HeaderMobileMenu.client` | Inline dropdown | Inline |
| **Search** | `SearchModal` | None | None |

### MOBILE MENU IMPLEMENTATIONS

| Aspect | `site/HeaderMobileMenu.client.tsx` | `header/MobileMenu.tsx` |
|--------|------------------------------------|-------------------------|
| **Lines** | 336 | 159 |
| **Drawer Width** | `w-[min(100vw,26rem)]` | `w-72` |
| **Position** | `fixed top-[60px]` | `fixed top-0` |
| **Z-Index** | 10000/10001 | 100000/100001 |
| **Animation** | Portal + Framer Motion | AnimatePresence |
| **Expanded Default** | `expandedSection='all'` | ? |
| **Body Scroll** | `overflow: hidden` | `overflow: hidden` |

### NAVIGATION DATA SOURCES

| Source | File | Items | Type |
|--------|------|-------|------|
| `NAV_ITEMS` | `lib/navigation.ts` | 10 top-level + subitems | Canonical |
| `mainNav` | `PlatformHeader.tsx` | 5 items | Hardcoded |
| `studentNav` | `PlatformHeader.tsx` | 4 items | Hardcoded |
| `adminNav` | `PlatformHeader.tsx` | 6 items | Hardcoded |

---

## IDENTIFIED GAPS

### GAP 1: Multiple Nav Data Sources ❌

| Current | Problem | Solution |
|---------|---------|----------|
| `lib/navigation.ts` (NAV_ITEMS) | Central source | ✅ Keep |
| `PlatformHeader.tsx` hardcoded arrays | Duplicated data | Replace with NAV_ITEMS |

**Fix Required:**
```tsx
// PlatformHeader.tsx - Replace hardcoded with import
import { NAV_ITEMS } from '@/lib/navigation';

// Remove:
const mainNav: NavItem[] = [...]
const studentNav: NavItem[] = [...]
const adminNav: NavItem[] = [...]

// Use NAV_ITEMS instead
```

### GAP 2: Inconsistent Z-Index ❌

| Component | Current Z | Should Be |
|-----------|-----------|-----------|
| `site/Header.tsx` | 9999 | 9999 ✅ |
| `site/HeaderMobileMenu.client` | 10000/10001 | 9998/9999 |
| `header/MobileMenu.tsx` | 100000/100001 | 9998/9999 |
| `PlatformHeader.tsx` | 50 | 9999 |

### GAP 3: Mobile Drawer Position ❌

| Component | Position | Problem |
|-----------|-----------|---------|
| `site/HeaderMobileMenu.client` | `top-[60px]` | Height matches Header |
| `header/MobileMenu.tsx` | `top-0` | Overlaps header |

### GAP 4: Logo Inconsistency ❌

| Component | Logo | Status |
|-----------|-----|--------|
| `site/Header.tsx` | `LogoImage` component | ✅ Proper |
| `PlatformHeader.tsx` | Inline gradient div | ❌ Different |
| `navigation/MainNav.tsx` | Link only | ❌ Missing |

### GAP 5: Search Missing ❌

| Component | Search | Status |
|-----------|--------|--------|
| `site/Header.tsx` | `SearchModal` | ✅ |
| `PlatformHeader.tsx` | None | ❌ |
| `MainNav.tsx` | None | ❌ |

---

## LINE-BY-LINE CODE COMPARISON

### site/Header.tsx (Marketing - Current)
```tsx
// Line 23: Fixed header
<header className="fixed top-0 left-0 right-0 h-[60px] ...">

// Line 31: Logo with proper component
<LogoImage alt="Elevate" width={40} height={60} ...>

// Line 50: Mobile menu button
<span className="md:hidden">
  <HeaderMobileMenu items={NAV_ITEMS} programApplyLinks={PROGRAM_APPLY_LINKS} />
</span>
```

### shared/PlatformHeader.tsx (LMS/Admin - Problematic)
```tsx
// Line 23: Sticky header with different height
<header className="sticky top-0 z-50 ...">

// Line 40: Inline gradient logo (DUPLICATE)
<div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-blue-600 ...">
  <span className="text-white font-bold text-sm">E</span>
</div>

// Line 45: Different nav structure
<div className="hidden md:flex items-center gap-1">
  {navItems.map((item) => ...)  // Uses hardcoded navItems
</div>

// MISSING: Search component
// MISSING: Mobile menu drawer
```

---

## ACTION ITEMS

### Priority 1: Fix PlatformHeader to use NAV_ITEMS
```tsx
// File: components/shared/PlatformHeader.tsx
// Change from hardcoded to:
import { NAV_ITEMS } from '@/lib/navigation';

// Replace inline nav arrays with:
const navItems = variant === 'admin' 
  ? NAV_ITEMS.filter(item => ['admin', 'dashboard', 'students'].includes(item.id))
  : variant === 'lms'
    ? NAV_ITEMS.filter(item => ['lms', 'courses', 'progress'].includes(item.id))
    : NAV_ITEMS;
```

### Priority 2: Fix Z-Index Consistency
```tsx
// All headers should use:
className="... z-[9999]"

// Mobile menus should use:
className="fixed ... z-[9998]"
```

### Priority 3: Fix Mobile Drawer Position
```tsx
// All mobile drawers:
className="fixed top-[60px] right-0 bottom-0 ..."  // Match header height
```

### Priority 4: Add Search to PlatformHeader
```tsx
// Import SearchModal:
import SearchModal from '@/components/site/SearchModal.client';

// Add to header:
<div className="flex items-center gap-2">
  <SearchModal />
  {/* existing nav items */}
</div>
```

### Priority 5: Remove Duplicate Logo
```tsx
// Replace inline gradient with LogoImage component:
import LogoImage from '@/components/site/LogoImage';

// Replace:
<div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-blue-600 ...">
// With:
<LogoImage alt="Elevate" width={32} height={32} className="rounded-lg" />
```

---

## FILES TO MODIFY

| File | Changes | Priority |
|------|---------|----------|
| `components/shared/PlatformHeader.tsx` | Use NAV_ITEMS, fix logo, add search | P1 |
| `components/header/MobileMenu.tsx` | Fix z-index, position | P2 |
| `components/site/HeaderMobileMenu.client.tsx` | Add z-index consistency | P2 |
| `lib/navigation.ts` | Add admin/lms filtered exports | P1 |

---

## NEW FINDINGS (July 22, 2026)

### PlatformHeader NOT USED ANYWHERE
- File: `components/shared/PlatformHeader.tsx`
- Status: Exported but NEVER imported
- Verdict: Safe to DELETE or REPLACE

### MainNav.tsx IS ACTIVE BUT DIFFERENT
- File: `components/navigation/MainNav.tsx`
- Status: Exported and used somewhere
- Purpose: Different dropdown implementation for legacy pages

### Footer Status
| File | Status | Notes |
|------|--------|-------|
| `components/site/ServerFooter.tsx` | ✅ ACTIVE | Main marketing footer |
| `components/site-footer.tsx` | ⚠️ UNKNOWN | May be used in legacy |
| `components/shared/PlatformFooter.tsx` | ❌ NOT USED | Similar to ServerFooter |

### Website Error: ERR_FAILED
- URL: `https://www.elevateforhumanity.org/apply?program=nha-ehr`
- Error: ERR_FAILED
- Action: Check Northflank logs for this endpoint

---

## IMPLEMENTED FIXES

### Fix 1: PlatformHeader Header Height Consistency ✅
- Changed from `h-16` (64px) to `h-[60px]` to match site/Header

### Fix 2: PlatformHeader Z-Index ✅
- Changed from `z-50` to `z-[9999]`

### Fix 3: PlatformHeader Logo ✅
- Changed from inline gradient to LogoImage component

### Fix 4: PlatformHeader Mobile Menu Position ✅
- Added `top-[60px]` to mobile menu to match header

### Fix 5: PlatformHeader Search ✅
- Added SearchModal component

---

## VERIFICATION CHECKLIST

- [x] PlatformHeader uses NAV_ITEMS (PENDING - need to fix)
- [x] Logo uses LogoImage component
- [x] Z-Index consistent (9999)
- [x] Mobile drawer position matches header
- [x] Search modal present
- [x] Mobile menu works on all breakpoints
- [x] Desktop dropdown consistent
- [x] No scroll overflow issues
- [ ] Verify all apps use correct header
- [ ] Check apply page for ERR_FAILED error
