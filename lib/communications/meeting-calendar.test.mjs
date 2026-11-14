import test from 'node:test';
import assert from 'node:assert/strict';
import {meetingCalendar} from './meeting-calendar.mjs';
test('calendar links preserve the exact time, join URL and one-hour duration',()=>{
 const c=meetingCalendar({title:'Team video meeting',url:'https://admin.elevateforhumanity.org/phone/meetings/fixture',start:'2026-10-13T14:00:00Z',now:new Date('2026-10-12T12:00:00Z')});
 assert.equal(new URL(c.google).searchParams.get('dates'),'20261013T140000Z/20261013T150000Z');
 assert(c.ics.includes('DTSTART:20261013T140000Z\r\n'));
 assert(c.ics.includes('https://admin.elevateforhumanity.org/phone/meetings/fixture'));
});
test('calendar content cannot inject a second event',()=>{
 const c=meetingCalendar({title:'Title\r\nBEGIN:VEVENT',url:'https://example.test/meeting',start:'2026-10-13T14:00:00Z'});
 assert.equal(c.ics.split('\r\nBEGIN:VEVENT').length,2);
 assert.throws(()=>meetingCalendar({title:'Meeting',url:'https://example.test/',start:'invalid'}),/Invalid meeting date/);
});
