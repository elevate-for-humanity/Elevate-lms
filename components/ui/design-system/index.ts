/**
 * DESIGN SYSTEM — canonical component barrel
 *
 * Import from here, not from individual files.
 * These components are the single source of truth for UI patterns.
 *
 * Rules:
 * - Use these everywhere — no custom one-offs on pages
 * - No improvising spacing, typography, or color
 * - Mobile-first, collapse intelligently
 * - See docs/DESIGN_SYSTEM.md for full usage guide
 */

// Layout
export { Container } from './Container';
export { Section } from './Section';
export { PortalShell } from './PortalShell';
export type { PortalNavItem } from './PortalShell';

// Typography / Page structure
export { PageHeader } from './PageHeader';

// Interactive
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Data display
export { Card } from './Card';
export { StatCard } from './StatCard';
export { DataTable } from './DataTable';
export type { DataTableColumn } from './DataTable';
export { StatusBadge } from './StatusBadge';

// Forms
export { FormField } from './FormField';

// Utility
export { Accordion, AccordionGroup } from './Accordion';
export { ShowMore } from './ShowMore';
export { EmptyState } from './EmptyState';
