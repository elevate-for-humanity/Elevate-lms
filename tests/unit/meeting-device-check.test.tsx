import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MeetingDeviceCheck } from '@/components/program-holder/MeetingDeviceCheck';
const stop = vi.fn();
const getUserMedia = vi.fn();
const getDisplayMedia = vi.fn();
let original: PropertyDescriptor | undefined;
beforeEach(() => {
  original = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
  const track = { stop, addEventListener: vi.fn() };
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
  stop.mockReset(); getUserMedia.mockReset().mockResolvedValue(stream); getDisplayMedia.mockReset().mockResolvedValue(stream);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia, getDisplayMedia } });
});
afterEach(() => { cleanup(); if (original) Object.defineProperty(navigator, 'mediaDevices', original); else Reflect.deleteProperty(navigator, 'mediaDevices'); });
it('requests devices only on click and stops capture when leaving the tab', async () => {
  const view = render(<MeetingDeviceCheck />);
  expect(getUserMedia).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Test camera and microphone' }));
  await screen.findByText(/Camera preview is on/);
  expect(getUserMedia).toHaveBeenCalledWith({ audio: true, video: true });
  view.unmount(); expect(stop).toHaveBeenCalled();
});
it('opens the screen picker only on click and lets the user stop sharing', async () => {
  render(<MeetingDeviceCheck />);
  fireEvent.click(screen.getByRole('button', { name: 'Test screen sharing' }));
  await screen.findByText(/Screen preview is on/);
  fireEvent.click(screen.getByRole('button', { name: 'Stop preview' }));
  expect(stop).toHaveBeenCalled();
  expect(getDisplayMedia).toHaveBeenCalledWith({ video: true, audio: false });
});
it('reports denied permission without implying the devices work', async () => {
  getUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
  render(<MeetingDeviceCheck />);
  fireEvent.click(screen.getByRole('button', { name: 'Test camera and microphone' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Preview did not start'));
  expect(screen.queryByRole('button', { name: 'Stop preview' })).not.toBeInTheDocument();
});
