/** Compare instructional content, not sentence spelling. This is evidence
 * matching, not a license check or proof of a complete procedural sequence. */
export type VisualCompatibility = {
  compatible: boolean;
  coverage: number;
  matchedConcepts: string[];
  missingConcepts: string[];
};

const FILLER = new Set((
  'a an and are as at be been being by for from has have how in into is it its of on or the to ' +
  'using use used with your their his her this that these those show shows showing shown ' +
  'relevant non looping instructional visual visuals video footage scene lesson course ' +
  'during demonstrate demonstrates illustrating illustrate depicting depict displaying display ' +
  'introduction introductory overview basics basic fundamentals example context contextual ' +
  'seated standing person someone clearly visible'
).split(' '));

// Only equivalent concepts are collapsed. Cleaning, disinfecting and sterilizing
// remain different actions; refrigerant recovery is not evacuation or charging.
const GROUPS: Record<string, string> = {
  wash: 'wash washes washed washing',
  massage: 'massage massages massaged massaging',
  cut: 'cut cuts cutting trim trims trimmed trimming',
  shave: 'shave shaves shaved shaving',
  brush: 'brush brushes brushed brushing',
  apply: 'apply applies applied applying application',
  discuss: 'discuss discusses discussed discussing talk talks talked talking',
  consult: 'consult consults consulting consultation consultations',
  handle: 'handle handles handled handling',
  select: 'select selects selected selecting selection choose chooses choosing choice',
  measure: 'measure measures measured measuring measurement measurements',
  inspect: 'inspect inspects inspected inspecting inspection examine examines examining',
  clean: 'clean cleans cleaned cleaning',
  disinfect: 'disinfect disinfects disinfected disinfecting disinfection',
  sterilize: 'sterilize sterilizes sterilized sterilizing sterilization sterilise sterilising',
  connect: 'connect connects connected connecting attach attaches attached attaching',
  disconnect: 'disconnect disconnects disconnected disconnecting detach detached detaching',
  install: 'install installs installed installing installation',
  remove: 'remove removes removed removing removal',
  open: 'open opens opened opening',
  close: 'close closes closed closing',
  approve: 'approve approves approved approving approval',
  recover: 'recover recovers recovered recovering recovery',
  evacuate: 'evacuate evacuates evacuated evacuating evacuation',
  charge: 'charge charges charged charging',
  rinse: 'rinse rinses rinsed rinsing',
  spray: 'spray sprays sprayed spraying',
  wipe: 'wipe wipes wiped wiping',
  wind: 'wind winds winding wrap wraps wrapped wrapping',
  secure: 'secure secures secured securing',
  write: 'write writes writing written',
};
const SUBJECTS: Record<string, string> = {
  customer: 'client clients customer customers',
  hair: 'hair hairs', scalp: 'scalp scalps', beard: 'beard beards',
  hand: 'hand hands', foot: 'foot feet', face: 'face faces',
  sink: 'sink sinks basin basins', scissors: 'scissor scissors shears',
  clipper: 'clipper clippers', tool: 'tool tools', glove: 'glove gloves',
  foil: 'foil foils', bleach: 'bleach', color: 'color colors colour colours',
  root: 'root roots', rod: 'rod rods', pin: 'pin pins',
  compressor: 'compressor compressors', refrigerant: 'refrigerant refrigerants',
  valve: 'valve valves', wire: 'wire wires wiring', gauge: 'gauge gauges',
  voltage: 'voltage volts', current: 'current amperage amps',
  invoice: 'invoice invoices', inventory: 'inventory inventories',
  supervisor: 'supervisor supervisors',
};
const ALIASES = new Map<string, string>();
for (const [concept, words] of Object.entries({ ...GROUPS, ...SUBJECTS })) {
  for (const word of words.split(' ')) ALIASES.set(word, concept);
}
const ACTIONS = new Set(Object.keys(GROUPS));
const OBJECTS = new Set(Object.keys(SUBJECTS));
const QUALIFIERS = new Set((
  'red black white blue green yellow high low hot cold positive negative live ' +
  'deenergized grounded ungrounded supply return inlet outlet left right'
).split(' '));
// Avoid interpreting negative/conditional evidence as a positive demonstration.
const UNSUPPORTED_POLARITY = /\b(?:no|not|never|without|cannot|cant|isnt|arent|doesnt|dont|unsafe|unless|if)\b/i;

function contentText(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['’]/g, '')
    .replace(/\bnon[- ]looping\b/g, '')
    .replace(/\bwithout (?:looping|repetition)\b/g, '')
    // These suffixes are storyboard stage labels, not visible subject matter.
    .replace(/\s+during\s+(?:why it matters|welcome|learning objectives?|explanation|summary|recap|knowledge check)[.!?]*\s*$/g, '')
    .replace(/\b(?:shampooing|shampooed|shampoos|shampoo)\b/g, 'wash hair')
    .replace(/\bhair[- ]?cuts?\b/g, 'cut hair')
    .replace(/\bblow[- ]dry(?:ing|er|ers)?\b/g, 'blowdry')
    .replace(/\battachment combs?\b/g, 'guard')
    .replace(/\bclose[- ](?:up|view)\b/g, 'closeup')
    .replace(/\bde[- ]energized\b/g, 'deenergized');
}

function concepts(text: string): string[] {
  const terms = text.split(/[^a-z0-9]+/).filter(Boolean)
    .map((term) => ALIASES.get(term) ?? term)
    .filter((term) => !FILLER.has(term));
  // A customer conversation can support a consultation context. It does not
  // establish a completed consultation, consent, or supervisor sign-off.
  if (terms.includes('customer') && terms.includes('discuss')) terms.push('consult');
  return [...new Set(terms)];
}

export function visualRequirementCompatibility(
  requirement: string,
  observations: string | readonly string[],
): VisualCompatibility {
  const text = contentText(requirement);
  const required = concepts(text);
  const observed = (typeof observations === 'string' ? [observations] : observations)
    .map(contentText).filter((value) => !UNSUPPORTED_POLARITY.test(value));
  const evidenceSets = observed.map((value) => new Set(concepts(value)));
  const available = new Set(observed.flatMap(concepts));
  const matchedConcepts = required.filter((term) => available.has(term));
  const missingConcepts = required.filter((term) => !available.has(term));
  const coverage = required.length ? matchedConcepts.length / required.length : 0;
  const clauses = text.split(/\b(?:and|then|plus)\b|[;,]/).map(concepts)
    .filter((terms) => terms.length > 0);
  const isAnchor = (term: string) => ACTIONS.has(term) || OBJECTS.has(term) ||
    QUALIFIERS.has(term) || /^\d+$/.test(term);
  const requiredAnchors = required.filter(isAnchor);
  const compatible = required.length > 0 && !UNSUPPORTED_POLARITY.test(text) &&
    coverage >= 0.6 && requiredAnchors.every((term) => available.has(term)) &&
    // A requested action and its subject must coexist in one observation.
    // Do not combine 'washing feet' + 'cutting hair' into 'washing hair'.
    clauses.every((terms) => evidenceSets.some((evidence) => {
      const matches = terms.filter((term) => evidence.has(term)).length;
      return terms.filter(isAnchor).every((term) => evidence.has(term)) &&
        matches >= Math.min(2, terms.length) && matches / terms.length >= 0.6;
    }));
  return { compatible, coverage, matchedConcepts, missingConcepts };
}
