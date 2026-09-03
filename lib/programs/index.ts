/**
 * Canonical public program data paths (marketing + education + enrollment).
 *
 * | Use case | Function |
 * |----------|----------|
 * | /programs grid + SEO count | getPublicProgramsPageData() |
 * | /programs/catalog search | loadProgramCatalog() |
 * | Sector cards (/education) | getMarketingProgramSectors() |
 * | Program detail pages | getProgramBySlug() |
 */

export {
  getPublicProgramsPageData,
  buildProgramsListingMetadata,
  resolvePublicProgramCount,
  PROGRAMS_PAGE_SUPPRESSED_SLUGS,
} from './public-programs-page';

export {
  loadPublishedProgramsListing,
  loadProgramCatalog,
  type ProgramsListingItem,
  type CatalogProgram,
} from './load-program-catalog';

export { getMarketingProgramSectors, type ProgramSectorCard } from './catalog-sectors';

export { getProgramBySlug } from './get-program';
