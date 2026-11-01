import {expect,it} from 'vitest';
import {phonePresenceDisplay} from '@/lib/phone/presence-display';
it('admin preview reports verified owner presence rather than its deliberately disconnected local client',()=>{
 expect(phonePresenceDisplay(true,false,'available')).toEqual({online:true,label:"Online on owner's device"});
 expect(phonePresenceDisplay(true,false,'offline')).toEqual({online:false,label:'Owner phone offline — no active device'});
 expect(phonePresenceDisplay(true,true,'offline').online).toBe(false);
});
it('preserves normal owner registration status and Do Not Disturb',()=>{
 expect(phonePresenceDisplay(false,true,'offline').label).toBe('Online for calls');
 expect(phonePresenceDisplay(false,false,'available').label).toBe('Phone offline');
 expect(phonePresenceDisplay(true,false,'do_not_disturb').label).toBe('Owner set Do Not Disturb');
 expect(phonePresenceDisplay(true,false,'busy')).toEqual({online:true,label:'Owner is on a call'});
});
