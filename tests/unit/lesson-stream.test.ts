// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { streamLessonMedia } from '@/lib/storage/lesson-stream';
const fetcher=vi.fn();
beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('fetch',fetcher);});
afterEach(()=>vi.unstubAllGlobals());
it('streams verified media without redirecting or leaking storage authorization',async()=>{
 fetcher.mockResolvedValue(new Response('film',{headers:{'content-type':'video/mp4','content-length':'4','set-cookie':'upstream-secret','access-control-allow-origin':'*'}}));
 const response=await streamLessonMedia(new Request('https://app.example/playback'),'https://private.example/film?signature=secret');
 expect(await response.text()).toBe('film');expect(response.headers.get('location')).toBeNull();expect(response.headers.get('set-cookie')).toBeNull();
 expect(response.headers.get('cache-control')).toBe('private, no-store');expect(response.headers.get('content-length')).toBeNull();
 expect(fetcher).toHaveBeenCalledWith(expect.any(String),expect.objectContaining({redirect:'error',headers:{'Accept-Encoding':'identity'}}));
});
it('preserves byte-range seeking through the authenticated endpoint',async()=>{
 fetcher.mockResolvedValue(new Response('ilm',{status:206,headers:{'content-type':'video/mp4','content-length':'3','content-range':'bytes 1-3/4','accept-ranges':'bytes'}}));
 const response=await streamLessonMedia(new Request('https://app.example/playback',{headers:{Range:'bytes=1-3'}}),'https://private.example/film');
 expect(response.status).toBe(206);expect(response.headers.get('content-length')).toBe('3');expect(response.headers.get('content-range')).toBe('bytes 1-3/4');expect(await response.text()).toBe('ilm');
 expect(fetcher.mock.calls[0][1].headers.Range).toBe('bytes=1-3');
});
it('delivers the first encoded bytes without waiting for a large movie to finish',async()=>{
 let finish!:()=>void;
 const gate=new Promise<void>(resolve=>{finish=resolve;});
 const body=new ReadableStream<Uint8Array>({async start(controller){
  controller.enqueue(new Uint8Array([0,0,0,24,102,116,121,112]));
  await gate;controller.close();
 }});
 fetcher.mockResolvedValue(new Response(body,{headers:{'content-type':'video/mp4','content-length':'43348093'}}));
 const response=await streamLessonMedia(new Request('https://app.example/playback'),'https://private.example/film');
 expect(response.headers.has('content-length')).toBe(false);
 const reader=response.body!.getReader();
 expect((await reader.read()).value).toEqual(new Uint8Array([0,0,0,24,102,116,121,112]));
 finish();expect((await reader.read()).done).toBe(true);
});
it('retains full-object size metadata for HEAD without downloading the movie',async()=>{
 fetcher.mockResolvedValue(new Response(null,{headers:{'content-type':'video/mp4','content-length':'43348093'}}));
 const response=await streamLessonMedia(new Request('https://app.example/playback',{method:'HEAD'}),'https://private.example/film');
 expect(response.body).toBeNull();expect(response.headers.get('content-length')).toBe('43348093');
 expect(fetcher.mock.calls[0][1].method).toBe('HEAD');
});
it.each(['bytes=0-1,3-4','invalid','bytes=-','bytes=abc-3'])('rejects unsupported range %s before any upstream request',async range=>{
 expect((await streamLessonMedia(new Request('https://app.example/playback',{headers:{range}}),'https://private.example/film')).status).toBe(416);expect(fetcher).not.toHaveBeenCalled();
});
it('serves private caption tracks from the same origin as the player',async()=>{
 fetcher.mockResolvedValue(new Response('WEBVTT\n',{headers:{'content-type':'text/plain'}}));
 const response=await streamLessonMedia(new Request('https://app.example/playback?asset=captions'),'https://private.example/captions','captions');
 expect(response.headers.get('content-type')).toBe('text/vtt; charset=utf-8');expect(await response.text()).toContain('WEBVTT');
});
it('does not forward a provider authentication error body',async()=>{
 fetcher.mockResolvedValue(new Response('private provider detail',{status:403}));
 await expect(streamLessonMedia(new Request('https://app.example/playback'),'https://private.example/film')).rejects.toThrow('LESSON_MEDIA_UPSTREAM_UNAVAILABLE');
});
it('rejects HTML returned instead of instructional media',async()=>{
 fetcher.mockResolvedValue(new Response('<html>error</html>',{headers:{'content-type':'text/html'}}));
 await expect(streamLessonMedia(new Request('https://app.example/playback'),'https://private.example/film')).rejects.toThrow('LESSON_MEDIA_TYPE_INVALID');
});
