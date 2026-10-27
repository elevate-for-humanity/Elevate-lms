/** Teaching modality is independent of whether a formal standard was found.
 * Classify from the lesson title, never incidental verbs in generic objectives.
 * Authority identifiers remain the responsibility of the standards loader.
 */
export function classifyCompetency(title, description = '') {
  const value = String(title ?? '').toLowerCase();
  const checkpoint = /checkpoint|examination|exam preparation|license requirements|welcome|orientation|anatomy|theory|fundamentals|ethics|disorders/.test(value);
  const practical = !checkpoint && /haircut|cutting|trim|shav|shampoo|conditioning|blow.?dry|hairstyl|updo|thermal styling|hair pressing|chemical texture|perms|relaxers|single.process color|highlights|lowlights|color correction|hair coloring|facial treatments|facial massage|makeup application|manicure|pedicure|sanitation|disinfection|sanitization|clean tools|clean facilities|protective coverings|hands.on/.test(value);
  const decision = !checkpoint && !practical && /consultation|needs assessment|discuss|recommend|select|decide|analysis/.test(value);
  return {
    type: practical ? 'practical_skill' : decision ? 'decision' : 'knowledge',
    requiresDemonstration: practical,
    requiresPracticalEvidence: practical,
    criticalSafetyCompetency: /infection control|sanitat|disinfect|sanitiz|protective|safety|chemical texture/.test(value),
  };
}
