import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const carrier=vi.hoisted(()=>({retrieve:vi.fn()}));
vi.mock('@/lib/phone/telnyx',()=>({telnyxClient:async()=>({recordings:{retrieve:carrier.retrieve}})}));
import { carrierRecordingUrl, loadPhoneRecording } from '@/lib/phone/recordings';
const recording = 'https://s3.amazonaws.com/telephony-recorder-prod/test.wav?signature=private';
afterEach(() => vi.unstubAllGlobals());
describe('private phone recording proxy', () => {
  it('reports unavailable historical audio without invoking a retired provider', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    await expect(loadPhoneRecording(recording)).rejects.toThrow('Recording unavailable');
    expect(carrier.retrieve).not.toHaveBeenCalled();
  });
  it('keeps existing signed provider URLs while rejecting metadata, arbitrary hosts and paths', () => {
    expect(carrierRecordingUrl(recording).search).toBe('?signature=private');
    for (const url of [
      'http://169.254.169.254/computeMetadata/v1/',
      'https://s3.amazonaws.com/unrelated-bucket/file.wav',
      'https://s3.amazonaws.com/telephony-recorder-prod/../unrelated-bucket/file.wav',
      'https://s3.amazonaws.com:444/telephony-recorder-prod/file.wav',
      'https://user:secret@s3.amazonaws.com/telephony-recorder-prod/file.wav',
      'https://s3.amazonaws.com.attacker.invalid/telephony-recorder-prod/file.wav',
    ]) expect(() => carrierRecordingUrl(url)).toThrow();
  });
  it('returns audio without exposing its signed source and prohibits redirects', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([1,2,3]), {
      headers: { 'content-type':'audio/wav', 'content-length':'3' },
    }));
    vi.stubGlobal('fetch', fetch);
    const response = await loadPhoneRecording(recording);
    expect(fetch.mock.calls[0][1]).toMatchObject({ redirect:'error',cache:'no-store' });
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('location')).toBeNull();
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1,2,3]));
  });
  it('fails closed on HTML errors, missing bytes and oversized recordings', async () => {
    for (const response of [
      new Response('<html>expired</html>', { headers:{'content-type':'text/html'} }),
      new Response(new Uint8Array([1]), { headers:{'content-type':'audio/wav','content-length':'100'} }),
      new Response(new Uint8Array([1]), { headers:{'content-type':'audio/wav','content-length':String(33*1024*1024)} }),
      new Response(null,{ status:403 }),
    ]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
      await expect(loadPhoneRecording(recording)).rejects.toThrow();
    }
  });
  it('does not issue a network request for an untrusted DB location', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch',fetch);
    await expect(loadPhoneRecording('http://127.0.0.1:8088/ari')).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('owned private voicemail playback',()=>{
 it('downloads only the exact private recording belonging to the authorized call',async()=>{
  const id='11111111-1111-4111-8111-111111111111';
  const audio=Buffer.alloc(44);audio.write('RIFF');audio.write('WAVE',8);
  const download=vi.fn().mockResolvedValue({data:new Blob([audio],{type:'audio/wav'}),error:null});
  const response=await loadPhoneRecording('supabase://phone-voicemails/'+id+'.wav',{callId:id,db:{storage:{from:()=>({download})}}});
  expect(download).toHaveBeenCalledWith(id+'.wav');
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  expect((await response.arrayBuffer()).byteLength).toBe(44);
 });
 it('rejects a different call or arbitrary bucket before downloading audio',async()=>{
  const id='11111111-1111-4111-8111-111111111111';const from=vi.fn();
  await expect(loadPhoneRecording('supabase://other-bucket/'+id+'.wav',{callId:id,db:{storage:{from}}})).rejects.toThrow('Untrusted private recording');
  expect(from).not.toHaveBeenCalled();
 });
});
