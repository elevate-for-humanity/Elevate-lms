/**
 * B-roll topic vocabulary for video generation.
 *
 * Each entry maps a topic key → Pexels search query.
 * The pipeline picks the best matching key from lesson content via regex,
 * then fetches/caches the clip in Supabase course-videos/broll/.
 *
 * To add a new program's vocabulary, append entries here and add
 * corresponding regex rules to pickBrollKey().
 */

export const BROLL_MAP: Record<string, string> = {
  // ── Barbering ────────────────────────────────────────────────────────────
  'infection-control': 'barber disinfecting tools',
  'disinfecting-clippers': 'barber cleaning clippers',
  'disinfecting-scissors': 'barber cleaning scissors',
  'washing-hands-barber': 'person washing hands professional',
  'ppe-barber': 'barber wearing gloves mask',
  'blood-exposure-protocol': 'medical gloves safety protocol',
  'disposing-single-use': 'disposing single use items',
  'osha-barbershop': 'workplace safety professional',
  'cleaning-barber-station': 'barber cleaning workstation',
  'barber-cutting-hair': 'barber cutting hair client',
  'barber-beard-trim': 'barber trimming beard',
  'barber-lineup': 'barber lineup fade haircut',
  'barber-shaving': 'barber straight razor shaving',
  'barber-shampoo': 'barber washing hair client',
  'barber-styling': 'barber styling hair product',
  'client-consultation': 'barber talking client consultation',
  'first-impression-barber': 'professional barber greeting client',
  'professional-appearance': 'professional grooming appearance',
  'ethics-professional': 'professional handshake business',
  'ergonomics-posture': 'professional standing posture ergonomics',
  'hair-color-chemical': 'hair color chemical application',
  'chemical-handling': 'chemical safety handling gloves',
  'patch-test': 'skin patch test allergy',
  'ph-scale-hair': 'hair science laboratory',
  'relaxer-texturizer': 'hair relaxer chemical treatment',
  'sds-safety-data-sheet': 'safety data sheet chemical',
  'apprentice-training': 'apprentice learning mentor training',
  'indiana-license-renewal': 'professional license certificate',
  'barber-license-exam': 'exam test professional certification',
  'state-board-exam-prep': 'studying exam preparation',
  'client-retention': 'happy customer barber shop',
  'handling-complaints': 'customer service professional',
  'smart-goals-planning': 'planning goals whiteboard',
  'time-management-barber': 'time management schedule professional',
  'logging-hours-timesheet': 'timesheet hours logging work',
  'burnout-wellness': 'wellness mental health professional',
  'neck-strip-cape': 'barber cape neck strip client',
  'barbershop-intro': 'barbershop interior professional',

  // ── HVAC ─────────────────────────────────────────────────────────────────
  'hvac-refrigerant': 'hvac refrigerant technician',
  'hvac-tools': 'hvac tools equipment professional',
  'hvac-safety': 'hvac safety equipment technician',
  'hvac-electrical': 'electrical wiring hvac system',
  'hvac-compressor': 'air conditioning compressor unit',
  'hvac-ductwork': 'hvac ductwork installation',
  'hvac-thermostat': 'thermostat hvac control',
  'hvac-inspection': 'hvac inspection technician',
  'hvac-certification': 'hvac certification exam professional',
  'epa-608': 'epa certification refrigerant handling',

  // ── Esthetics / Cosmetology ───────────────────────────────────────────────
  'skin-care-facial': 'esthetician facial skin care',
  'waxing-technique': 'waxing hair removal professional',
  'makeup-application': 'makeup artist professional application',
  'skin-analysis': 'skin analysis professional esthetician',
  'chemical-peel': 'chemical peel skin treatment',
  microdermabrasion: 'microdermabrasion skin treatment',
  'nail-care': 'nail technician manicure professional',
  'salon-sanitation': 'salon sanitation cleaning professional',
  'cosmetology-license': 'cosmetology license exam professional',

  // ── Healthcare / CCMA ────────────────────────────────────────────────────
  'medical-assistant': 'medical assistant clinic professional',
  'vital-signs': 'nurse taking vital signs patient',
  phlebotomy: 'phlebotomy blood draw medical',
  'ehr-records': 'electronic health records computer medical',
  'patient-care': 'patient care hospital professional',
  'medical-terminology': 'medical terminology study professional',
  'clinical-procedures': 'clinical procedure medical professional',
  'hipaa-compliance': 'medical privacy compliance professional',

  // ── Peer Recovery ────────────────────────────────────────────────────────
  'peer-support': 'peer support group counseling',
  'recovery-coaching': 'recovery coaching counseling professional',
  'mental-health': 'mental health counseling professional',
  'substance-use': 'substance use recovery support',
  'motivational-interview': 'counseling interview professional',
  'crisis-intervention': 'crisis intervention professional',

  // ── General / Fallback ───────────────────────────────────────────────────
  'classroom-learning': 'professional classroom learning training',
  'certification-general': 'professional certification exam study',
  'workplace-professional': 'professional workplace office',
  teamwork: 'teamwork collaboration professional',
  default: 'professional training education',
};

