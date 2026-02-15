import { logger } from '@/lib/logger';
/**
 * Demo Tour Progress Persistence
 * Tracks user progress through guided tours
 * Uses localStorage as primary storage (DB fallback available)
 */

import { DemoLicenseType } from './context';

const STORAGE_KEY_PREFIX = 'elevate_demo_tour_progress_';

export interface TourProgress {
  tourId: DemoLicenseType;
  currentStep: number;
  completedSteps: string[];
  startedAt: string;
  lastUpdatedAt: string;
}

/**
 * Get progress for a specific tour (client-side)
 */
export function getProgress(userId: string, tourId: DemoLicenseType): TourProgress | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId}_${tourId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as TourProgress;
  } catch {
    return null;
  }
}

/**
 * Initialize or get progress for a tour
 */
export function initProgress(userId: string, tourId: DemoLicenseType): TourProgress {
  const existing = getProgress(userId, tourId);
  if (existing) return existing;
  
  const newProgress: TourProgress = {
    tourId,
    currentStep: 1,
    completedSteps: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
  
  saveProgress(userId, newProgress);
  return newProgress;
}

/**
 * Save progress to localStorage
 */
export function saveProgress(userId: string, progress: TourProgress): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId}_${progress.tourId}`;
    progress.lastUpdatedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (e) {
    logger.error('Failed to save tour progress:', e);
  }
}

/**
 * Mark a step as complete
 */
export function setStepComplete(userId: string, tourId: DemoLicenseType, stepId: string): TourProgress {
  const progress = getProgress(userId, tourId) || initProgress(userId, tourId);
  
  if (!progress.completedSteps.includes(stepId)) {
    progress.completedSteps.push(stepId);
  }
  
  saveProgress(userId, progress);
  return progress;
}

/**
 * Advance to next step
 */
export function advanceStep(userId: string, tourId: DemoLicenseType, currentStepId: string, totalSteps: number): TourProgress {
  const progress = setStepComplete(userId, tourId, currentStepId);
  
  if (progress.currentStep < totalSteps) {
    progress.currentStep += 1;
  }
  
  saveProgress(userId, progress);
  return progress;
}

/**
 * Reset progress for a tour
 */
export function resetProgress(userId: string, tourId: DemoLicenseType): TourProgress {
  const newProgress: TourProgress = {
    tourId,
    currentStep: 1,
    completedSteps: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
  
  saveProgress(userId, newProgress);
  return newProgress;
}

/**
 * Get all tour progress for a user
 */
export function getAllProgress(userId: string): TourProgress[] {
  if (typeof window === 'undefined') return [];
  
  const tours: DemoLicenseType[] = ['institution_admin', 'partner_employer', 'workforce_program'];
  const progress: TourProgress[] = [];
  
  for (const tourId of tours) {
    const p = getProgress(userId, tourId);
    if (p) progress.push(p);
  }
  
  return progress;
}

/**
 * Check if a tour is complete
 */
export function isTourComplete(userId: string, tourId: DemoLicenseType, totalSteps: number): boolean {
  const progress = getProgress(userId, tourId);
  if (!progress) return false;
  return progress.completedSteps.length >= totalSteps;
}

/**
 * Get completion percentage for a tour
 */
export function getTourCompletionPercent(userId: string, tourId: DemoLicenseType, totalSteps: number): number {
  const progress = getProgress(userId, tourId);
  if (!progress || totalSteps === 0) return 0;
  return Math.round((progress.completedSteps.length / totalSteps) * 100);
}
