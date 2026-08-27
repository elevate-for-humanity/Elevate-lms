import { deflateRawSync } from 'node:zlib';

export type ScormFormat = '1.2' | '2004';

export interface ScormLesson {
  lesson_number: number;
  title: string;
  content?: string | null;
  video_url?: string | null;
  quiz_questions?: unknown;
}

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

const runtime = `var API=null,API_1484_11=null;
function findAPI(w){for(var i=0;i<10&&w;i++){if(w.API){API=w.API;return}if(w.API_1484_11){API_1484_11=w.API_1484_11;return}w=w.parent!==w?w.parent:w.opener}}
function init(){findAPI(window);if(API)API.LMSInitialize("");else if(API_1484_11)API_1484_11.Initialize("")}
function complete(){if(API){API.LMSSetValue("cmi.core.lesson_status","completed");API.LMSCommit("")}else if(API_1484_11){API_1484_11.SetValue("cmi.completion_status","completed");API_1484_11.Commit("")}}
function finish(){if(API)API.LMSFinish("");else if(API_1484_11)API_1484_11.Terminate("")}
addEventListener("load",init);addEventListener("beforeunload",finish);`;

function lessonPage(courseTitle: string, lesson: ScormLesson): string {
  const video = lesson.video_url ? `<video controls preload="metadata"><source src="${html(lesson.video_url)}" type="video/mp4"></video>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${html(lesson.title)}</title><script src="../shared/scorm-api.js"></script><style>body{font-family:system-ui;max-width:900px;margin:auto;padding:24px;line-height:1.6}video{width:100%}button{padding:12px 18px;background:#075985;color:white;border:0;border-radius:8px}</style></head><body><p>${html(courseTitle)}</p><h1>${html(lesson.title)}</h1>${video}<main>${lesson.content ?? ''}</main><button onclick="complete()">Mark lesson complete</button></body></html>`;
}

function manifest(identifier: string, title: string, lessons: ScormLesson[], format: ScormFormat): string {
  const items = lessons.map((lesson) => `<item identifier="item-${lesson.lesson_number}" identifierref="res-${lesson.lesson_number}"><title>${xml(lesson.title)}</title></item>`).join('');
  const resources = lessons.map((lesson) => `<resource identifier="res-${lesson.lesson_number}" type="webcontent" ${format === '2004' ? 'adlcp:scormType' : 'adlcp:scormtype'}="sco" href="lessons/lesson-${lesson.lesson_number}.html"><file href="lessons/lesson-${lesson.lesson_number}.html"/><dependency identifierref="shared"/></resource>`).join('');
  const ns = format === '2004'
    ? 'xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"'
    : 'xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"';
  return `<?xml version="1.0" encoding="UTF-8"?><manifest identifier="${xml(identifier)}" version="1.0" ${ns}><metadata><schema>ADL SCORM</schema><schemaversion>${format === '2004' ? '2004 4th Edition' : '1.2'}</schemaversion></metadata><organizations default="org"><organization identifier="org"><title>${xml(title)}</title>${items}</organization></organizations><resources><resource identifier="shared" type="webcontent" href="shared/scorm-api.js"><file href="shared/scorm-api.js"/></resource>${resources}</resources></manifest>`;
}

export function generateScormPackage(input: { courseId: string; title: string; lessons: ScormLesson[]; format: ScormFormat }): { filename: string; data: Buffer } {
  if (!input.lessons.length) throw new Error('Course has no lessons to export');
  const ordered = [...input.lessons].sort((a, b) => a.lesson_number - b.lesson_number);
  const identifier = `elevate-${slug(input.title)}-${input.courseId.slice(0, 8)}`;
  const entries: ZipEntry[] = [
    { name: 'imsmanifest.xml', data: Buffer.from(manifest(identifier, input.title, ordered, input.format)) },
    { name: 'shared/scorm-api.js', data: Buffer.from(runtime) },
    ...ordered.map((lesson) => ({ name: `lessons/lesson-${lesson.lesson_number}.html`, data: Buffer.from(lessonPage(input.title, lesson)) })),
  ];
  return { filename: `${slug(input.title)}-SCORM${input.format.replace('.', '')}.zip`, data: zip(entries) };
}