/**
 * Pick the best b-roll key for a block of lesson text.
 * Checks barbering first (most specific), then HVAC, then healthcare, then general.
 */
export function pickBrollKey(text: string): string {
  const t = text.toLowerCase();

  // Barbering
  if (/infect|sanitiz|disinfect|steril/.test(t)) return 'infection-control';
  if (/clipper/.test(t)) return 'disinfecting-clippers';
  if (/scissor|shear/.test(t)) return 'disinfecting-scissors';
  if (/wash.*hand|hand.*wash/.test(t)) return 'washing-hands-barber';
  if (/ppe|glove|mask|protective/.test(t)) return 'ppe-barber';
  if (/blood|exposure|pathogen/.test(t)) return 'blood-exposure-protocol';
  if (/dispos|single.use/.test(t)) return 'disposing-single-use';
  if (/osha|regulation|compliance/.test(t)) return 'osha-barbershop';
  if (/clean.*station|station.*clean/.test(t)) return 'cleaning-barber-station';
  if (/fade|taper|blend/.test(t)) return 'barber-cutting-hair';
  if (/beard|trim/.test(t)) return 'barber-beard-trim';
  if (/lineup|edge/.test(t)) return 'barber-lineup';
  if (/shav|straight razor/.test(t)) return 'barber-shaving';
  if (/shampoo|wash.*hair/.test(t)) return 'barber-shampoo';
  if (/style|product|pomade/.test(t)) return 'barber-styling';
  if (/consult|intake|assess/.test(t)) return 'client-consultation';
  if (/first impression|greeting|welcome/.test(t)) return 'first-impression-barber';
  if (/professional.*appear|dress|image/.test(t)) return 'professional-appearance';
  if (/ethic|conduct|boundary/.test(t)) return 'ethics-professional';
  if (/ergonomic|posture|stance/.test(t)) return 'ergonomics-posture';
  if (/color|colour|dye/.test(t)) return 'hair-color-chemical';
  if (/chemical|hazard/.test(t)) return 'chemical-handling';
  if (/patch test|allerg/.test(t)) return 'patch-test';
  if (/\bph\b|acid|alkaline/.test(t)) return 'ph-scale-hair';
  if (/relaxer|texturiz/.test(t)) return 'relaxer-texturizer';
  if (/sds|safety data/.test(t)) return 'sds-safety-data-sheet';
  if (/apprentice|mentor/.test(t)) return 'apprentice-training';
  if (/licens|renew/.test(t)) return 'indiana-license-renewal';
  if (/exam|test|board/.test(t)) return 'barber-license-exam';
  if (/retention|loyal|repeat/.test(t)) return 'client-retention';
  if (/complaint|conflict|difficult/.test(t)) return 'handling-complaints';
  if (/goal|plan|objective/.test(t)) return 'smart-goals-planning';
  if (/time|schedul|priorit/.test(t)) return 'time-management-barber';
  if (/hour|timesheet|log/.test(t)) return 'logging-hours-timesheet';
  if (/burnout|wellness|stress|mental/.test(t)) return 'burnout-wellness';
  if (/cape|neck strip/.test(t)) return 'neck-strip-cape';
  if (/barber/.test(t)) return 'barbershop-intro';

  // HVAC
  if (/refrigerant|freon|coolant/.test(t)) return 'hvac-refrigerant';
  if (/hvac|heat.*cool|air.*condition/.test(t)) return 'hvac-tools';
  if (/epa.608|608/.test(t)) return 'epa-608';
  if (/compressor/.test(t)) return 'hvac-compressor';
  if (/duct/.test(t)) return 'hvac-ductwork';
  if (/thermostat/.test(t)) return 'hvac-thermostat';

  // Healthcare
  if (/vital|blood pressure|pulse/.test(t)) return 'vital-signs';
  if (/phlebotom|blood draw/.test(t)) return 'phlebotomy';
  if (/ehr|electronic.*record/.test(t)) return 'ehr-records';
  if (/patient|clinic/.test(t)) return 'patient-care';
  if (/hipaa|privacy/.test(t)) return 'hipaa-compliance';
  if (/medical assistant|ccma/.test(t)) return 'medical-assistant';

  // Peer recovery
  if (/peer.*support|support.*group/.test(t)) return 'peer-support';
  if (/recover|sobriet/.test(t)) return 'recovery-coaching';
  if (/crisis/.test(t)) return 'crisis-intervention';
  if (/motivat.*interview/.test(t)) return 'motivational-interview';

  // Esthetics
  if (/facial|skin care/.test(t)) return 'skin-care-facial';
  if (/wax/.test(t)) return 'waxing-technique';
  if (/makeup|cosmetic/.test(t)) return 'makeup-application';
  if (/nail/.test(t)) return 'nail-care';

  return 'default';
}
