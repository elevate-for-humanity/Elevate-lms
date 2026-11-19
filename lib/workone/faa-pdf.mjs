import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { FAA_COST_ROWS, faaTotalCents, faaEndDate } from './faa-programs.mjs';

const BLACK=rgb(0.08,0.08,0.1);
const GRAY=rgb(0.38,0.4,0.45);
const WIDTH=612, HEIGHT=792;
const cents=v=>'$'+(v/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const date=iso=>new Date(iso+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'2-digit',day:'2-digit',year:'numeric'});
function line(page,x1,y1,x2,y2){page.drawLine({start:{x:x1,y:y1},end:{x:x2,y:y2},thickness:.7,color:BLACK});}
function text(page,font,value,x,y,size=9,color=BLACK){
  const s=String(value??'').replace(/[\\r\\n]+/g,' ').trim();
  // Avoid injecting arbitrary off-page text in a signed record.
  const clipped=s.length>92?s.slice(0,89)+'...':s;
  page.drawText(clipped,{x,y,size,font,color});
}
function cell(page,font,value,x,y,width,size=8){
  const str=String(value??'');
  let out=str;
  while(out.length && font.widthOfTextAtSize(out,size)>width-10)out=out.slice(0,-1);
  text(page,font,out+(out!==str?'…':''),x+5,y-16,size);
}
function ruledTable(page,font,top,left,widths,rows,rowHeight=27){
  const x=[left]; for(const w of widths)x.push(x.at(-1)+w);
  const bottom=top-rows.length*rowHeight;
  for(const xx of x)line(page,xx,top,xx,bottom);
  for(let i=0;i<=rows.length;i++)line(page,left,top-i*rowHeight,x.at(-1),top-i*rowHeight);
  rows.forEach((row,i)=>row.forEach((v,j)=>cell(page,font,v,x[j],top-i*rowHeight,widths[j],i===0?7:8)));
  return bottom;
}
/** Generate a provider FAA; no funding approval or program start authorization is inferred.
 * Signature bytes are supplied only by an individually authorized signing request.
 */
export async function createFaaPdf({student,program,startDate,actorName,signaturePng=null,signedAt=null}){
  if(!student?.id||!student?.name||!program)throw Error('FAA_STUDENT_AND_PROGRAM_REQUIRED');
  const endDate=faaEndDate(startDate,program.weeks);
  const total=faaTotalCents(program);
  const pdf=await PDFDocument.create();
  const regular=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const first=pdf.addPage([WIDTH,HEIGHT]);
  text(first,regular,'Financial Award Analysis',45,756,9);
  text(first,bold,'Attachment C',258,734,11);
  text(first,bold,'FINANCIAL AWARD ANALYSIS',204,717,14);
  text(first,bold,'TRAINING PROVIDER: Elevate for Humanity (2Exclusive LLC-S)',45,688,10);
  ruledTable(first,regular,672,45,[270,252],[
    ['WIOA Participant: '+student.name,'Telephone #: '+(student.phone||'')],
    ['Training Start Date: '+date(startDate),'Training End Date: '+date(endDate)],
    ['Name/Type: '+program.label,'Weeks: '+program.weeks],
    ['Provider Contact: '+actorName,'Telephone #: 317-314-3757']
  ],39);
  const header=['Training Items Cost of Attendance','Fund Assignments (#1-6)','Cost per Period','Number of Periods','Total Cost'];
  const body=FAA_COST_ROWS.map(([key,label])=>[label,'','','',cents(program.costs[key])]);
  body.push(['Total Projected Cost of Training','','','',cents(total)]);
  ruledTable(first,regular,501,45,[189,79,85,78,91],[header,...body],25);
  text(first,regular,'Program costs are proposed and must be reviewed before WorkOne submission.',45,108,8,GRAY);
  text(first,regular,'Fund Assignments intentionally blank. Approval is not represented.',45,94,8,GRAY);

  const second=pdf.addPage([WIDTH,HEIGHT]);
  text(second,regular,'Financial Award Analysis',45,756,9);
  text(second,bold,'Attachment C — Available Funding Sources',45,728,11);
  const funding=[
    ['Available Funding Sources','Aid per Period','Number of Periods','Total Available Resources'],
    ['1. Federal Pell Grant','','','$0.00'],
    ['2. Scholarships / Grants / Other Financial Aid','','','$0.00'],
    ['3. Other Partner Sources','','','$0.00'],
    ['4. Vocational Rehabilitation / Social Services','','','$0.00'],
    ['5. Total Non-WIOA Available Resources','','','$0.00'],
    ['6. Needed / Requested WIOA Training Resources','',program.weeks+' weeks',cents(total)],
    ['7. Additional Resources Needed','','','$0.00']
  ];
  ruledTable(second,regular,704,45,[234,92,94,102],funding,46);
  text(second,regular,'Funding is requested, not awarded. No student may begin solely on this form.',45,306,8,GRAY);
  line(second,55,184,289,184);line(second,328,184,562,184);
  text(second,regular,'Provider signature',55,166,9);
  text(second,regular,'Regional staff signature (WorkOne only)',328,166,9);
  if(signaturePng){
    if(!(signaturePng instanceof Uint8Array)||signaturePng.length<50||signaturePng.length>300000)throw Error('FAA_SIGNATURE_INVALID');
    const img=await pdf.embedPng(signaturePng);
    const dims=img.scale(Math.min(180/img.width,42/img.height,1));
    second.drawImage(img,{x:65,y:189,width:dims.width,height:dims.height});
    text(second,regular,'Signed by '+actorName,55,144,9);
    text(second,regular,'Date: '+date(signedAt?.slice(0,10)||new Date().toISOString().slice(0,10)),55,130,9);
  } else {
    text(second,regular,'Unsigned draft — provider approval required',55,144,8,GRAY);
  }
  text(second,regular,'Program: '+program.label,45,65,8);
  text(second,regular,'Proposed dates: '+date(startDate)+' - '+date(endDate),45,50,8);
  return new Uint8Array(await pdf.save());
}
