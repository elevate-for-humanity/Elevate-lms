# Supported media and reporting adapters

Built on the library audit integrated through PR #2479. This follow-up implements concrete capabilities rather than substituting success for unavailable work.

- Native image crop, upscale, grayscale/sharpen/blur and WebP/JPEG/PNG optimization transform actual bytes using the existing Sharp dependency. Input origins are restricted, redirects are rejected, and byte/pixel limits are enforced.
- Generative edits (including transparent background removal) and alt-text descriptions pass normalized source pixels to the OpenAI SDK. The existing paid-dispatch authorization remains mandatory. Empty, unchanged and opaque background-removal outputs are rejected.
- `POST /api/admin/media-studio/image/transform` authenticates Admin, resolves the content organization, runs the operation and saves transformed images through the canonical asset pipeline before returning success. Paid calls require `MEDIA_EDIT_MAX_COST_MICROS` or `MEDIA_VISION_MAX_COST_MICROS`, budget authorization and a durable dispatch receipt. These are spending caps, not represented provider prices. Native transformations do not require paid inference.
- Pixabay searches use its documented API with actual attribution and a bounded 24-hour metadata cache. `PIXABAY_API_KEY` is required; no value is invented. Results are temporary previews and must be stored durably before publication.
- Blueprint notifications are written for actual active administrator recipients and require confirmed database IDs. External blueprint currency is still not asserted without a verified provider source.
- RAPIDS preparation reads saved apprentice identity, the registered runtime contract and canonical approved OJL/RTI hours. Missing personal/wage data or records fail explicitly. Competency-based completion retains a null fixed-hour denominator. Reports use exact database counts and confirmed submission dates.

## Verification

56 focused behavior tests passed, including native image decoding/dimensions, provider pixel inputs, denied paid requests, failed storage, database failures, actual notification receipts and RAPIDS counts. Scoped PARIS and transform-route TypeScript checks passed. Scoped source lint passed. No new dependencies, schema changes, external submissions or paid live image operations were performed.

## Remaining external dependencies

Direct RAPIDS/DWD submissions and agency progress/completion/cancellation updates require genuine agency access, supported interface specifications and the existing submission authorization. Secret metadata inspection found sponsor/program metadata, but no agency submission credentials. The established RAPIDS CSV export remains available for reviewed manual submission. No unverified guessed endpoint or locally generated agency receipt was introduced.

Live validation of paid image editing/vision, Pixabay and external blueprint monitoring still requires their applicable configuration, approval and real provider execution. Unit tests establish adapter behavior, not a claim that these external accounts are active.
