import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LessonVideoReview from '@/components/admin/course-builder/LessonVideoReview';

const review = { artifactVersionId: 'immutable-video-93', version: 93, decision: 'unreviewed' };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('saved lesson video change requests', () => {
  it('opens an editable request without submitting an empty review or starting a render', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    render(<LessonVideoReview buildId="build" lessonBuildId="lesson" review={review} onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    expect(screen.getByRole('textbox', { name: 'What needs to change?' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save change request' })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('saves the actual instructions against the exact immutable video and confirms persistence', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, message: 'Change request saved for video version 93. No repair has been scheduled.' }) });
    vi.stubGlobal('fetch', fetch); const saved = vi.fn();
    render(<LessonVideoReview buildId="build" lessonBuildId="lesson" review={review} onSaved={saved} />);
    fireEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Replace the unrelated classroom photograph with a salon demonstration.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save change request' }));
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe('/api/admin/ultimate-course-builder/review');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ buildId: 'build', lessonBuildId: 'lesson', artifactVersionId: 'immutable-video-93', action: 'request_change', comment: 'Replace the unrelated classroom photograph with a salon demonstration.' });
    expect(screen.getByRole('status')).toHaveTextContent('No repair has been scheduled');
  });

  it('preserves instructions and exposes the failure when saving is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Saved video not found.' }) }));
    const saved = vi.fn();
    render(<LessonVideoReview buildId="build" lessonBuildId="lesson" review={review} onSaved={saved} />);
    fireEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Restore the pictures.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save change request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Saved video not found.');
    expect(screen.getByRole('textbox')).toHaveValue('Restore the pictures.');
    expect(saved).not.toHaveBeenCalled();
  });

  it('shows an existing request and allows editing its saved instructions', () => {
    render(<LessonVideoReview buildId="build" lessonBuildId="lesson" review={{ ...review, decision: 'request_change', comment: 'Replace scene 3 photo.' }} onSaved={vi.fn()} />);
    expect(screen.getByText('Replace scene 3 photo.')).toBeVisible();
    expect(screen.getByText(/This review does not schedule a repair/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Edit change request' }));
    expect(screen.getByRole('textbox')).toHaveValue('Replace scene 3 photo.');
  });

  it('cancels without changing the saved review', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    render(<LessonVideoReview buildId="build" lessonBuildId="lesson" review={review} onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Draft note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps approval separate from requesting a change', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, message: 'Review saved.' }) });
    vi.stubGlobal('fetch', fetch);
    render(<LessonVideoReview buildId="build" lessonBuildId="lesson" review={review} onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Approve this video version' }));
    await screen.findByRole('status');
    expect(JSON.parse(fetch.mock.calls[0][1].body).action).toBe('approve');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).not.toHaveProperty('comment');
  });
});
