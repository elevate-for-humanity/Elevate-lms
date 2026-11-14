import {render,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {FirstPartyTraffic} from '@/components/analytics/FirstPartyTraffic';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();sessionStorage.clear();});
it('does not crash the page or send a fabricated tracking identity when storage is denied',()=>{
  const request=vi.fn();vi.stubGlobal('fetch',request);
  vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new DOMException('Blocked','SecurityError');});
  expect(()=>render(<FirstPartyTraffic />)).not.toThrow();
  expect(request).not.toHaveBeenCalled();
});
it('keeps a failed optional tracking request from becoming an unhandled rejection',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
  render(<FirstPartyTraffic />);
  await Promise.resolve();
  expect(fetch).toHaveBeenCalledWith('/api/analytics/track',expect.objectContaining({credentials:'omit',keepalive:true}));
});
