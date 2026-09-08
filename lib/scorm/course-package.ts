import { deflateRawSync } from 'node:zlib';
import type { CoursePackage, CoursePackageLesson } from '@/lib/course-package/contract';

export type ScormFormat = '1.2' | '2004';

type ZipEntry = { name: string; data: Buffer };

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function html(value: string): string {
  return xml(value);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'course';
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()): { date: number; time: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
  };
}

function zip(entries: ZipEntry[]): Buffer {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  const stamp = dosDateTime();

  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const compressed = deflateRawSync(entry.data);
    const checksum = crc32(entry.data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(stamp.time, 10);
    header.writeUInt16LE(stamp.date, 12);
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(entry.data.length, 22);
    header.writeUInt16LE(name.length, 26);

    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(0x0800, 8);
    directory.writeUInt16LE(8, 10);
    directory.writeUInt16LE(stamp.time, 12);
    directory.writeUInt16LE(stamp.date, 14);
    directory.writeUInt32LE(checksum, 16);
    directory.writeUInt32LE(compressed.length, 20);
    directory.writeUInt32LE(entry.data.length, 24);
    directory.writeUInt16LE(name.length, 28);
    directory.writeUInt32LE(offset, 42);

    local.push(header, name, compressed);
    central.push(directory, name);
    offset += header.length + name.length + compressed.length;
  }

  const directorySize = central.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directorySize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
}

const runtime = `var API=null,API_1484_11=null,started=Date.now();
function findAPI(w){for(var i=0;i<10&&w;i++){if(w.API){API=w.API;return}if(w.API_1484_11){API_1484_11=w.API_1484_11;return}w=w.parent!==w?w.parent:w.opener}}
function init(){findAPI(window);if(API)API.LMSInitialize("");else if(API_1484_11)API_1484_11.Initialize("")}
function setValue(k12,k04,v){if(API)API.LMSSetValue(k12,v);else if(API_1484_11)API_1484_11.SetValue(k04,v)}
function getValue(k12,k04){if(API)return API.LMSGetValue(k12)||"";if(API_1484_11)return API_1484_11.GetValue(k04)||"";return ""}
function commit(){if(API)API.LMSCommit("");else if(API_1484_11)API_1484_11.Commit("")}
function saveLocation(value,progress){setValue("cmi.core.lesson_location","cmi.location",String(value));setValue("cmi.core.score.raw","cmi.progress_measure",String(progress));commit()}
function saveScore(score,passed){setValue("cmi.core.score.raw","cmi.score.raw",String(score));setValue("cmi.core.lesson_status","cmi.success_status",passed?"passed":"failed");commit()}
function complete(){setValue("cmi.core.lesson_status","cmi.completion_status","completed");setValue("cmi.core.score.raw","cmi.progress_measure","1");commit()}
function finish(){if(API)API.LMSFinish("");else if(API_1484_11)API_1484_11.Terminate("")}
addEventListener("load",init);addEventListener("beforeunload",finish);`;

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e');
}

