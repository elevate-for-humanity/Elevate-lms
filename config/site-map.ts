import {
  PUBLIC_ROUTE_REGISTRY,
  PUBLIC_SITE_ORIGIN,
  publicRouteGroups,
} from '@/lib/navigation/public-route-registry';

export type SiteMapItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type SiteMapSection = {
  id: string;
  title: string;
  description?: string;
  items: SiteMapItem[];
};

export const SITE_BASE_URL = PUBLIC_SITE_ORIGIN;

export const siteMapSections: SiteMapSection[] = Array.from(publicRouteGroups().entries()).map(
  ([category, routes]) => ({
    id: category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: category,
    description: `Canonical public ${category.toLowerCase()} pages.`,
    items: routes.map((route) => ({ label: route.label, href: route.path })),
  }),
);

export const siteMapItems: SiteMapItem[] = PUBLIC_ROUTE_REGISTRY.map((route) => ({
  label: route.label,
  href: route.path,
}));
