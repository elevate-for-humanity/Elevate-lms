import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { directMedia } from '@/lib/video/media-director';
import {
  approveControlledStoryboard,
  reviewControlledStoryboard,
} from '@/lib/video/controlled-media-contract';

/**
 * Regression coverage for the platform-wide controlled-media failure
 * (CONTROLLED_MEDIA_REVIEW_FAILED: A knowledge-check scene is required.)
 *
 * The Course Factory compiler persists lesson storyboards in its own
 * authored shape: scenes carry a `purpose` (introduction / explanation /
 * diagram / demonstration / practice / summary), narration, and timeline
 * start/end times — but no `scene_type`. The media director used to ignore
 * `purpose` entirely and positionally guessed scene types from an
 * eight-slot arc that only reaches its knowledge-check slot on boards of
 * eight or more scenes, so every compiled six-scene lesson failed review
 * even though its practice scene presents a real authored question.
 *
 * The fixture below is the persisted scene_data of a real production job
 * (Welding Foundations, "Equipment Setup and Machine Settings"), with
 * narration trimmed for readability. Durations mirror the timeline's own
 * start/end times; the render worker additionally re-synchronizes scene
 * durations from narration before review.
 */
const WELDING_SCENE_DATA = {
  "visual_prompt": "Create a bright Elevate for Humanity instructional scene for \u201cEquipment Setup and Machine Settings\u201d in Processes, Equipment, and Technique. Show an adult learner actively demonstrating: Distinguish constant-current from constant-voltage power sources and match each to its processes Include visible work evidence, accessible captions, warm brand colors, and a clear successful outcome.",
  "scenes": [
    {
      "id": "welding-04-scene-1",
      "purpose": "introduction",
      "visualType": "instructor",
      "narration": "Equipment Setup and Machine Settings. In this lesson you will Distinguish constant-current from constant-voltage power sources and match each to its processes",
      "visualDirection": "Elevate instructor introduces Equipment Setup and Machine Settings beside a labeled lesson roadmap.",
      "onScreenText": [
        "Equipment Setup and Machine Settings",
        "Distinguish constant-current from constant-voltage power sources and"
      ],
      "sourceReferences": [
        "Authored lesson objective: Distinguish constant-current from constant-voltage power sources and match each to its processes"
      ],
      "startTime": 0,
      "endTime": 60
    },
    {
      "id": "welding-04-scene-2",
      "purpose": "explanation",
      "visualType": "animated-text",
      "narration": "Two kinds of power source. Welding power sources hold one of two outputs steady. A constant-current (CC) machine holds amperage nearly fixed while voltage varies with arc length; it serves SMAW and GTAW, where the welder controls the arc by",
      "visualDirection": "Readable teaching slide explaining Two kinds of power source with three concise evidence-based points.",
      "onScreenText": [
        "Two kinds of power source",
        "Distinguish constant-current from constant-voltage power sources and",
        "DCEP, DCEN, and AC polarity and where"
      ],
      "sourceReferences": [
        "Authored section: Two kinds of power source"
      ],
      "startTime": 60,
      "endTime": 120
    },
    {
      "id": "welding-04-scene-3",
      "purpose": "diagram",
      "visualType": "technical-diagram",
      "narration": "Polarity: where the heat goes. Direct current can run in two directions, and the direction decides how arc heat divides between electrode and work. In DC electrode positive (DCEP, historically 'reverse polarity'), the electrode is the posit",
      "visualDirection": "Labeled technical diagram showing the sequence, decision points, and evidence for Polarity: where the heat goes.",
      "onScreenText": [
        "Polarity: where the heat goes",
        "Correct sequence",
        "Evidence to check"
      ],
      "sourceReferences": [
        "Authored section: Polarity: where the heat goes"
      ],
      "startTime": 120,
      "endTime": 180
    },
    {
      "id": "welding-04-scene-4",
      "purpose": "demonstration",
      "visualType": "equipment-image",
      "narration": "Worked example. Apply this objective: Distinguish constant-current from constant-voltage power sources and match each to its processes. Each process exposes a small set of variables that together decide the bead. In GMAW, voltage sets arc l",
      "visualDirection": "Side-by-side correct and incorrect worked examples for Equipment Setup and Machine Settings, with labels identifying the observable difference.",
      "onScreenText": [
        "Worked example",
        "Correct",
        "Needs correction"
      ],
      "sourceReferences": [
        "Authored section: Setting the working variables"
      ],
      "startTime": 180,
      "endTime": 240
    },
    {
      "id": "welding-04-scene-5",
      "purpose": "practice",
      "visualType": "screen-demonstration",
      "narration": "Now practice: Explain DCEP, DCEN, and AC polarity and where each is used. Use the lesson evidence before choosing your response.",
      "visualDirection": "Guided practice slide presenting a realistic Equipment Setup and Machine Settings decision and visible evidence for the learner to inspect.",
      "onScreenText": [
        "Your turn",
        "Which pairing of power source and process is correct?"
      ],
      "sourceReferences": [
        "Authored assessment: Which pairing of power source and process is correct?"
      ],
      "startTime": 240,
      "endTime": 300
    },
    {
      "id": "welding-04-scene-6",
      "purpose": "summary",
      "visualType": "animated-text",
      "narration": "Review the key lesson outcomes: Distinguish constant-current from constant-voltage power sources and match each to its processes Explain DCEP, DCEN, and AC polarity and where each is used Set voltage, wire feed speed, amperage, and gas flow",
      "visualDirection": "Accessible recap slide with the three lesson outcomes and the completed-work evidence learners should retain.",
      "onScreenText": [
        "Lesson recap",
        "Distinguish constant-current from constant-voltage power sources and",
        "DCEP, DCEN, and AC polarity and where",
        "Set voltage, wire feed speed, amperage, and"
      ],
      "sourceReferences": [
        "Authored section: Two kinds of power source",
        "Authored section: Polarity: where the heat goes",
        "Authored section: Setting the working variables"
      ],
      "startTime": 300,
      "endTime": 360
    }
  ]
};

