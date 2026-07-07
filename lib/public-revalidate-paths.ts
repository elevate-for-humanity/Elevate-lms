/**
 * Public marketing routes to bust on deploy / publish.
 * Used by cron and admin "Publish & Update Website".
 */

export const PUBLIC_REVALIDATE_PATHS = [
  '/',
  '/programs',
  '/programs/catalog',
  '/programs/healthcare',
  '/programs/skilled-trades',
  '/programs/technology',
  '/education',
  '/career-training',
  '/impact',
  '/impact/methodology',
  '/outcomes',
  '/success-stories',
  '/funding',
  '/funding/wioa',
  '/funding/wrg',
  '/apply',
  '/enrollment',
  '/about',
  '/contact',
  '/blog',
  '/careers',
  '/workforce-training-indianapolis',
  '/healthcare-training-indianapolis',
  '/programs/skilled-trades',
  '/cna-training-indianapolis',
  '/hvac-training-indianapolis',
  '/cdl-training-indianapolis',
  '/barber-apprenticeship-indianapolis',
  '/wioa-funded-training-indiana',
  '/find-workone',
  '/find-workone/central-indiana',
  '/find-workone/northwest-indiana',
  '/find-workone/northeast-indiana',
  '/find-workone/southern-indiana',
] as const;

export type PublicRevalidatePath = (typeof PUBLIC_REVALIDATE_PATHS)[number];