function lessonPage(courseTitle: string, lesson: CoursePackageLesson): string {
  const video = lesson.videoUrl ? `<video id="lesson-video" controls preload="metadata"><source src="${html(lesson.videoUrl)}" type="video/mp4"></video>` : '';
  const transcript = String(lesson.experience?.transcript ?? lesson.experience?.narrationScript ?? '');
  const payload = safeJson({ timeline: lesson.timeline, questions: lesson.questions, completion: lesson.completion });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${html(lesson.title)}</title><script src="../shared/scorm-api.js"></script><style>body{font-family:system-ui;max-width:900px;margin:auto;padding:24px;line-height:1.6;color:#172033}video{width:100%}.panel{border:1px solid #ccd5df;border-radius:10px;padding:16px;margin:16px 0}button{padding:12px 18px;background:#075985;color:white;border:0;border-radius:8px}button:disabled{opacity:.5}.feedback{font-weight:600}</style></head><body><p>${html(courseTitle)}</p><h1>${html(lesson.title)}</h1>${video}<main>${lesson.html}</main>${transcript ? `<details class="panel"><summary>Transcript</summary><p>${html(transcript)}</p></details>` : ''}<section id="checks" aria-label="Knowledge checks"></section><button id="complete" disabled>Complete lesson</button><script>const lesson=${payload};const video=document.getElementById('lesson-video');const done=document.getElementById('complete');let watched=video?0:100;let answered=0;function ready(){done.disabled=watched<lesson.completion.requiredWatchPercent||answered<lesson.questions.length}if(video){video.addEventListener('loadedmetadata',()=>{const saved=Number(getValue('cmi.core.lesson_location','cmi.location'));if(saved>0&&saved<video.duration)video.currentTime=saved});video.addEventListener('timeupdate',()=>{watched=Math.max(watched,Math.round(video.currentTime/video.duration*100));saveLocation(video.currentTime,watched/100);ready()})}const host=document.getElementById('checks');lesson.questions.forEach((q,i)=>{const box=document.createElement('fieldset');box.className='panel';const legend=document.createElement('legend');legend.textContent=q.prompt;box.appendChild(legend);q.options.forEach((option,j)=>{const label=document.createElement('label');label.style.display='block';label.innerHTML='<input type="radio" name="q'+i+'" value="'+j+'"> '+option;box.appendChild(label)});const button=document.createElement('button');button.type='button';button.textContent='Check answer';const feedback=document.createElement('p');feedback.className='feedback';button.onclick=()=>{const selected=box.querySelector('input:checked');if(!selected)return;const expected=String(q.correctAnswers[0]);const correct=selected.value===expected||q.options[Number(selected.value)]===expected;feedback.textContent=(correct?'Correct. ':'Review this concept. ')+q.explanation;if(!box.dataset.answered){box.dataset.answered='1';answered++;ready()}saveScore(Math.round(answered/lesson.questions.length*100),correct)};box.append(button,feedback);host.appendChild(box)});done.onclick=()=>{complete();done.textContent='Completed';done.disabled=true};ready()</script></body></html>`;
}

function manifest(identifier: string, title: string, lessons: CoursePackageLesson[], format: ScormFormat): string {
  const items = lessons.map((lesson, index) => `<item identifier="item-${index + 1}" identifierref="res-${index + 1}"><title>${xml(lesson.title)}</title></item>`).join('');
  const resources = lessons.map((lesson, index) => `<resource identifier="res-${index + 1}" type="webcontent" ${format === '2004' ? 'adlcp:scormType' : 'adlcp:scormtype'}="sco" href="lessons/lesson-${index + 1}.html"><file href="lessons/lesson-${index + 1}.html"/><dependency identifierref="shared"/></resource>`).join('');
  const ns = format === '2004'
    ? 'xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"'
    : 'xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"';
  return `<?xml version="1.0" encoding="UTF-8"?><manifest identifier="${xml(identifier)}" version="1.0" ${ns}><metadata><schema>ADL SCORM</schema><schemaversion>${format === '2004' ? '2004 4th Edition' : '1.2'}</schemaversion></metadata><organizations default="org"><organization identifier="org"><title>${xml(title)}</title>${items}</organization></organizations><resources><resource identifier="shared" type="webcontent" href="shared/scorm-api.js"><file href="shared/scorm-api.js"/></resource>${resources}</resources></manifest>`;
}

export function generateScormPackage(input: { course: CoursePackage; format: ScormFormat }): { filename: string; data: Buffer } {
  const ordered = input.course.modules.flatMap((module) => [...module.lessons].sort((a, b) => a.order - b.order));
  if (!ordered.length) throw new Error('Course has no lessons to export');
  const identifier = `elevate-${slug(input.course.title)}-${input.course.id.slice(0, 8)}`;
  const entries: ZipEntry[] = [
    { name: 'imsmanifest.xml', data: Buffer.from(manifest(identifier, input.course.title, ordered, input.format)) },
    { name: 'shared/scorm-api.js', data: Buffer.from(runtime) },
    { name: 'course-package.json', data: Buffer.from(JSON.stringify(input.course, null, 2)) },
    ...ordered.map((lesson, index) => ({ name: `lessons/lesson-${index + 1}.html`, data: Buffer.from(lessonPage(input.course.title, lesson)) })),
  ];
  return { filename: `${slug(input.course.title)}-SCORM${input.format.replace('.', '')}.zip`, data: zip(entries) };
}
