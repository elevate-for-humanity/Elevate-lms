import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const natural = vi.hoisted(() => ({ play: vi.fn(), stop: vi.fn() }));
vi.mock('@/components/voice/useNaturalVoice', () => ({ useNaturalVoice: () => ({ ...natural, isPlaying:false, isLoading:false }) }));
import { TenantIntroduction } from '@/components/tenant/TenantIntroduction';
import { introductionMediaUrl } from '@/components/tenant/TenantRecordedIntroduction';
import { TenantPreviewProvider } from '@/components/tenant/TenantPreviewContext';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });
const props = { narration:'Customer approved transcript', audioUrl:'/audio/customer/intro.mp3', musicUrl:'https://assets.example/music.mp3' };

it('starts only after a click, pauses/resumes and replays a completed recording', async () => {
  const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
  const pause=vi.spyOn(HTMLMediaElement.prototype,'pause');
  const {container}=render(<TenantIntroduction {...props} />);
  const [voice] = container.querySelectorAll('audio');
  expect(play).not.toHaveBeenCalled();
  expect(voice).toHaveAttribute('preload','none');
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  fireEvent.click(await screen.findByRole('button',{name:'Pause introduction'}));
  expect(pause).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Resume introduction'}));
  await screen.findByRole('button',{name:'Pause introduction'});
  voice.currentTime=12;fireEvent.ended(voice);
  fireEvent.click(screen.getByRole('button',{name:'Replay introduction'}));
  await screen.findByRole('button',{name:'Pause introduction'});
  expect(voice.currentTime).toBe(0);
  expect(natural.play).not.toHaveBeenCalled();
});
it('keeps optional music off until requested, quiet under narration, and paused on completion', async () => {
  vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
  const {container}=render(<TenantIntroduction {...props} />);
  const [voice,music]=container.querySelectorAll('audio');
  fireEvent.click(screen.getByRole('button',{name:'Background music off'}));
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  await screen.findByRole('button',{name:'Pause introduction'});
  expect(music.volume).toBe(0.13);
  const pause=vi.spyOn(music,'pause');fireEvent.ended(voice);
  expect(pause).toHaveBeenCalled();
});
it('pauses a delayed music start if the visitor turns music off before it resolves', async () => {
  let finishMusic!:()=>void;
  let music: HTMLAudioElement;
  vi.spyOn(HTMLMediaElement.prototype,'play').mockImplementation(function(this:HTMLMediaElement){
    return this === music ? new Promise<void>(resolve=>{finishMusic=resolve}) : Promise.resolve();
  });
  const {container}=render(<TenantIntroduction {...props} />);
  music=container.querySelectorAll('audio')[1];
  fireEvent.click(screen.getByRole('button',{name:'Background music off'}));
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  await screen.findByRole('button',{name:'Pause introduction'});
  fireEvent.click(screen.getByRole('button',{name:'Background music on'}));
  const pause=vi.spyOn(music,'pause');pause.mockClear();
  await act(async()=>finishMusic());
  expect(pause).toHaveBeenCalled();
  expect(screen.getByRole('button',{name:'Background music off'})).toHaveAttribute('aria-pressed','false');
  expect(screen.getByRole('button',{name:'Pause introduction'})).toBeTruthy();
});
it('does not resume a pending play after cancellation or component removal', async () => {
  let resolve!:()=>void;
  vi.spyOn(HTMLMediaElement.prototype,'play').mockImplementation(()=>new Promise<void>(r=>{resolve=r}));
  const {container,unmount}=render(<TenantIntroduction {...props} />);
  const voice=container.querySelector('audio')!;const pause=vi.spyOn(voice,'pause');
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  fireEvent.click(screen.getByRole('button',{name:'Cancel introduction'}));
  pause.mockClear();await act(async()=>resolve());
  expect(pause).toHaveBeenCalled();
  expect(screen.getByRole('button',{name:'Resume introduction'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Resume introduction'}));
  unmount();pause.mockClear();await act(async()=>resolve());
  expect(pause).toHaveBeenCalled();
});
it('stops old audio when a page or saved audio source changes', async () => {
  vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
  const {container,rerender}=render(<TenantIntroduction {...props} />);
  const pause=vi.spyOn(container.querySelector('audio')!,'pause');
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  await screen.findByRole('button',{name:'Pause introduction'});
  rerender(<TenantIntroduction {...props} audioUrl="/audio/customer/next.mp3" narration="Next page" />);
  expect(pause).toHaveBeenCalled();
  expect(screen.getByRole('button',{name:'Listen to the introduction'})).toBeTruthy();
});
it('retains the transcript when playback fails', async () => {
  vi.spyOn(HTMLMediaElement.prototype,'play').mockRejectedValue(Error('unavailable'));
  render(<TenantIntroduction {...props} />);
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('temporarily unavailable'));
  expect(screen.getByText(props.narration)).toBeTruthy();
});
it('does not request recording URLs or enable playback in private saved-version review', () => {
  const {container}=render(<TenantPreviewProvider websiteId="review" readOnly><TenantIntroduction {...props} /></TenantPreviewProvider>);
  expect(screen.getByRole('button',{name:'Listen to the introduction'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Background music off'})).toBeDisabled();
  for(const audio of container.querySelectorAll('audio')) expect(audio).not.toHaveAttribute('src');
});
it.each(['javascript:alert(1)','//elsewhere.example/x.mp3','/\\elsewhere/x.mp3','https://user:password@example.com/x.mp3','data:audio/mp3;base64,x','http://example.com/x.mp3'])('rejects unsafe recorded media %s', value => {
  expect(introductionMediaUrl(value)).toBeUndefined();
});
it('keeps existing natural voice as the default for sites without approved recordings', () => {
  render(<TenantIntroduction narration="Existing subscriber introduction" />);
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  expect(natural.play).toHaveBeenCalledWith('Existing subscriber introduction',expect.objectContaining({voice:'warm'}));
});
