import type { StoreProduct } from './products';

export const workbookProducts = [
  {
    id: '2e03fb81-1385-5391-b34d-a2d3e4e9db8e',
    workbookSlug: 'prestige-elevation-barbering',
    subject: 'Barbering',
    sections: 50,
    image: '/images/courses/prestige-barbering.webp',
  },
  {
    id: '381aff7f-7fdc-58bd-8b65-0d07f4f411ec',
    workbookSlug: 'prestige-elevation-cosmetology',
    subject: 'Cosmetology',
    sections: 40,
    image: '/images/courses/prestige-cosmetology.webp',
  },
  {
    id: '2ee1a1cc-fadf-550d-8f9b-bb1c4752784e',
    workbookSlug: 'prestige-elevation-esthetics',
    subject: 'Esthetics',
    sections: 28,
    image: '/images/courses/prestige-esthetics.webp',
  },
  {
    id: 'c25ba6dc-6ab1-555f-9944-b51e8154f9c2',
    workbookSlug: 'prestige-elevation-nail-technology',
    subject: 'Nail Technology',
    sections: 26,
    image: '/images/courses/prestige-nail-technology.webp',
  },
].map((book) => ({
  ...book,
  slug: `${book.workbookSlug}-workbook`,
  name: `${book.subject} Apprenticeship Workbook`,
  price: 90,
  category: 'digital-workbook' as const,
  description: `${book.sections} guided workbook sections with PARIS narration, one activity per screen, practice prompts, reflection and answers saved to your account.`,
  inStock: true,
  digital: true,
  featured: false,
})) satisfies (StoreProduct & { workbookSlug: string; subject: string; sections: number })[];

export function workbookAccessHref(productId: string | null) {
  const book = workbookProducts.find((book) => book.id === productId);
  return book ? `https://app.elevateforhumanity.org/workbooks/${book.workbookSlug}` : null;
}

export function workbookCover(slug: string, fallback: string) {
  return workbookProducts.find((book) => book.workbookSlug === slug)?.image || fallback;
}
