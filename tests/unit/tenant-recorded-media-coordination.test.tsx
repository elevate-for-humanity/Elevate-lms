import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TenantRecordedIntroduction } from '@/components/tenant/TenantRecordedIntroduction';
import { MediaPlaybackCoordinator } from '@/components/media/MediaPlaybackCoordinator';
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
  const {container}=render(<><MediaPlaybackCoordinator/><TenantRecordedIntroduction narration="Transcript" audioUrl="/audio/intro.mp3" musicUrl="/audio/bed.mp3"/><video data-testid="other"/></>);
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
  const {container}=render(<><MediaPlaybackCoordinator/><TenantRecordedIntroduction narration="First" audioUrl="/audio/first.mp3"/><TenantRecordedIntroduction narration="Second" audioUrl="/audio/second.mp3"/></>);
  const [first,second]=container.querySelectorAll('audio');
  fireEvent.click(screen.getAllByRole('button',{name:'Listen to the introduction'})[0]);
  await screen.findByRole('button',{name:'Pause introduction'});
  fireEvent.click(screen.getByRole('button',{name:'Listen to the introduction'}));
  await screen.findByRole('button',{name:'Resume introduction'});
  expect(first.paused).toBe(true);expect(second.paused).toBe(false);
});
