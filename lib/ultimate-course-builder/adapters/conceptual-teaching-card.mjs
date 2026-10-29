import sharp from 'sharp';

// A readable explanatory visual is valid for a conceptual lesson cue.
// Never substitute this for required photographic evidence of hands-on practice.
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const wrap = (value, max = 43) => {
  const words = String(value ?? '').trim().split(/\s+/);
  const lines=[]; let line='';
  for(const word of words){ if((line+' '+word).trim().length>max && line){lines.push(line);line=word;} else line=(line+' '+word).trim(); }
  if(line)lines.push(line);
  return lines.slice(0,5);
};
export function canUseConceptualCard(scene) {
  return ['why_it_matters','activate_prior_knowledge','terminology','concept_explanation',
    'instructor_example','knowledge_check','guided_practice','recap','summary','assessment',
    'independent_practice','reflection'].includes(String(scene?.stage ?? '')) &&
    !['practical_skill','physical_demonstration'].includes(String(scene?.sceneType ?? ''));
}
export async function conceptualTeachingCard({scene,step,courseTitle,index,supplemental=false}) {
  // A supplemental card may accompany licensed practical footage for timing,
  // recap and accessibility, but it never satisfies practical evidence.
  if(!supplemental && !canUseConceptualCard(scene)) return null;
  const quote=String(step?.narrationQuote ?? '').trim();
  if(!quote) return null;
  const lines=wrap(quote);
  if(!lines.length) return null;
  const title=escape(String(scene?.title ?? 'Key concept').replaceAll('_',' '));
  const course=escape(String(courseTitle ?? 'Course lesson').slice(0,72));
  const body=lines.map((line,i)=>'<text x="100" y="'+(270+i*67)+'" fill="#ffffff" font-size="39" font-family="Arial, sans-serif">'+escape(line)+'</text>').join('');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">'+
  '<rect width="1280" height="720" fill="#132438"/><rect x="55" y="60" width="1170" height="600" rx="28" fill="#1b344a"/>'+
  '<rect x="90" y="105" width="12" height="85" rx="6" fill="#82d6cb"/>'+
  '<text x="125" y="125" fill="#82d6cb" font-size="25" font-family="Arial, sans-serif">'+course+'</text>'+
  '<text x="125" y="183" fill="#ffffff" font-size="45" font-weight="bold" font-family="Arial, sans-serif">'+title+'</text>'+
  body+'<text x="100" y="630" fill="#82d6cb" font-size="23" font-family="Arial, sans-serif">Instructional concept overview &#8226; '+(index+1)+'</text></svg>';
  return {bytes:await sharp(Buffer.from(svg)).png().toBuffer(),mimeType:'image/png',
    repair:{method:'lesson-conceptual-card-v1',sceneId:scene.id,cueIndex:index}};
}
