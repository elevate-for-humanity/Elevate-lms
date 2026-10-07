import { ULTIMATE_TEACHING_SEQUENCE } from './teaching-sequence';

// Teaching text is drawn from complete authored sections. Transport JSON,
// authoring labels and HTML are never narration, and source text is not clipped.
export function spokenText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/(?:p|li|h[1-6]|div)>/gi, '. ')
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ')
    .replace(/\.\s*\./g, '.').trim();
}
type Source = { id: string; text: string };
type Question = { question: string; options: string[]; correct: number; explanation: string };
export function sourceTeaching(sources: Source[], title: string) {
  const teaching: string[] = [], terminology: string[] = [], examples: string[] = [];
  const procedure: string[] = [], safety: string[] = [], exercises: string[] = [], recap: string[] = [];
  const questions: Question[] = [];
  for (const source of sources) {
    const marker = 'Authorized course content: ';
    const at = source.text.indexOf(marker);
    if (at >= 0) {
      let payload: any;
      try { payload = JSON.parse(source.text.slice(at + marker.length)); }
      catch { throw new Error('ULTIMATE_INSTRUCTIONAL_SOURCE_JSON_INVALID'); }
      const experience = payload.experience ?? {};
      const sections = experience.readingGuide?.sections;
      // HTML is the complete canonical teaching body; the reading guide may be
      // an abbreviated summary, so it must not replace the actual lesson.
      const body = spokenText(payload.html);
      if (body) teaching.push(body);
      else if (Array.isArray(sections))
        teaching.push(...sections.map((s: any) => spokenText(`${s.heading ?? ''}. ${s.body ?? ''}`)).filter(Boolean));
      for (const term of experience.glossary ?? []) {
        const text = spokenText(`${term.term ?? ''}: ${term.definition ?? ''}`);
        if (text) terminology.push(text);
      }
      if (typeof payload.scenario === 'string') examples.push(spokenText(payload.scenario));
      if (experience.caseStudy?.context) examples.push(spokenText(experience.caseStudy.context));
      for (const exercise of experience.exercises ?? []) {
        const text = spokenText([exercise.title, ...(exercise.instructions ?? []), exercise.expectedArtifact].filter(Boolean).join('. '));
        if (text) exercises.push(text);
      }
      const practical = experience.practicalTask;
      if (typeof practical === 'string') procedure.push(spokenText(practical));
      else if (practical?.instructions) procedure.push(spokenText([practical.title, ...practical.instructions].filter(Boolean).join('. ')));
      for (const point of experience.readingGuide?.keyTakeaways ?? payload.learning_points ?? [])
        if (typeof point === 'string') recap.push(spokenText(point));
      for (const q of experience.knowledgeChecks ?? [])
        if (typeof q.question === 'string' && Array.isArray(q.options) && q.options.length >= 3 &&
          q.options.every((x: unknown) => typeof x === 'string') && Number.isInteger(q.correct) &&
          q.correct >= 0 && q.correct < q.options.length && typeof q.explanation === 'string')
          questions.push({question: spokenText(q.question), options: q.options.map(spokenText), correct: q.correct, explanation: spokenText(q.explanation)});
    } else {
      // Registered trade sources carry multiple complete lessons. Retain every
      // lesson body, including procedures after the former 900-character cutoff.
      for (const block of source.text.split(/\n\s*\n(?=Module:)/)) {
        const bodyAt = block.indexOf('Authorized content:');
        const body = bodyAt >= 0 ? block.slice(bodyAt + 'Authorized content:'.length) : block;
        const labels = /\b(Overview|Tools Required|Client Assessment|Client Considerations|Procedure|Safety|Failure Recovery|Visual Cues)\b/g;
        const matches = [...body.matchAll(labels)];
        if (!matches.length) { teaching.push(spokenText(body)); continue; }
        const prefix = spokenText(body.slice(0, matches[0].index));
        if (prefix) teaching.push(prefix);
        for (let i = 0; i < matches.length; i++) {
          const text = spokenText(body.slice(matches[i].index! + matches[i][0].length, matches[i+1]?.index ?? body.length));
          if (!text) continue;
          const label = matches[i][0];
          if (label === 'Procedure' || label === 'Visual Cues') procedure.push(text);
          else if (label === 'Safety' || label === 'Failure Recovery') safety.push(text);
          else if (label === 'Tools Required') terminology.push(text);
          else if (label.startsWith('Client')) examples.push(text);
          else teaching.push(text);
        }
      }
    }
  }
  const clean = (items: string[]) => [...new Set(items.filter(Boolean))].join(' ');
  const body = clean(teaching);
  if (!body) throw new Error('ULTIMATE_SUBSTANTIVE_AUTHORED_TEACHING_REQUIRED');
  const steps = clean(procedure), precautions = clean(safety), practice = clean(exercises);
  const first = questions[0], alternate = questions.find(q => q.question !== first?.question);
  const questionText = (q?: Question) => q
    ? `${q.question} Pause and choose your response. ${q.explanation}`
    : `Pause and explain the procedure for ${title} in your own words. Check your explanation against the steps taught in this lesson.`;
  const stageText: Record<string, string> = {
    why_it_matters: `This lesson develops ${title}. You will use the taught information to make and explain a workplace decision.`,
    activate_prior_knowledge: `Before we begin, think about a time you encountered ${title}. What did you do, and what information did you need? Compare your answer with the lesson as we work through it.`,
    terminology: clean(terminology) || `As you listen, note each technical term in the explanation and describe what it means in the situation being taught.`,
    concept_explanation: body,
    instructor_example: clean(examples) || `Consider applying ${title} at work. Describe the situation, identify what you need to know, and explain how the taught information changes your decision.`,
    demonstration: steps || `Here is the information to check before making your decision. ${body}`,
    guided_practice: practice || `Work through the demonstrated steps with your instructor. Explain each action before you perform it. Ask for feedback and repeat any step that does not match the demonstration.`,
    independent_practice: `Now apply ${title} without the prompts. ${practice || 'Write or demonstrate your response to the situation discussed in the lesson. Record what you did and why.'} Compare your result with the lesson and identify anything you need to correct.`,
    knowledge_check: questionText(first),
    mistake_and_correction: precautions || `A response is incomplete if it omits a required part of the taught information. Compare each part of your response with the lesson, identify the missing part, and correct it before proceeding.`,
    assessment: questionText(alternate),
    remediation: `If your answer differed from the explanation, return to that part of the lesson. Explain the reason for the correct answer, work through another example with your instructor, and attempt a different question.`,
    recap: clean(recap) || `You have worked through ${title}, practiced applying it, and checked your response. Explain the steps and the reasons for your decisions. Use the lesson to check any point you cannot yet explain.`,
  };
  return { stageText, questions, precautions, sequence: ULTIMATE_TEACHING_SEQUENCE };
}
// Keep source sentences intact while bounding individual narration/ASR work.
export function narrationChunks(text: string, maximumWords = 160): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(?:["']|$)?|[^.!?]+$/g) ?? [text];
  const chunks: string[] = []; let current = '';
  for (const sentence of sentences) {
    const next = sentence.trim();
    if (current && `${current} ${next}`.split(/\s+/).length > maximumWords) { chunks.push(current); current = ''; }
    current = current ? `${current} ${next}` : next;
  }
  if (current) chunks.push(current);
  return chunks;
}
