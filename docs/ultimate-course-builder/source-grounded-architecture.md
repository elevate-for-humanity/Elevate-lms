# Source-grounded instructional production

The Google authoring path is an explicit configuration on a new build profile:
`instructionalAuthoring: {provider: "google", model: "<verified-model-id>", version: "source-grounded-teaching-1"}`.
The `queue-course` API accepts the provider and model. It refuses to change these
inputs on an active build. Existing production builds retain their locked inputs.

## Instruction authority

Supabase competency IDs and authorized sources remain the authority. A registered
standard is not required for a lesson to have a practical teaching modality.
Source transport uses one JSON envelope for both structured and plain-text lessons.
The author receives only sources mapped to the selected competency.

Google authoring creates one blueprint for all thirteen teaching stages. Each spoken
segment has an exact source citation. A separate review checks topic relevance,
accuracy, demonstration specificity, practice progression and assessment alignment.
The source hash and reviewed blueprint hash persist with the artifact. Changes
invalidate authoring evidence. No generic fallback is used if Google authoring fails.

Objectives, narration, storyboard, activities and assessments derive from that
blueprint. Authoring does not approve licenses, finished videos, learner mastery,
publication or credentials. The existing twenty-stage production engine, Supabase
lease and generation fencing, immutable media artifacts, OCR thresholds and learner
runthrough remain required.

## Delivery

The render contract accepts HTTPS playback endpoints as well as asset URLs. Delivery
references are resolved consistently by QA and release. They do not certify media.
Managed lesson media uses `/api/courses/:courseId/lessons/:lessonId/playback`.
The route checks authenticated lesson access or the existing signed administrator
preview, course association and publication before issuing a short-lived storage
URL. Object references come only from the saved lesson. Arbitrary redirect targets
and encoded traversal are rejected. External player integrations remain unchanged.

The route does not privatize existing public storage objects. That requires a
separate, tested per-object migration and playback verification; changing a shared
bucket's visibility is not part of this release.

## Activation and acceptance

Vertex authoring uses the Cloud Run service identity in `elegant-racer-299721`.
Before activation, verify the selected model's regional availability, enabled API,
runtime identity permission and quota. Do not copy production credentials into
profiles or artifacts. No IAM grant or API enablement is performed by this change.

Run a separate draft acceptance build with an authoritative, fully sourced lesson.
Do not change active Barber/Cosmetology inputs or regenerate successful artifacts.
Acceptance requires actual rendered media QA, desktop/mobile learner playback,
captions, assessment scoring and saved progress. A model response, fixture test,
successful container build or job dispatch does not establish production success.

Google Workflows remains a possible execution coordinator, not a provisioned part
of this change. The existing finite Cloud Run job and fenced checkpoint runner
remain the production execution authority.
