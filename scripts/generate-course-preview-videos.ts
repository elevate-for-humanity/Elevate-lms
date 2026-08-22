/**
 * Generate 30-second catalog preview MP4s.
 *
 * Every preview must use audio belonging to that course. Cross-course HVAC
 * fallback audio was intentionally removed because it produced misleading
 * previews and kept the retired HVAC UUID map alive.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: false });
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { createCanvas, loadImage } from '@napi-rs/canvas';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const OUT_DIR = path.join(process.cwd(), 'public', 'videos', 'previews');
const WHITE = '#ffffff';
const BLUE = '#2563eb';
const RED = '#dc2626';
const ORANGE = '#f97316';

interface CoursePreview {
  id: string; title: string; tagline: string; salary: string; photo: string;
  accentColor: string; audioFile?: string;
}

const COURSES: CoursePreview[] = [
  { id:'hvac-technician', title:'HVAC Technician', tagline:'Install & repair heating and cooling systems', salary:'$45,000–$75,000/yr', photo:'images/pages/courses-page-4.jpg', accentColor:BLUE, audioFile:'generated/previews/hvac-technician.mp3' },
  { id:'cna', title:'Certified Nursing Assistant', tagline:'Care for patients in hospitals & nursing homes', salary:'$32,000–$42,000/yr', photo:'images/hp/healthcare.jpg', accentColor:'#16a34a', audioFile:'generated/previews/cna.mp3' },
  { id:'cdl', title:'Commercial Driver (CDL-A)', tagline:'Drive semi-trucks and earn top pay', salary:'$55,000–$85,000/yr', photo:'images/hp/candidates.jpg', accentColor:BLUE, audioFile:'generated/previews/cdl.mp3' },
  { id:'medical-assistant', title:'Medical Assistant (CCMA)', tagline:'Work alongside doctors in clinics', salary:'$36,000–$48,000/yr', photo:'images/pages/courses-page-6.jpg', accentColor:'#16a34a', audioFile:'generated/previews/medical-assistant.mp3' },
  { id:'phlebotomy', title:'Phlebotomy Technician', tagline:'Draw blood samples in labs & hospitals', salary:'$33,000–$42,000/yr', photo:'images/pages/courses-page-7.jpg', accentColor:'#16a34a', audioFile:'generated/previews/phlebotomy.mp3' },
  { id:'cybersecurity', title:'Cybersecurity Specialist', tagline:'Protect computers & networks', salary:'$55,000–$90,000/yr', photo:'images/pages/courses-page-9.jpg', accentColor:BLUE, audioFile:'generated/previews/cybersecurity.mp3' },
  { id:'excel', title:'Microsoft Excel Certification', tagline:'Master spreadsheets for the workplace', salary:'$38,000–$55,000/yr', photo:'images/pages/courses-page-11.jpg', accentColor:ORANGE, audioFile:'generated/previews/excel.mp3' },
  { id:'osha-10', title:'OSHA 10-Hour Safety', tagline:'Build foundational construction safety knowledge', salary:'Workplace safety credential', photo:'images/pages/courses-page-13.jpg', accentColor:RED, audioFile:'generated/previews/osha-10.mp3' },
];

async function renderFrame(course: CoursePreview): Promise<Buffer> {
  const W=1280,H=720; const photoPath=path.join(process.cwd(),'public',course.photo);
  let photoBuf:Buffer;
  try { photoBuf=await sharp(photoPath).resize(W,H,{fit:'cover',position:'centre'}).jpeg({quality:85}).toBuffer(); }
  catch { photoBuf=await sharp({create:{width:W,height:H,channels:3,background:{r:30,g:58,b:138}}}).jpeg().toBuffer(); }
  const canvas=createCanvas(W,H); const ctx=canvas.getContext('2d'); const image=await loadImage(photoBuf); ctx.drawImage(image,0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,0); grad.addColorStop(0,'rgba(0,0,0,.82)'); grad.addColorStop(.6,'rgba(0,0,0,.45)'); grad.addColorStop(1,'rgba(0,0,0,.1)'); ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
  ctx.fillStyle=course.accentColor; ctx.fillRect(0,0,8,H); ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='bold 22px Arial'; ctx.fillText('ELEVATE FOR HUMANITY',48,52);
  ctx.fillStyle=WHITE; ctx.font='bold 64px Arial'; ctx.fillText(course.title,48,220); ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font='30px Arial'; ctx.fillText(course.tagline,48,280);
  ctx.fillStyle=course.accentColor; ctx.fillRect(48,H-82,420,50); ctx.fillStyle=WHITE; ctx.font='bold 25px Arial'; ctx.fillText(course.salary,68,H-48);
  return canvas.toBuffer('image/png');
}

async function makeVideo(frame:string,audio:string,out:string){ return new Promise<void>((resolve,reject)=>ffmpeg().input(frame).inputOptions(['-loop 1']).input(audio).setDuration(30).videoCodec('libx264').audioCodec('aac').outputOptions(['-pix_fmt yuv420p','-shortest','-movflags +faststart','-preset fast','-crf 28']).output(out).on('end',resolve).on('error',reject).run()); }

async function processOne(course:CoursePreview,tmpDir:string){
  const out=path.join(OUT_DIR,`course-${course.id}.mp4`); if(fs.existsSync(out)) return 'skipped';
  if(!course.audioFile) return 'skipped'; const audio=path.join(process.cwd(),'public',course.audioFile);
  if(!fs.existsSync(audio)){ console.error(`SKIP ${course.id} — course-specific preview audio missing: ${course.audioFile}`); return 'skipped'; }
  try { const frame=path.join(tmpDir,`frame-${course.id}.png`); fs.writeFileSync(frame,await renderFrame(course)); await makeVideo(frame,audio,out); console.log(`generated ${course.id}`); return 'done'; }
  catch(error:any){ console.error(`FAIL ${course.id}: ${error.message}`); return 'failed'; }
}

async function main(){ fs.mkdirSync(OUT_DIR,{recursive:true}); const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'elevate-previews-')); let failed=0; for(const course of COURSES){ if(await processOne(course,tmp)==='failed') failed++; } fs.rmSync(tmp,{recursive:true,force:true}); if(failed) process.exit(1); }
main().catch((error)=>{console.error(error);process.exit(1);});
