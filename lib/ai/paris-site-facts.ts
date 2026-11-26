/**
 * PARIS site facts — retrieval over Elevate's own program catalog.
 *
 * The owned model cannot browse the web and has no tool calls, so facts reach
 * it only through the prompt. This module scans the same canonical program
 * data the public program pages render (lib/programs/static-registry) and
 * returns the verified facts for the programs the visitor's question is
 * actually about. Nothing here invents a price, duration, credential, or
 * funding claim: every line comes from the registry or the funding registry.
 *
 * Keep the output small: the model is a 7B CPU model and every prompt token
 * costs generation time. At most two programs, compact lines only.
 */
import { ALL_PROGRAMS } from '@/lib/programs/static-registry';
import type { ProgramSchema } from '@/lib/programs/program-schema';

const MAX_PROGRAMS = 2;
const MIN_SCORE = 6;

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'what', 'how', 'when', 'where', 'which',
  'that', 'this', 'does', 'need', 'want', 'like', 'about', 'your', 'are',
  'can', 'get', 'into', 'from', 'have', 'has', 'been', 'will', 'would',
  'should', 'there', 'their', 'they', 'them', 'then', 'than', 'also',
  'more', 'much', 'many', 'some', 'any', 'all', 'per', 'its',
  'you', 'our', 'ours', 'she', 'her', 'his', 'him', 'who', 'whom',
  'tell', 'know', 'give', 'find', 'help', 'please', 'just', 'really',
  'very', 'able', 'take', 'make', 'work', 'school', 'program',
  'course', 'class', 'training', 'learn', 'start', 'join', 'sign',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function fieldTokens(text: string | undefined): Set<string> {
  return new Set(tokenize(text || ''));
}

function scoreProgram(program: ProgramSchema, queryTokens: string[]): number {
  const title = fieldTokens(program.title);
  const slug = new Set(program.slug.split('-'));
  const subtitle = fieldTokens(program.subtitle);
  const credentials = fieldTokens(
    program.credentials?.map((credential) => credential.name + ' ' + credential.description).join(' '),
  );
  const outcomes = fieldTokens(program.outcomes?.map((outcome) => outcome.statement).join(' '));
  const meta = fieldTokens(
    [program.sector, program.category, program.programType, program.fundingStatement].join(' '),
  );
  let score = 0;
  for (const token of new Set(queryTokens)) {
    if (title.has(token)) score += 6;
    else if (slug.has(token)) score += 5;
    else if (credentials.has(token)) score += 4;
    else if (subtitle.has(token)) score += 3;
    else if (meta.has(token)) score += 2;
    else if (outcomes.has(token)) score += 1;
  }
  // A two-word phrase from the question appearing in the title or subtitle
  // (e.g. "epa 608", "barber apprentice") is a strong match.
  const haystack = `${program.title} ${program.subtitle}`.toLowerCase();
  for (let i = 0; i < queryTokens.length - 1; i += 1) {
    if (haystack.includes(`${queryTokens[i]} ${queryTokens[i + 1]}`)) score += 6;
  }
  return score;
}

/**
 * Best-matching programs for a visitor question. Pass the last user message,
 * or the last two joined (so a follow-up like "how much does it cost?" still
 * matches the program from the previous turn). Returns at most two programs.
 */
export function findSiteFacts(message: string, limit: number = MAX_PROGRAMS): ProgramSchema[] {
  const queryTokens = tokenize(message);
  if (queryTokens.length === 0) return [];
  return ALL_PROGRAMS.map((program) => ({
    program,
    score: scoreProgram(program, queryTokens),
  }))
    .filter((entry) => entry.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.program);
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Compact verified facts for the matched programs, ready to append to a prompt. */
export function formatSiteFacts(programs: ProgramSchema[]): string {
  return programs
    .map((program) => {
      const lines: string[] = [
        `- ${program.title} — /programs/${program.slug}`,
        `  ${truncate(program.subtitle, 300)}`,
        `  ${program.durationWeeks}-week ${program.deliveryMode} program; ${program.schedule}; ${program.cohortSize}. Self-pay ${program.selfPayCost}.`,
        `  Funding: ${truncate(program.fundingStatement, 240)}`,
      ];
      if (program.credentials?.length) {
        lines.push(
          `  Credentials: ${program.credentials
            .map((credential) => `${credential.name} (${truncate(credential.description, 120)})`)
            .join('; ')}.`,
        );
      }
      if (program.outcomes?.length) {
        lines.push(
          `  You will be able to: ${program.outcomes
            .slice(0, 3)
            .map((outcome) => outcome.statement)
            .join('; ')}.`,
        );
      }
      if (program.careerPathway?.length) {
        lines.push(
          `  First jobs: ${program.careerPathway
            .slice(0, 2)
            .map((step) => `${step.title} (${step.salaryRange})`)
            .join('; ')}.`,
        );
      }
      return lines.join('\n');
    })
    .join('\n');
}

/** Full catalog index for when no program matched: titles only, so PARIS can point, not guess. */
export function formatProgramIndex(): string {
  const titles = ALL_PROGRAMS.map((program) => program.title).join(', ');
  return (
    'No program in the catalog matched this question directly. ' +
    `Elevate's current programs (see /programs): ${titles}. ` +
    'Point to the closest program page instead of guessing.'
  );
}
