/**
 * Ultimate Course Builder is a clean-room course-construction authority.
 * Legacy Course Builder/Course Factory orchestration must not be imported here.
 * Shared platform infrastructure (database, storage, auth, rendering runtimes,
 * and external data providers) is accessed only through new Ultimate adapters.
 */
export const ULTIMATE_ARCHITECTURE_VERSION='1.0.0';
export const ULTIMATE_SUBSYSTEMS=['credential','workforce','instructional','learning','assessment','media','film','mastery','quality','release'] as const;
