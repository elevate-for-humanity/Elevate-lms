# Elevate for Humanity LMS - Technical Information

## Overview
Elevate for Humanity LMS is a comprehensive workforce and apprenticeship training platform built on Next.js with Supabase.

## LTI Compliance

### ✅ LTI 1.3 Support (Fully Implemented)

The LMS supports **LTI 1.3** (IMS Global Learning Tools Interoperability) with the following features:

#### Endpoints
| Endpoint | Purpose |
|----------|---------|
| `/api/lti/config` | OIDC Discovery - returns LTI tool configuration |
| `/api/lti/jwks` | JWKS endpoint for JWT signature verification |
| `/api/lti/login` | OIDC login initiation |
| `/api/lti/launch` | LTI launch endpoint |

#### Supported Scopes
- `openid` - Basic OIDC authentication
- `https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly` - Names and Roles Provisioning Service

#### Canvas Integration
Pre-configured for Canvas LMS with:
- Course navigation placement
- LtiResourceLinkRequest message type
- Automatic user provisioning

## Database Schema

### Core Tables
- `lti_platforms` - Stores external LMS platform configurations
  - `auth_login_url` - Platform OIDC authorization endpoint
  - `jwks_uri` - Platform JWKS endpoint for JWT verification

### LMS Tables
- `lms_courses` - Course definitions
- `lms_lessons` - Individual lessons within courses
- `lms_enrollments` - User enrollments

## Technical Stack
- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + LTI 1.3
- **Payments**: Stripe

## Integration Flow

### LTI 1.3 Launch Flow
1. External LMS (Canvas) initiates OIDC login
2. Elevate LMS returns authentication request
3. User authenticates via external LMS
4. Launch request sent with JWT
5. Elevate LMS verifies JWT signature using platform's JWKS
6. User is provisioned/authenticated and redirected to course

## Security
- JWT signature verification via JWKS
- Rate limiting on all API endpoints
- API audit logging
- Role-based access control

## Configuration Required on External LMS

To connect an external LMS (Canvas, Blackboard, Moodle, etc.):

1. **Tool URL**: `https://www.elevateforhumanity.org` (or production URL)
2. **Initiate Login URI**: `https://www.elevateforhumanity.org/api/lti/login`
3. **Redirect URI**: `https://www.elevateforhumanity.org/api/lti/launch`
4. **JWKS URI**: `https://www.elevateforhumanity.org/api/lti/jwks`

## Programs Available
- Barber Apprenticeship
- Cosmetology Apprenticeship
- Esthetics Apprenticeship
- Nail Technician Apprenticeship
- HVAC Training
- Career Courses

## Contact
For technical integration support, contact the Elevate for Humanity development team.
