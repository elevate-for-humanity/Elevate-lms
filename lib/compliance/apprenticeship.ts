export const APPRENTICESHIP = {
  IN: {
    enabled: true,
    state: "Indiana",
    sponsorName: "2Exclusive LLC-S (DBA Elevate for Humanity Career & Technical Institute)",
    system: "U.S. Department of Labor Registered Apprenticeship (RAPIDS)",
    programName: "Barber Apprenticeship",
    earnAndLearn: true,
    registrationNumber: process.env.NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER || "",
    notes:
      "Indiana Registered Apprenticeship program. Earn while you learn. Classroom instruction provided through approved curriculum partners.",
  },
} as const;

export type ApprenticeshipState = keyof typeof APPRENTICESHIP;
