/** Curated lesson pictures. Exact topic matches only: no rotating or generic fallback. */
export type WorkbookVisual = {
  src: string;
  alt: string;
  caption: string;
  generated: boolean;
};
type Picture = readonly [topic: string, file: string, caption: string];
const fresh = '/images/workbooks/2026-10/';
const examples: Record<string, readonly Picture[]> = {
  'prestige-elevation-barbering': [
    [
      'Introduction to Barbering',
      'intro-barber.webp',
      'Observe the instructor, apprentice, mannequin, and prepared tools. Discuss how supervised practice and feedback support your learning.',
    ],
    [
      'Tools & Equipment',
      'barber-tools.webp',
      'Identify the clipper, trimmer, shears, comb, guards, and folded cape. Explain the purpose of each item.',
    ],
    [
      'Infection Control & Safety',
      'barber-disinfection.webp',
      'Compare the separated tool containers. Explain the difference between cleaning a tool and disinfecting it.',
    ],
    [
      'Client Consultation',
      'barber-consultation.webp',
      'Observe the eye contact and seated consultation. What questions would you ask before beginning the service?',
    ],
    [
      'Shampoo & Scalp Massage',
      'cosmetology-shampoo.webp',
      'Observe how the client is supported at the shampoo bowl. Discuss positioning and preparation with your trainer.',
    ],
    [
      'Draping & Client Preparation',
      'barber-draping.webp',
      'Notice the neck strip between the client and cape. Explain how you prepare a fresh drape for each service.',
    ],
    [
      'Head Shape & Sectioning',
      'cosmetology-sectioning.webp',
      'Trace the visible part lines on the mannequin. Ask your trainer to demonstrate the sectioning pattern assigned for your haircut.',
    ],
    [
      'The Fade - Low, Mid & High',
      'barber-fade.webp',
      'Follow the transition from the shorter area into the longer hair. Describe the blend you can see.',
    ],
    [
      'Lineup & Edging',
      'barber-lineup.webp',
      'Examine the visible hairline and side profile. Discuss the client’s natural hairline before planning an edge.',
    ],
    [
      'Flat Top & Classic Cuts',
      'barber-classic.webp',
      'Compare the longer top with the shorter sides in this finished haircut example. Describe its overall silhouette.',
    ],
    [
      'Beard Design & Shaping',
      'barber-beard.webp',
      'Observe the relationship between the beard outline and haircut. Discuss the client’s desired shape before working.',
    ],
    [
      'Hair Color Theory',
      'cosmetology-color.webp',
      'Compare the color swatches with the mixing tools. Explain why consultation and product directions come before a color service.',
    ],
    [
      'Building Your Clientele',
      'salon-interior.webp',
      'Look at the client-facing environment. Describe how presentation and communication contribute to the service experience.',
    ],
    [
      'Styling Products & Finishing',
      'barber-texture.webp',
      'Observe the texture and direction in the finished top. Discuss how the chosen finish supports the haircut.',
    ],
  ],
  'prestige-elevation-cosmetology': [
    [
      'Welcome to Cosmetology Apprenticeship',
      'intro-cosmetology.webp',
      'Observe the instructor coaching an apprentice at a mannequin station. Identify the role of instruction, practice, and feedback.',
    ],
    [
      'Infection Control Fundamentals',
      'barber-disinfection.webp',
      'Identify the separate tool containers. Explain cleaning and disinfection using the procedures assigned by your instructor.',
    ],
    [
      'Tool and Equipment Sanitization',
      'barber-tools.webp',
      'Identify the reusable tools and disposable supplies. Explain how each is handled after a service.',
    ],
    [
      'Shampooing and Conditioning',
      'cosmetology-shampoo.webp',
      'Observe client support, hand placement, and the shampoo bowl. Discuss how to prepare the client comfortably.',
    ],
    [
      'Haircutting Techniques',
      'cosmetology-cutting.webp',
      'Observe the hair and working position in this cutting example. Identify what you would discuss with your trainer before practicing.',
    ],
    [
      'Haircutting - Hands-On Practice',
      'cosmetology-sectioning.webp',
      'Trace each visible part line and clip. Prepare your assigned sectioning pattern on a mannequin before cutting.',
    ],
    [
      'Hairstyling and Blow-Drying',
      'cosmetology-blowdry.webp',
      'Identify the round brush, dryer nozzle, and hair section. Ask your trainer to demonstrate direction and controlled tool movement.',
    ],
    [
      'Updos and Special Occasion Styling',
      'cosmetology-updo.webp',
      'Observe the finished arrangement and balance. Discuss the client’s occasion, preferences, and planned style.',
    ],
    [
      'Color Theory Fundamentals',
      'cosmetology-color.webp',
      'Compare the hair swatches. Identify which tools are prepared before mixing a product according to its directions.',
    ],
    [
      'Single-Process Color',
      'cosmetology-brunette.webp',
      'Describe the visible tone and finish in this color-result example. A photograph alone does not determine a color formula.',
    ],
    [
      'Highlights and Lowlights',
      'cosmetology-highlights.webp',
      'Observe lighter and darker areas in the finished hair. Describe the placement and contrast you can see.',
    ],
    [
      'Color Correction Techniques',
      'cosmetology-correction.webp',
      'Compare the visible hair swatches. Discuss consultation and strand assessment with your instructor before planning a correction.',
    ],
    [
      'Hair Coloring - Hands-On Practice',
      'cosmetology-dimension.webp',
      'Observe the dimension in the finished color. Document the supervised practice and feedback assigned by your trainer.',
    ],
    [
      'Skin Types and Analysis',
      'esthetic-analysis.webp',
      'Observe the consultation, lighting, and magnifier. Describe what you can observe without making a medical diagnosis.',
    ],
    [
      'Facial Treatments',
      'esthetic-cleansing.webp',
      'Observe gentle supported hand placement and the clean drape. Follow your assigned facial protocol and product directions.',
    ],
    [
      'Facial Massage Techniques',
      'esthetic-massage.webp',
      'Observe the supported cheek and jaw position. Your trainer must demonstrate the assigned movements and appropriate pressure.',
    ],
    [
      'Nail Anatomy and Disorders',
      'nail-manicure.webp',
      'Observe the natural nails and free edges. Record questions for your trainer; a photograph is not a diagnosis.',
    ],
    [
      'Manicure Services',
      'nail-filing.webp',
      'Observe the file at the nail’s free edge and the supported hand. Ask your trainer to demonstrate the assigned shaping technique.',
    ],
    [
      'Pedicure Services',
      'nail-pedicure.webp',
      'Identify the basin, fresh towel, and separated supplies. Explain the preparation required before a client arrives.',
    ],
    [
      'Client Consultation and Needs Assessment',
      'barber-consultation.webp',
      'Observe an attentive consultation. Adapt your questions to the service, client preferences, and needs.',
    ],
    [
      'Salon Business Practices',
      'salon-operations.webp',
      'Observe the receptionist and stylist reviewing an appointment planner. Explain how communication and scheduling support salon operations.',
    ],
  ],
  'prestige-elevation-esthetics': [
    [
      'Welcome to Esthetician Apprenticeship',
      'intro-esthetics.webp',
      'Observe the treatment bed, fresh supplies, and instructor-led preparation. Discuss the professional habits you will practice.',
    ],
    [
      'Professional Skin Analysis',
      'esthetic-analysis.webp',
      'Identify the consultation, lighting, and magnifier. Describe visible observations without diagnosing a condition.',
    ],
    [
      'Basic Facial Treatment Protocol',
      'esthetic-cleansing.webp',
      'Observe the clean drape and gentle cleansing position. Follow the instructor’s protocol and product directions.',
    ],
    [
      'Facial Treatments - Hands-On Practice',
      'esthetic-massage.webp',
      'Observe supported hand placement. Ask your instructor to demonstrate the movements assigned for your supervised practice.',
    ],
    [
      'Waxing Techniques',
      'esthetic-waxing.webp',
      'Identify the prepared warmer, single-use applicators, gloves, and strips. Explain your station preparation before supervised practice.',
    ],
  ],
  'prestige-elevation-nail-technology': [
    [
      'Welcome to Nail Technician Apprenticeship',
      'intro-nails.webp',
      'Observe the instructor, apprentice, practice hand, and organized supplies. Discuss how you will prepare for supervised nail-service practice.',
    ],
    [
      'Basic Manicure Procedure',
      'nail-manicure.webp',
      'Identify the fresh towel, supported hands, and single-use file. Explain your preparation before beginning a service.',
    ],
    [
      'Manicure - Hands-On Practice',
      'nail-filing.webp',
      'Observe where the file meets the nail’s free edge. Ask your trainer to demonstrate the shape and movement assigned for practice.',
    ],
    [
      'Pedicure Procedure',
      'nail-pedicure.webp',
      'Identify the prepared basin and fresh supplies. Explain the cleaning and setup procedure for your workstation.',
    ],
    [
      'Nail Product Knowledge',
      'nail-polish.webp',
      'Observe the brush, bottle, and thin polish application. Read product directions before use.',
    ],
    [
      'Sculptured Nails',
      'nail-gold.webp',
      'Observe the finished nail shapes in this design example. Discuss the underlying structure and finishing steps with your trainer.',
    ],
    [
      'Gel and Acrylic Application',
      'nail-enhancement.webp',
      'Observe the trainer positioning an artificial tip on a practice hand. The picture does not replace your supervised application demonstration or product directions.',
    ],
    [
      'Nail Enhancements - Hands-On Practice',
      'nail-gemstone.webp',
      'Examine the finished shape and decorative placement. Record your assigned supervised practice and instructor feedback.',
    ],
  ],
};

export function workbookVisualAssignments(
  slug: string,
  sections: readonly { id: string; title: string; section_number: number }[],
): Record<string, WorkbookVisual> {
  const result: Record<string, WorkbookVisual> = {};
  const used = new Set<string>();
  for (const section of [...sections].sort((a, b) => a.section_number - b.section_number)) {
    const picture = examples[slug]?.find(([topic]) => topic === section.title);
    if (!picture) continue;
    const [, file, caption] = picture;
    const src = file.startsWith('/') ? file : `${fresh}${file}`;
    if (used.has(src)) continue;
    used.add(src);
    result[section.id] = {
      src,
      caption,
      alt: `${section.title}: ${caption}`,
      generated: !file.startsWith('/'),
    };
  }
  return result;
}
