// types/navigation.ts — Canonical site-wide navigation type definitions

export interface NavSubItem {
  name: string;
  href?: string;
  isHeader?: boolean;
  isSectionLink?: boolean;
  isAuth?: boolean;
}

export interface NavItem {
  id: string;
  name: string;
  href?: string;
  subItems?: NavSubItem[];
}
