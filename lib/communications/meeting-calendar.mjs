export function meetingCalendar({title,url,start,now=new Date()}) {
 const date=start?new Date(start):now;
 if(!Number.isFinite(date.getTime()))throw Error('Invalid meeting date');
 const end=new Date(date.getTime()+60*60*1000);
 const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 const escape=s=>String(s).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const details='Join your Elevate meeting: '+url;
 const google=new URL('https://calendar.google.com/calendar/render');
 for(const [key,value] of Object.entries({action:'TEMPLATE',text:title,dates:stamp(date)+'/'+stamp(end),details,location:url}))google.searchParams.set(key,value);
 const uid=new URL(url).pathname.split('/').at(-1)+'@elevateforhumanity.org';
 const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Elevate//Meetings//EN','BEGIN:VEVENT','UID:'+escape(uid),'DTSTAMP:'+stamp(now),'DTSTART:'+stamp(date),'DTEND:'+stamp(end),'SUMMARY:'+escape(title),'DESCRIPTION:'+escape(details),'URL:'+url,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
 return {google:google.href,ics};
}
