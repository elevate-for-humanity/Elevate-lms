/**
 * Image Placement Manifest
 * Maps facility and program images to their intended pages/sections
 */

export const imageManifest = {
  homepage: {
    hero: [
      '/images/facility/lobby/lobby-hero-01.jpg',
      '/images/facility/lobby/lobby-hero-02.jpg',
      '/images/facility/atrium/atrium-overlook-01.jpg',
      '/images/programs/marketing/elevate-collage-hero-01.jpg',
    ],
    features: [
      '/images/facility/cafe/cafe-counter-01.jpg',
      '/images/facility/workbar/workbar-window-01.jpg',
      '/images/facility/meeting-rooms-board/meeting-boardroom-01.jpg',
    ],
    dualImage: [
      '/images/facility/lobby/lobby-hero-03.jpg',
      '/images/facility/cafe/cafe-booths-01.jpg',
    ],
  },

  about: {
    hero: [
      '/images/facility/atrium/atrium-overlook-02.jpg',
      '/images/facility/lobby/lobby-hero-04.jpg',
    ],
    campus: [
      '/images/facility/exterior-view/exterior-aerial-01.jpg',
      '/images/facility/elevators/elevators-bank-01.jpg',
      '/images/facility/breakroom/breakroom-01.jpg',
      '/images/facility/waiting-area/waiting-area-01.jpg',
    ],
  },

  programs: {
    overview: [
      '/images/programs/marketing/elevate-collage-hero-01.jpg',
    ],
    healthcare: [
      '/images/programs/healthcare/healthcare-lab-01.jpg',
      '/images/programs/healthcare/healthcare-lab-02.jpg',
      '/images/programs/healthcare/healthcare-lab-03.jpg',
      '/images/programs/healthcare/healthcare-lab-04.jpg',
    ],
  },

  campus: {
    hero: '/images/facility/exterior-view/exterior-aerial-01.jpg',
    lobby: [
      '/images/facility/lobby/lobby-hero-01.jpg',
      '/images/facility/lobby/lobby-hero-02.jpg',
      '/images/facility/lobby/lobby-detail-seating-01.jpg',
      '/images/facility/lobby/lobby-detail-plant-01.jpg',
    ],
    cafe: [
      '/images/facility/cafe/cafe-counter-01.jpg',
      '/images/facility/cafe/cafe-booths-01.jpg',
      '/images/facility/cafe/cafe-booths-02.jpg',
    ],
    workspaces: [
      '/images/facility/workbar/workbar-window-01.jpg',
      '/images/facility/workbar/workbar-window-02.jpg',
      '/images/facility/art-office/office-art-wall-01.jpg',
    ],
    meetingRooms: [
      '/images/facility/meeting-rooms-small/meeting-small-01.jpg',
      '/images/facility/meeting-rooms-board/meeting-boardroom-01.jpg',
      '/images/facility/meeting-rooms-board/meeting-boardroom-02.jpg',
    ],
    amenities: [
      '/images/facility/breakroom/breakroom-01.jpg',
      '/images/facility/waiting-area/waiting-area-01.jpg',
      '/images/facility/balcony/balcony-holiday-01.jpg',
    ],
  },

  team: {
    alina: '/images/team/alina-smith/alina-smith-bio-hero-01.jpg',
    founder: {
      hero: '/images/team/elizabeth-greene.jpg',
      portrait: '/images/team/founder/elizabeth-greene-founder-portrait-01.jpg',
      wide: '/images/team/founder/elizabeth-greene-founder-wide-01.jpg',
    },
  },
};

export type ImageManifest = typeof imageManifest;
