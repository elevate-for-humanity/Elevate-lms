# Elevate for Humanity LMS — LTI Readiness

## Current production status

Direct LTI 1.3 is **not production-active**. The database contains an
`lti_platforms` registration foundation and the application exposes partner
integration administration, but the LMS does not currently ship the Core OIDC
login, launch, or tool-key endpoints previously described by this file.

Do not provide `/api/lti/config`, `/api/lti/login`, `/api/lti/launch`, or
`/api/lti/jwks` to a partner until those routes exist and pass an external LMS
launch test.

## Required production implementation

1. LTI 1.3 Core OIDC login initiation and signed launch validation.
2. Durable state, nonce, replay protection, issuer, audience, deployment, and
   target-link validation.
3. Tool key generation, rotation, JWKS publication, and secret management.
4. Platform registration for issuer, client ID, deployment ID, authorization
   URL, token URL, and JWKS URL.
5. Names and Roles Provisioning Service with scoped roster reconciliation.
6. Assignment and Grade Services with idempotent line-item and score return.
7. Deep Linking when partner-authored placement is required.
8. Learner, course, section, and enrollment identity mapping without creating
   a second Elevate source of truth.
9. Admin audit logs, connection health, retry queues, and bounded sync tests.
10. Canvas or another supported external LMS certification evidence.

## Interim integration strategy

Use Edlink as the preferred institutional integration gateway when contracted
and configured. Elevate remains authoritative for curriculum, learner progress,
workforce compliance, practical evidence, and credentials. Edlink or a future
certified direct-LTI adapter owns external identity, roster, course-section, and
grade transport.