function withTimelineDurations(sceneData: Record<string, unknown>) {
  const scenes = (sceneData.scenes as Array<Record<string, unknown>>).map((scene) => ({
    ...scene,
    duration_seconds: Number(scene.endTime) - Number(scene.startTime),
  }));
  return { ...sceneData, scenes };
}

describe('compiled lesson storyboards (authored purpose vocabulary)', () => {
  it('translates the authored practice scene into the knowledge check', () => {
    const storyboard = directMedia({
      title: 'Equipment Setup and Machine Settings',
      objective: 'Distinguish constant-current from constant-voltage power sources',
      script: 'Equipment Setup and Machine Settings.',
      sceneData: withTimelineDurations(WELDING_SCENE_DATA),
    });

    expect(storyboard.scenes.map((scene) => scene.sceneType)).toEqual([
      'problem_hook',
      'mental_model',
      'system_diagram',
      'worked_example',
      'knowledge_check',
      'memory_recap',
    ]);
    const check = storyboard.scenes.find((scene) => scene.sceneType === 'knowledge_check');
    expect(check?.id).toBe('welding-04-scene-5');
  });

  it('passes controlled review for a real compiled lesson storyboard', () => {
    const storyboard = directMedia({
      title: 'Equipment Setup and Machine Settings',
      objective: 'Distinguish constant-current from constant-voltage power sources',
      script: 'Equipment Setup and Machine Settings.',
      sceneData: withTimelineDurations(WELDING_SCENE_DATA),
    });

    const reviews = reviewControlledStoryboard(storyboard);
    expect(reviews.every((review) => review.passed)).toBe(true);
    const approved = approveControlledStoryboard(storyboard);
    expect(approved.storyboard.scenes.every((scene) => scene.reviewStatus === 'approved')).toBe(
      true,
    );
  });

  it('keeps an explicit scene_type authoritative over the authored purpose', () => {
    const storyboard = directMedia({
      title: 'Safety first',
      script: 'Safety.',
      sceneData: {
        scenes: [
          {
            id: 's1',
            purpose: 'practice',
            scene_type: 'safety_warning',
            narration: 'Stop and check the guard before striking an arc.',
            action: 'Show the guard check',
            duration_seconds: 30,
          },
        ],
      },
    });
    expect(storyboard.scenes[0]?.sceneType).toBe('safety_warning');
  });
});

describe('positional scene-type fallback (no authored type or purpose)', () => {
  const bareScenes = (count: number) =>
    [...Array(count)].map((_, index) => ({
      id: `bare-${index + 1}`,
      action: `Demonstrate step ${index + 1}`,
      dialogue: `Narration for step ${index + 1}.`,
      required_visual_evidence: `Visible evidence ${index + 1}`,
      duration_seconds: 40,
      media_source: index % 2 === 0 ? 'elevate-motion' : 'pexels',
    }));

  it.each([6, 7, 8, 10])(
    'gives a %i-scene board a knowledge check and a memory recap',
    (count) => {
      const storyboard = directMedia({
        title: 'Bare board',
        objective: 'Cover the fallback arc',
        script: 'Fallback.',
        sceneData: { scenes: bareScenes(count) },
      });
      const types = storyboard.scenes.map((scene) => scene.sceneType);
      expect(types).toContain('knowledge_check');
      expect(types.at(-1)).toBe('memory_recap');
      expect(types.at(-2)).toBe('knowledge_check');
      expect(() => approveControlledStoryboard(storyboard)).not.toThrow();
    },
  );
});
