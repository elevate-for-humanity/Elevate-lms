import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CourseIntegrityChecks } from '@/components/admin/course-builder/UnifiedCourseBuilder';
afterEach(() => vi.unstubAllGlobals());
describe('Course inventory integrity checks', () => {
  it('shows persisted course defects and opens the existing course for repair', async () => {
    const onOpen = vi.fn();
    const request = vi.fn().mockResolvedValue(Response.json({ checks: [{ name: 'Published Course Integrity', passed: false, message: '1 course requires repair', issues: [{ courseId: 'existing-course', title: 'Business', issues: ['canonical lessons missing'] }] }] }));
    vi.stubGlobal('fetch', request);
    render(<CourseIntegrityChecks onOpen={onOpen} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Open Business' }));
    expect(screen.getByText('canonical lessons missing')).toBeTruthy();
    expect(onOpen).toHaveBeenCalledWith('existing-course');
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toBe('/api/admin/courses/health');
  });
  it('shows unavailable dependency evidence instead of claiming a passed check', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ checks: [{ name: 'Courses Table', passed: false, message: 'Connection failed' }] }, { status: 503 })));
    render(<CourseIntegrityChecks onOpen={vi.fn()} />);
    expect(await screen.findByText('Connection failed', { exact: false })).toBeTruthy();
  });
  it('shows an authenticated request failure and a retry control', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'Unauthorized' }, { status: 401 })));
    render(<CourseIntegrityChecks onOpen={vi.fn()} />);
    expect((await screen.findByRole('alert')).textContent).toBe('Unauthorized');
    expect(screen.getByRole('button', { name: 'Refresh course checks' })).toBeTruthy();
  });
});
