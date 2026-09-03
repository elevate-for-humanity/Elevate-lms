import { describe, it, expect } from 'vitest';
import {
  normalizeEnrollmentState,
  getEnrollmentRoute,
  hasLmsAccess,
  canShowConfirmedPage,
  canCompleteOrientation,
  canSubmitDocuments,
} from '@/lib/enrollment/enrollment-flow';

describe('enrollment-flow', () => {
  it('normalizes legacy states to DB-valid values', () => {
    expect(normalizeEnrollmentState('confirmed')).toBe('onboarding');
    expect(normalizeEnrollmentState('orientation_complete')).toBe('enrolled');
    expect(normalizeEnrollmentState('documents_complete')).toBe('active');
    expect(normalizeEnrollmentState('applied')).toBe('applied');
  });

  it('routes students through confirm → orientation → documents → dashboard', () => {
    expect(getEnrollmentRoute('onboarding')).toBe('/enrollment/confirmed');
    expect(getEnrollmentRoute('orientation')).toBe('/enrollment/orientation');
    expect(getEnrollmentRoute('enrolled')).toBe('/enrollment/documents');
    expect(getEnrollmentRoute('active')).toBe('/learner/dashboard');
  });

  it('only grants LMS access in active state', () => {
    expect(hasLmsAccess('active')).toBe(true);
    expect(hasLmsAccess('enrolled')).toBe(false);
    expect(hasLmsAccess('orientation_complete')).toBe(false);
  });

  it('gates each enrollment step correctly', () => {
    expect(canShowConfirmedPage('applied')).toBe(true);
    expect(canShowConfirmedPage('orientation')).toBe(false);
    expect(canCompleteOrientation('orientation')).toBe(true);
    expect(canCompleteOrientation('enrolled')).toBe(false);
    expect(canSubmitDocuments('enrolled')).toBe(true);
    expect(canSubmitDocuments('onboarding')).toBe(false);
  });
});
