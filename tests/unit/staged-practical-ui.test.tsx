import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
vi.mock('@/components/lms/InteractiveVideoPlayer', () => ({
  default: () => <div>Video fixture</div>,
}));
import StagedLessonExperience from '@/components/lms/StagedLessonExperience';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('uploads an actual chosen artifact before submitting the explicit QA attestation', async () => {
  const calls: any[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () =>
          options.body instanceof FormData
            ? { artifact: { id: 'uploaded-file' } }
            : {
                progress: {
                  practical: { revision: 1, status: 'submitted', course_practical_reviews: [] },
                },
              },
      };
    }),
  );
  render(
    <StagedLessonExperience
      runId="run"
      snapshot={{
        practicalRequired: true,
        title: 'QA',
        render: {},
        blueprint: { stages: [], activities: [], assessment: { questions: [] } },
      }}
      initialProgress={{}}
    />,
  );
  const button = screen.getByRole('button', { name: 'Submit QA practical evidence' });
  fireEvent.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent('Choose the labelled QA PNG');
  expect(calls).toHaveLength(0);
  const file = new File(['synthetic artifact fixture'], 'qa.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('QA evidence artifact (PNG)'), {
    target: { files: [file] },
  });
  fireEvent.click(
    screen.getByRole('checkbox', {
      name: 'I confirm this is synthetic QA evidence, not proof of practical skill.',
    }),
  );
  fireEvent.click(button);
  await waitFor(() => expect(calls).toHaveLength(2));
  expect(calls[0].options.body.get('evidence')).toBe(file);
  expect(JSON.parse(calls[1].options.body)).toEqual({
    action: 'practical_submit',
    evidenceId: 'uploaded-file',
    learnerAttestation: true,
  });
  expect(await screen.findByTestId('qa-practical-status')).toHaveTextContent(
    'QA submission revision 1: submitted',
  );
  expect(button).toBeDisabled();
  expect(screen.getByText(/No real competency or credential is awarded/)).toBeTruthy();
});
