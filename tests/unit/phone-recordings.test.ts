import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const carrier=vi.hoisted(()=>({retrieve:vi.fn()}));
vi.mock('@/lib/phone/telnyx',()=>({telnyxClient:async()=>({recordings:{retrieve:carrier.retrieve}})}));
import { carrierRecordingUrl, loadPhoneRecording, refreshedRecordingUrl } from '@/lib/phone/recordings';
const recording = 'https://s3.amazonaws.com/telephony-recorder-prod/test.wav?signature=private';
afterEach(() => vi.unstubAllGlobals());
describe('private phone recording proxy', () => {
  it('recovers expired audio only through the matching recording event',async()=>{
    const id='11111111-1111-4111-8111-111111111111';
    const fetch=vi.fn().mockResolvedValueOnce(new Response(null,{status:403})).mockResolvedValueOnce(new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'audio/wav','content-length':'3'}}));
    vi.stubGlobal('fetch',fetch);
    carrier.retrieve.mockResolvedValueOnce({data:{id,call_session_id:'owned-session',download_urls:{wav:recording.replace('private','fresh')}}});
    const query:any={select:()=>query,eq:()=>query,order:()=>query,limit:async()=>({data:[{payload:{recording_id:id,call_session_id:'owned-session',recording_urls:{wav:recording}}}],error:null})};
    const response=await loadPhoneRecording(recording,{db:{from:()=>query},callId:id});
    expect(carrier.retrieve).toHaveBeenCalledWith(id);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1,2,3]));
  });
  it('refreshes only the recorded carrier identity and trusted download location', () => {
    const event={recording_id:'recording-id',call_session_id:'session-id'};
    const result={id:'recording-id',call_session_id:'session-id',download_urls:{mp3:recording}};
    expect(refreshedRecordingUrl(event,result)).toBe(recording);
    expect(()=>refreshedRecordingUrl(event,{...result,id:'other-recording'})).toThrow('identity mismatch');
    expect(()=>refreshedRecordingUrl(event,{...result,call_session_id:'other-call'})).toThrow('identity mismatch');
    expect(()=>refreshedRecordingUrl(event,{...result,download_urls:{mp3:'http://169.254.169.254/'}})).toThrow();
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
