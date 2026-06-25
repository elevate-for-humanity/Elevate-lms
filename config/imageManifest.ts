/**
 * Image Placement Manifest
 * Maps facility and program images to their intended pages/sections
 */

export const imageManifest = {
  homepage: {
    hero: [
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
      '/images/programs/cna-hero.webp',
    ],
    features: [
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
    ],
    dualImage: [
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
    ],
  },

  about: {
    hero: [
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
    ],
    campus: [
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
    ],
  },

  programs: {
    overview: ['/images/programs/cna-hero.webp'],
    healthcare: [
      '/images/programs/cna-hero.webp',
      '/images/programs/cna-hero.webp',
      '/images/programs/cna-hero.webp',
      '/images/programs/cna-hero.webp',
    ],
  },

  campus: {
    hero: '/images/heroes/hero-homepage.webp',
    lobby: [
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
    ],
    cafe: [
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
    ],
    workspaces: [
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
    ],
    meetingRooms: [
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
    ],
    amenities: [
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
      '/images/heroes/hero-homepage.webp',
    ],
  },

  team: {
    alina: '/images/heroes/hero-homepage.webp',
    founder: {
      hero: '/images/team/elizabeth-greene-headshot.webp',
      portrait: '/images/heroes/hero-homepage.webp',
      wide: '/images/heroes/hero-homepage.webp',
    },
  },
};

export type ImageManifest = typeof imageManifest;
