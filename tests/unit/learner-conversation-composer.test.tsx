import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConversationComposer from '@/components/lms/ConversationComposer';

afterEach(cleanup);

describe('learner conversation composer', () => {
  it('keeps the draft and announces a rejected send so it cannot look successful', async () => {
    const action = vi.fn().mockResolvedValue({ error: 'You cannot send a message to this member.' });
    render(<ConversationComposer recipientId="recipient" action={action} />);
    const input = screen.getByRole('textbox', { name: 'Message' });
    fireEvent.change(input, { target: { value: 'Keep this draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('You cannot send a message to this member.');
    expect(input).toHaveValue('Keep this draft');
    expect(action.mock.calls[0][0].get('content')).toBe('Keep this draft');
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });
  it('prevents a duplicate submission while waiting and retains a draft after transport failure', async () => {
    let reject!: (reason: Error) => void;
    const action = vi.fn().mockReturnValue(new Promise((_resolve, rejectPromise) => { reject = rejectPromise; }));
    render(<ConversationComposer recipientId="recipient" action={action} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), { target: { value: 'Pending draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: 'Sending…' }));
    expect(action).toHaveBeenCalledTimes(1);
    reject(new Error('disconnected'));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not confirm whether your message was sent');
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('Pending draft');
  });
});
