import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TenantRecordedIntroduction } from '@/components/tenant/TenantRecordedIntroduction';
import { MediaPlaybackCoordinator } from '@/components/media/MediaPlaybackCoordinator';
import { ScrollNarrator } from '@/components/home/ScrollNarrator';
vi.mock('next/navigation', () => ({ usePathname: () => '/sites/example' }));
vi.mock('@/components/voice/useNaturalVoice', () => ({
  useNaturalVoice: () => ({ play: vi.fn(), prepare: vi.fn(), stop: vi.fn(), isLoading: false, isPlaying: false }),
  stopAllNaturalVoicePlayback: vi.fn(),
  NATURAL_VOICE_STOP_EVENT: 'elevate:natural-voice-stop',
}));
afterEach(()=>{cleanup();vi.restoreAllMocks()});

function installPlayback() {
  const playing = new WeakSet<HTMLMediaElement>();
  vi.spyOn(HTMLMediaElement.prototype,'paused','get').mockImplementation(function(this:HTMLMediaElement){return !playing.has(this)});
  vi.spyOn(HTMLMediaElement.prototype,'play').mockImplementation(function(this:HTMLMediaElement){
    playing.add(this);this.dispatchEvent(new Event('play'));return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(function(this:HTMLMediaElement){
    if(playing.delete(this))this.dispatchEvent(new Event('pause'));
  });
}
it.each([true,false])('keeps narration and optional music audible together (music selected first: %s)',async(first)=>{
  installPlayback();
  const {container}=render(<><MediaPlaybackCoordinator/><ScrollNarrator/><TenantRecordedIntroduction narration="Transcript" audioUrl="/audio/intro.mp3" musicUrl="/audio/bed.mp3"/><video data-testid="other"/></>);
  const [voice,music]=container.querySelectorAll('audio');
  if(first)fireEvent.click(screen.getByRole('button',{name:'Background music off'}));
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  await screen.findByRole('button',{name:'Pause introduction'});
  if(!first)fireEvent.click(screen.getByRole('button',{name:'Background music off'}));
  expect(voice.paused).toBe(false);expect(music.paused).toBe(false);
  await act(async()=>{ await (screen.getByTestId('other') as HTMLVideoElement).play(); });
  expect(voice.paused).toBe(true);expect(music.paused).toBe(true);
  expect(await screen.findByRole('button',{name:'Resume introduction'})).toBeTruthy();
});
it('does not share playback permission across separate introduction groups',async()=>{
  installPlayback();
  const {container}=render(<><MediaPlaybackCoordinator/><ScrollNarrator/><TenantRecordedIntroduction narration="First" audioUrl="/audio/first.mp3"/><TenantRecordedIntroduction narration="Second" audioUrl="/audio/second.mp3"/></>);
  const [first,second]=container.querySelectorAll('audio');
  fireEvent.click(screen.getAllByRole('button',{name:'Listen to the introduction'})[0]);
  await screen.findByRole('button',{name:'Pause introduction'});
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  await screen.findByRole('button',{name:'Resume introduction'});
  expect(first.paused).toBe(true);expect(second.paused).toBe(false);
});

it('resumes a paused introduction with music enabled under both page governors',async()=>{
  installPlayback();
  const {container}=render(<><MediaPlaybackCoordinator/><ScrollNarrator/><TenantRecordedIntroduction narration="Transcript" audioUrl="/audio/intro.mp3" musicUrl="/audio/bed.mp3"/></>);
  const [voice,music]=container.querySelectorAll('audio');
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  await screen.findByRole('button',{name:'Pause introduction'});
  fireEvent.click(screen.getByRole('button',{name:'Pause introduction'}));
  fireEvent.click(screen.getByRole('button',{name:'Background music off'}));
  fireEvent.click(screen.getByRole('button',{name:'Resume introduction'}));
  await screen.findByRole('button',{name:'Pause introduction'});
  expect(voice.paused).toBe(false);expect(music.paused).toBe(false);
  await act(async()=>{ music.dispatchEvent(new Event('volumechange')); });
  expect(voice.paused).toBe(false);expect(music.paused).toBe(false);
  fireEvent.click(screen.getByRole('button',{name:'Pause introduction'}));
  expect(voice.paused).toBe(true);expect(music.paused).toBe(true);
});
