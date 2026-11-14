import { estheticianLessons } from './esthetician.mjs';
import { manicuristLessons } from './manicurist.mjs';

export const BEAUTY_SOURCE_VERSION = 'efh-beauty-2026-11-01-v1';
export const BEAUTY_SOURCE_REFERENCES = [
  { id:'signed-appendix-a', url:'https://drive.google.com/file/d/1l3e7hmyQQDM5CvQfYZzDv1g2vR23vrVR/view', scope:'Competency identifiers and signed RTI subjects only; not the author of this teaching text.' },
  { id:'indiana-pla-current', url:'https://www.in.gov/pla/professions/cosmetology-and-barber-home/', scope:'Current scope announcements and links to sanitation rules. Checked 2026-11-01.' },
  { id:'osha-nail-safety', url:'https://www.osha.gov/nail-salons', scope:'Chemical, biological and ergonomic exposure controls. Checked 2026-11-01.' },
  { id:'epa-disinfection', url:'https://www.epa.gov/pesticide-registration/selected-epa-registered-disinfectants', scope:'Disinfectant labeling, intended uses and contact time. Checked 2026-11-01.' },
];
const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const packs = { esthetician:estheticianLessons, manicurist:manicuristLessons };
export function registeredBeautyLessons(occupation) {
  return (packs[occupation] ?? []).map(row => {
    const [letter,title,concept,procedure,safety,example,practice,prompt,answer,...distractors] = row;
    const id = `${occupation}-${letter}`;
    const sections = [['Concept explanation',concept],['Procedure demonstration',procedure],['Safety and correction',safety],['Worked example',example],['Supervised practice',practice]];
    const html = `<h2>${escape(title)}</h2>` + sections.map(([heading,body]) => `<h3>${heading}</h3><p>${escape(body)}</p>`).join('');
    // The alternative is tied to this lesson's actual scenario, not navigation or a copied standard label.
    const checks = [
      {question:prompt,options:[answer,...distractors],correct:0,explanation:`${answer}. ${safety}`},
      {question:`For ${title.toLowerCase()}, which scenario response follows the lesson?`,options:[example,'Proceed without the consultation or inspection described in this lesson.','Substitute an unverified tool or product and continue without asking the trainer.','Record the service as completed even when the safe procedure was not performed.'],correct:0,explanation:example},
    ];
    const content = {
      html,
      experience: {
        readingGuide:{sections:sections.map(([heading,body])=>({heading,body})),keyTakeaways:[answer]},
        caseStudy:{context:example},
        exercises:[{title:`Supervised and independent application: ${title}`,instructions:[practice],expectedArtifact:`A completed task or decision record for ${title}, showing the demonstrated sequence, the safety stop and the reason for the decision. The qualified trainer checks actual performance; online completion does not sign off practical competence.`}],
        knowledgeChecks:checks,
      },
      provenance:{author:'Elevate for Humanity original instructional authoring',version:BEAUTY_SOURCE_VERSION,authoredDate:'2026-11-01',competencyId:id,references:BEAUTY_SOURCE_REFERENCES,approval:'Instructional source for production review; not a new agency approval, trainer signoff or award of hours.'},
    };
    return {id,title,content,source:{id,text:`Lesson: ${title}\nAuthorized course content: ${JSON.stringify(content)}`}};
  });
}
export function registeredBeautySources(programSlug) {
  const occupation = programSlug === 'esthetician-apprenticeship' ? 'esthetician'
    : ['nail-tech-apprenticeship','nail-technician-apprenticeship','manicurist-apprenticeship'].includes(programSlug) ? 'manicurist' : null;
  return occupation ? registeredBeautyLessons(occupation).map(lesson=>lesson.source) : [];
}
