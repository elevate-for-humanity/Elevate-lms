/**
 * lib/lms/simulations/ai-engineering-simulation.ts
 *
 * AI Workflow Lab — the hands-on scenario simulation for the AI
 * Engineering course, built on the generic scenario engine
 * (lib/lms/scenario-simulation.ts) to the manifold gauge / forklift lab
 * contract. It attaches to the capstone lesson and runs the workflow
 * decisions the course teaches: the narrow-AI boundary, structured
 * prompting, the iteration loop measured on a fixed test set, outside
 * verification of output, the never-paste list, and API key handling.
 * Content is drawn from the course's own lessons (ai-eng-01, -03, -04,
 * -06, -08, -09).
 *
 * The hard fail is the data lesson's bright line: credentials, keys,
 * government identifiers, health records, and other people's private
 * records are never pasted into a model — the breach happens the moment
 * the text is handed over.
 */
import {
  SCENARIO_SIMULATOR_KEY,
  type ScenarioSimulationConfig,
} from '@/lib/lms/scenario-simulation';

export const AI_ENGINEERING_WORKFLOW_SIM_ID = 'ai-engineering-workflow-lab';

export const AI_ENGINEERING_WORKFLOW_SIMULATION: ScenarioSimulationConfig = {
  simulator: SCENARIO_SIMULATOR_KEY,
  simId: AI_ENGINEERING_WORKFLOW_SIM_ID,
  title: 'AI Workflow Lab — Brief It, Test It, Verify It, Ship It Safely',
  description:
    'Build one small workplace AI workflow the way the course teaches: respect what the system is, brief it with structure, iterate against a fixed test set, verify output from outside the model, keep forbidden data out, and handle the API key like the credential it is. The lab is scored against the course lessons.',
  setting:
    'Your capstone job: a workflow that drafts replies to common customer emails for a small business, with a person approving every send.',
  badges: ['Prompt structure', 'Test-set iteration', 'Data rules', 'API safety'],
  objectives: [
    'Narrow-AI judgment',
    'Structured prompting',
    'Test-set iteration',
    'Output verification',
    'Data protection',
    'API key handling',
  ],
  instructions: [
    'One choice in this lab scores 0 outright: pasting credentials, identifiers, health records, or another person\'s private records into a model to "get help with them." The data lesson\'s list is short enough to memorize — and the breach happens the moment the text is handed over.',
    'The model cannot tell you how sure it is; its confidence is a style, not a measurement. Verification always comes from outside the model.',
  ],
  steps: [
    {
      kind: 'decide',
      id: 'narrow-ai',
      title: 'Know the material',
      prompt:
        'A manager suggests pointing the shop\'s demand-forecasting tool at drafting a sensitive HR letter, "since it\'s all AI anyway." What does the first lesson say?',
      objective: 'Narrow-AI judgment',
      options: [
        'Every workplace AI system is narrow: it performs the task it was built and trained for and does not understand the world outside it. Use the right system for the letter, with human oversight matched to its limits',
        'Agree — a strong model is a strong model, whatever the task',
        'Agree, but only if the forecast tool\'s past outputs looked well written',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'decide',
      id: 'structured-prompt',
      title: 'Brief the model',
      prompt:
        'Version one of the workflow\'s prompt reads: "Write something back to this customer." Replies come back vague and off-tone. What is the course\'s fix?',
      objective: 'Structured prompting',
      options: [
        'Rebuild it as a structured brief: the role, the task, the background the model cannot know, the limits, and exactly what the finished reply should look like — the model can only work with what is in the context',
        'Add "please be professional and thorough" — stronger adjectives steer the model',
        'Switch models; prompt wording does not change output quality',
      ],
      correct: 0,
      points: 10,
    },
    {
      kind: 'calculate',
      id: 'test-set-math',
      title: 'Read the test set',
      prompt:
        'Your fixed test set has 10 real inputs. The current prompt passes 7. You change one thing: the change fixes 2 of the 3 failures — but breaks 3 inputs that were passing. How many inputs does the changed prompt now pass?',
      objective: 'Test-set iteration',
      answer: 6,
      unit: 'inputs',
      tolerancePct: 1,
      points: 12,
      explanation:
        '7 passing + 2 fixed − 3 broken = 6 passing. The change is a regression, not an improvement — which is exactly why the iteration lesson insists on a fixed test set: without one, the two fixes feel like progress and the three silent breakages ship.',
    },
    {
      kind: 'decide',
      id: 'verify-output',
      title: 'Verify from outside',
      prompt:
        'A draft reply quotes a delivery date and a refund figure. The model adds, "I\'m confident these are correct." What does the evaluation lesson require before a person approves the send?',
      objective: 'Output verification',
      options: [
        'Check the claims against a source outside the model — the order record and the refund policy — because the model\'s confidence is a style, not a measurement; effort matches the stakes',
        'Send it — the model confirmed its own confidence when asked',
        'Ask the model a second time and send if it repeats the same figures',
      ],
      correct: 0,
      points: 12,
    },
    {
      kind: 'decide',
      id: 'never-paste',
      title: 'The helpful paste',
      prompt:
        'To debug a login problem in the workflow, a teammate suggests pasting the client\'s case file — including her full account number and the API key from the error log — into a public chatbot and asking it what went wrong. What do you do?',
      objective: 'Data protection',
      options: [
        'Stop it: credentials and keys, government identifiers, full financial account numbers, health records, and other people\'s private records are never pasted into a model. Minimize and de-identify what is sent, and use approved channels',
        'Allow it once — the chatbot is a well-known service and the debugging is urgent',
        'Allow the case file but remove just the client\'s name; the numbers are the part the model needs',
      ],
      correct: 0,
      hardFailOptions: [1, 2],
      hardFailMessage:
        'Every AI interaction is a data decision: pasting text hands it to a system — possibly a third-party service — with its own storage, logging, and terms. The never-paste list exists because the breach happens the moment the text is handed over, not when someone misuses it later: credentials and keys of any kind, government identifiers and full financial account numbers, health records, and other people\'s private records. Removing a name while keeping the account number is not de-identification. This attempt cannot pass.',
      points: 12,
    },
    {
      kind: 'decide',
      id: 'api-key',
      title: 'Handle the key',
      prompt:
        'The workflow graduates to the API. Where does the API key live, and how is the model\'s answer used?',
      objective: 'API key handling',
      options: [
        'The key stays in the server-side configuration, never in shared documents or client code; requests carry the key with the messages and parameters, and returned text is validated — including structured output against its expected shape — before the workflow acts on it',
        'Paste the key into the team\'s shared setup doc so everyone can run the script',
        'Trust the returned text as-is; the API is the reliable version of the model',
      ],
      correct: 0,
      points: 10,
    },
  ],
  syllabusTopics: [
    {
      topic: 'What AI is — and what it is not (ai-eng-01)',
      coverage: 'applied',
      note: 'The opening step scores the narrow-AI boundary the course opens with.',
    },
    {
      topic: 'Prompt engineering: structure, context, and examples (ai-eng-03)',
      coverage: 'full',
      note: 'The briefing step requires the structured prompt the lesson teaches — role, task, background, limits, output shape.',
    },
    {
      topic: 'Prompt engineering: iteration and failure modes (ai-eng-04)',
      coverage: 'full',
      note: 'The test-set step is computed from the lesson\'s own regression example pattern: fixes minus breakages on a fixed set.',
    },
    {
      topic: 'Evaluating AI output and catching hallucinations (ai-eng-09)',
      coverage: 'full',
      note: 'The verification step scores outside-the-model checking and the confidence-is-style rule.',
    },
    {
      topic: 'Data for AI: quality, privacy, and what never to paste (ai-eng-08)',
      coverage: 'full',
      note: 'The never-paste step hard-fails exactly the list the lesson gives.',
    },
    {
      topic: 'Building with AI APIs: requests, keys, and structured output (ai-eng-06)',
      coverage: 'applied',
      note: 'The closing step scores key custody and validation of returned output.',
    },
    {
      topic: 'Capstone: build and document a small AI workflow (ai-eng-12)',
      coverage: 'embedded',
      note: 'The lab is attached to the capstone lesson and rehearses its workflow end to end.',
    },
  ],
};
