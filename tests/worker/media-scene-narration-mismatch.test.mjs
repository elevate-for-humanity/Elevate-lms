import assert from 'node:assert/strict';
import {test} from 'node:test';
import {narrationCoverage} from '../../lib/video/narration-coverage.mjs';
import {narrationTokens, narrationSpeechText} from '../../lib/ultimate-course-builder/instructional/narration-numbers.mjs';

/**
 * Regression for the first confirmed Course Builder failure of job
 * 82376411-d7f7-4df4-9ef2-af3bd7ed0878 (build 34572600, lesson
 * 75cf74b1-c2ce-5322-918e-7a1f7265bdba):
 *   finished_media_qa MEDIA_SCENE_NARRATION_MISMATCH:scene:seg-05-example:0.713
 * emitted by the per-scene narration check in lib/video/media-quality-gate.ts.
 *
 * That value is exactly 67/94. Both recorded failures are quotients of the
 * retired vocabulary denominator (`normalizedWords`), not of the current
 * `narrationTokens` denominator, so the corrected producer cannot emit them.
 */
const SCENE_05 = "Examine the core worked example from our curriculum. Three $30 services produce $90 revenue. With $30 cash sales, a $20 starting float and an $8 documented cash expense, expected cash is $42. Notice how revenue differs from cash: two customers paid sixty dollars via credit cards, so only thirty dollars entered the till. Adding the twenty-dollar starting float yields fifty dollars, and subtracting the eight-dollar supply expense leaves exactly forty-two dollars.\n\nAdding a twenty-dollar float and thirty dollars cash minus an eight-dollar expense yields forty-two dollars expected cash.";
const SCENE_09 = "Now solve these multi-part transactions independently without netting unrelated accounts together. A client pays nine hundred dollars in advance, and the firm subsequently earns five hundred dollars of that total. Next, remit three hundred dollars against an existing vendor bill, process a six-hundred-eighty-dollar loan payment with eighty dollars interest, and record one thousand dollars in gross wages with two hundred dollars withheld.\n\nIndependently log customer advances, supplier payments, wage deductions, and split loan installments without netting accounts.";

const vocabularyWords = value => String(value ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];

// The retired coverage metric: distinct-vocabulary overlap over raw words.
function retiredVocabularyCoverage(script, delivered) {
  const expected = vocabularyWords(script);
  if (!expected.length) return 1;
  const observed = new Set(vocabularyWords(delivered));
  return expected.filter(word => observed.has(word)).length / expected.length;
}

const premiumFloor = 0.75; // approved-premium-v1 advisory floor
const toFixed3 = value => value.toFixed(3);

test('the recorded scene-narration failures are retired-metric quotients the current producer cannot emit', () => {
  // Recorded: seg-05-example:0.713 and seg-09-independent-practice:0.741.
  for (const [authored, recorded] of [[SCENE_05, '0.713'], [SCENE_09, '0.741']]) {
    const total = narrationTokens(authored).length;
    const attainable = [];
    for (let covered = 0; covered <= total; covered++)
      if (toFixed3(covered / total) === recorded) attainable.push(covered);
    assert.deepEqual(attainable, [], 'no count over the current denominator may reproduce ' + recorded);
  }
  // The same recorded values are exact quotients of the retired denominator.
  assert.equal(toFixed3(67 / 94), '0.713');
  assert.equal(toFixed3(60 / 81), '0.741');
  assert.equal(vocabularyWords(SCENE_05).length, 94);
  assert.equal(vocabularyWords(SCENE_09).length, 81);
  assert.equal(narrationTokens(SCENE_05).length, 98);
  assert.equal(narrationTokens(SCENE_09).length, 74);
});

test('a legitimately narrated scene clears the premium floor in every equivalent spoken spelling', () => {
  const spoken = narrationSpeechText(SCENE_05);
  const amountToDigits = value => value
    .replace(/\b(thirty|ninety|twenty|eight|forty two|sixty|fifty|forty) dollars\b/g, match => ({
      'thirty dollars': '30 dollars', 'ninety dollars': '90 dollars',
      'twenty dollars': '20 dollars', 'eight dollars': '8 dollars',
      'forty two dollars': '42 dollars', 'sixty dollars': '60 dollars',
      'fifty dollars': '50 dollars', 'forty dollars': '40 dollars',
    })[match]);
  const asrSpellings = {
    'words as spoken': spoken,
    'digits with the currency word': amountToDigits(spoken),
    'digits without the currency word': amountToDigits(spoken).replace(/\bdollars?\b/g, '').replace(/\s+/g, ' ').trim(),
    'authored currency symbols': spoken.replace(/\b(thirty|ninety|twenty|eight|forty two|sixty|fifty|forty) dollars\b/g, match => ({
      'thirty dollars': '$30', 'ninety dollars': '$90', 'twenty dollars': '$20',
      'eight dollars': '$8', 'forty two dollars': '$42', 'sixty dollars': '$60',
      'fifty dollars': '$50', 'forty dollars': '$40',
    })[match]),
  };
  for (const [label, delivered] of Object.entries(asrSpellings)) {
    const coverage = narrationCoverage(SCENE_05, delivered);
    assert.ok(coverage >= premiumFloor, label + ' scored ' + coverage.toFixed(6));
  }
  // The retired metric is what pushed this scene toward the floor: identical
  // words, a lower score, because it counted "$30" and "thirty" as different.
  assert.equal(narrationCoverage(SCENE_05, spoken), 1);
  assert.ok(retiredVocabularyCoverage(SCENE_05, spoken) < narrationCoverage(SCENE_05, spoken));
});

test('genuinely missing or truncated narration still fails closed', () => {
  const clauses = SCENE_05.split(/(?<=\.)\s+/);
  const truncated = clauses.slice(0, 2).join(' ');            // most of the scene never spoken
  const firstClauseOnly = clauses[0];
  const unrelated = 'A frequent career pitfall is circulating a message that omits a direct query.';
  for (const [label, delivered] of [
    ['truncated delivery', truncated],
    ['single clause only', firstClauseOnly],
    ['unrelated narration', unrelated],
  ]) {
    const coverage = narrationCoverage(SCENE_05, delivered);
    assert.ok(coverage < premiumFloor, label + ' must stay below the floor, scored ' + coverage.toFixed(6));
  }
  // A scene whose recap part was never delivered is still reported, not accepted
  // as complete coverage of the authored dialogue.
  const withoutRecap = SCENE_05.split('\n\n')[0];
  assert.ok(narrationCoverage(SCENE_05, withoutRecap) < 1);
});
