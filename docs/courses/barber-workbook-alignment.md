# Barber workbook alignment

The canonical workbook has 50 sections; the existing course has 14 required competency lessons. Each workbook section now has its own matching, explicitly titled instructional resource and unique anchor within the appropriate lesson. This is 50 workbook sections to 50 teaching sections, not 50 separate required lessons.

The existing 18 primary lesson assignments are retained. The remaining 32 now have primary lesson assignments, original teaching, worked examples, three topic-specific prompts and a recap. Current official EPA, FDA and Indiana PLA references support the applicable safety and exam-preparation sections. Licensing fees, external exam scores and pathway eligibility are not inferred from workbook completion.

`data/curriculum/barber-workbook-alignment.json` is the reviewed content and crosswalk. `scripts/courses/align-barber-workbook.mjs` emits an idempotent transactional data update with preconditions and preservation assertions. It changes existing lesson resource lists and workbook links/prompts; it does not create lessons, award hours, alter grades, change core videos, weaken access rules or mark learners complete.

Run `node --test tests/unit/barber-workbook-alignment.node.test.mjs` before applying the generated SQL. Verify all 50 data links, learner access, and both directions of the live section links after the LMS release.
