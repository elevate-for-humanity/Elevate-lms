import { act, renderHook, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWorkbookSave } from '@/components/lms/useWorkbookSave';
import { emptyWorkbookAnswers, validWorkbookSave } from '@/lib/lms/workbook-validation';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const initial = {
  section_id: 'section-one',
  answers: { ...emptyWorkbookAnswers(), notes: 'Previously saved' },
  reviewed: false,
  version: 3,
  updated_at: '2026-10-27T00:00:00Z',
};
const ok = (version: number) =>
  new Response(JSON.stringify({ section_id: 'section-one', version }), { status: 200 });

describe('Account workbook saving', () => {
  it('flushes the final edit when dashboard navigation unmounts the editor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(4));
    vi.stubGlobal('fetch', fetchMock);
    const view = renderHook(() => useWorkbookSave('section-one', initial));
    act(() =>
      view.result.current.edit({
        ...view.result.current.draft,
        answers: { ...emptyWorkbookAnswers(), notes: 'Save before leaving' },
      }),
    );
    view.unmount();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).answers.notes).toBe('Save before leaving');
  });
  it('loads saved answers and persists clearing an answer, using its current version', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(4));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useWorkbookSave('section-one', initial));
    expect(result.current.draft.answers.notes).toBe('Previously saved');
    act(() => result.current.edit({ answers: emptyWorkbookAnswers(), reviewed: true }));
    await act(async () => {
      await result.current.save();
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      answers: emptyWorkbookAnswers(),
      reviewed: true,
      expectedVersion: 3,
    });
    expect(result.current.status).toBe('Saved to your account');
  });
  it('serializes changes made while an earlier request is still saving', async () => {
    let resolveFirst!: (response: Response) => void;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(ok(5));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useWorkbookSave('section-one', initial));
    act(() =>
      result.current.edit({
        ...result.current.draft,
        answers: { ...emptyWorkbookAnswers(), notes: 'First edit' },
      }),
    );
    let saving!: Promise<boolean>;
    act(() => {
      saving = result.current.save();
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    act(() =>
      result.current.edit({
        ...result.current.draft,
        answers: { ...emptyWorkbookAnswers(), notes: 'Latest edit' },
      }),
    );
    await act(async () => {
      resolveFirst(ok(4));
      await saving;
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      expectedVersion: 4,
      answers: { notes: 'Latest edit' },
    });
    expect(result.current.status).toBe('Saved to your account');
  });
  it('retains the draft and never claims saved on a failed connection; retry succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Connection lost'))
      .mockResolvedValueOnce(ok(4));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useWorkbookSave('section-one', initial));
    act(() =>
      result.current.edit({
        ...result.current.draft,
        answers: { ...emptyWorkbookAnswers(), notes: 'Keep my work' },
      }),
    );
    await act(async () => {
      expect(await result.current.save()).toBe(false);
    });
    expect(result.current.error).toBe(true);
    expect(result.current.status).not.toBe('Saved to your account');
    expect(result.current.draft.answers.notes).toBe('Keep my work');
    await act(async () => {
      expect(await result.current.save()).toBe(true);
    });
    expect(result.current.status).toBe('Saved to your account');
  });
  it('does not retry over newer work after a conflict', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'Newer answers exist' }), { status: 409 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useWorkbookSave('section-one', initial));
    act(() =>
      result.current.edit({
        ...result.current.draft,
        answers: { ...emptyWorkbookAnswers(), notes: 'My draft' },
      }),
    );
    await act(async () => {
      await result.current.save();
    });
    await act(async () => {
      await result.current.save();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.draft.answers.notes).toBe('My draft');
  });
  it('autosaves after typing and leaves read-only previews unchanged', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(4));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useWorkbookSave('section-one', initial));
    act(() =>
      result.current.edit({
        ...result.current.draft,
        answers: { ...emptyWorkbookAnswers(), notes: 'Automatic save' },
      }),
    );
    await waitFor(() => expect(result.current.status).toBe('Saved to your account'), {
      timeout: 3000,
    });
    const preview = renderHook(() => useWorkbookSave('section-one', initial, true));
    act(() => preview.result.current.edit({ answers: emptyWorkbookAnswers(), reviewed: true }));
    expect(preview.result.current.draft.answers.notes).toBe('Previously saved');
  });
});
describe('Workbook request validation', () => {
  const valid = { answers: emptyWorkbookAnswers(), reviewed: false, expectedVersion: 0 };
  it('accepts blank answers so deletions persist', () =>
    expect(validWorkbookSave(valid)).toBe(true));
  it('rejects arbitrary fields, nested objects, oversized text and invalid versions', () => {
    expect(validWorkbookSave({ ...valid, answers: { ...valid.answers, user_id: 'other' } })).toBe(
      false,
    );
    expect(validWorkbookSave({ ...valid, answers: { ...valid.answers, notes: {} } })).toBe(false);
    expect(
      validWorkbookSave({ ...valid, answers: { ...valid.answers, notes: 'x'.repeat(6001) } }),
    ).toBe(false);
    expect(validWorkbookSave({ ...valid, expectedVersion: -1 })).toBe(false);
  });
});
