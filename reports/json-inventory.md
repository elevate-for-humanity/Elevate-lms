# JSON File Inventory

Generated: 2026-02-01

## Summary

Found **55 JSON files** in the repository (excluding node_modules, .git, .pnpm-store).

---

## Configuration Files

### `/config/programs.json` ⭐ AUTHORITATIVE CANDIDATE
**Purpose**: Program catalog definition
**Schema**:
```json
{
  "slug": "string",
  "name": "string",
  "shortTagline": "string",
  "heroImage": "string",
  "level": "string",
  "duration": "string",
  "format": "string",
  "schedule": "string",
  "tuitionNotes": "string",
  "fundingOptions": ["string"],
  "whoItIsFor": ["string"],
  "outcomes": ["string"],
  "highlights": ["string"],
  "ctaPrimary": { "label": "string", "href": "string" },
  "ctaSecondary": { "label": "string", "href": "string" }
}
```
**Programs Defined**: 6 (HVAC, Barber, CNA, Building Tech, CDL, Career Readiness)
**Notes**: Marketing-focused content, no database IDs or compliance data

### `/config/branding.json`
**Purpose**: White-label branding configuration
**Schema**:
```json
{
  "appName": "string",
  "primaryColor": "string (hex)",
  "logoPath": "string"
}
```

### `/config/license.json`
**Purpose**: License holder identification
**Schema**:
```json
{
  "licenseHolder": "string",
  "licenseId": "string",
  "licenseType": "master|client",
  "issuedAt": "date",
  "validDomains": ["string"],
  "status": "active|suspended"
}
```

### `/config/integrations.json`
**Purpose**: External service configuration
**Schema**:
```json
{
  "authProvider": "supabase|external",
  "apiProvider": "supabase|external",
  "externalApiBaseUrl": "string",
  "externalAuthIssuer": "string"
}
```

---

## Application Data Files

### `/app/data/partner-programs.json` ⭐ AUTHORITATIVE CANDIDATE
**Purpose**: Partner programs with funding and pricing
**Schema**:
```json
{
  "government_funded_programs": {
    "wioa": {
      "program_name": "string",
      "funding_source": "string",
      "cost_to_student": 0,
      "eligibility": "string",
      "programs": [{
        "program_id": "string",
        "name": "string",
        "cost": 0,
        "funding": "string",
        "duration": "string",
        "track": "string",
        "description": "string"
      }]
    }
  },
  "credentialing_partners": {
    "ahima": {
      "partner_name": "string",
      "programs": [{
        "program_id": "string",
        "name": "string",
        "partner_price": number,
        "student_price": number,
        "duration": "string",
        "level": "string",
        "certification_type": "string"
      }]
    }
  }
}
```
**Notes**: Contains WIOA programs, pricing, and credentialing partner details

### `/lms-content/curricula/program-curriculum-map.json` ⭐ AUTHORITATIVE CANDIDATE
**Purpose**: Curriculum and certification requirements per program
**Schema**:
```json
{
  "programs": [{
    "id": "string",
    "name": "string",
    "duration": "string",
    "certifications": [{
      "name": "string",
      "provider": "string",
      "delivery": "string",
      "hours": number
    }]
  }],
  "partnerLinks": {
    "provider": "url"
  }
}
```
**Programs Defined**: 8 (CDL, CNA, DSP, Drug Collector, Tax Prep, Cybersecurity, Customer Service, Barber)
**Notes**: Most detailed curriculum data with certification requirements

---

## Public API Files

### `/public/api/programs.json`
**Purpose**: Public API endpoint for program list
**Schema**: Simplified program list with status and enrollment info
**Notes**: Appears to be a static snapshot, may be stale

### `/public/api/partnerships.json`
**Purpose**: Partnership information
**Notes**: Static data for public consumption

### `/public/api/health.json`
**Purpose**: Health check endpoint
**Notes**: Static status file

### `/public/api/stats.json`
**Purpose**: Platform statistics
**Notes**: Static metrics

---

## PWA Manifests

### `/public/manifest.json`
**Purpose**: Default PWA manifest

### `/public/manifest-student.json`
**Purpose**: Student-specific PWA manifest

### `/public/manifest-instructor.json`
**Purpose**: Instructor-specific PWA manifest

### `/public/manifest-partner.json`
**Purpose**: Partner-specific PWA manifest

### `/public/manifest-admin.json`
**Purpose**: Admin-specific PWA manifest

### `/public/manifest-barber.json`
**Purpose**: Barber apprentice PWA manifest

### `/public/manifest-employer.json`
**Purpose**: Employer portal PWA manifest

### `/public/manifest-program-holder.json`
**Purpose**: Program holder PWA manifest

### `/public/manifest-shop-owner.json`
**Purpose**: Shop owner PWA manifest

---

## Script/Utility Files

### `/scripts/utilities/partner-programs-catalog.json`
**Purpose**: Duplicate of `/app/data/partner-programs.json`
**Notes**: Should be consolidated

### `/scripts/routes.json`
**Purpose**: Route definitions for scripts

### `/scripts/video-ids.json`
**Purpose**: Video asset IDs

### `/scripts/archetypes.routes.json`
**Purpose**: Archetype-based route generation

### `/scripts/cna-lesson-videos.json`
**Purpose**: CNA course video mappings

### `/scripts/elevate.config.json`
**Purpose**: Build/deployment configuration

---

## LMS Data Files

### `/lms-data/milady-rise-integration.json`
**Purpose**: Milady RISE integration configuration
**Notes**: External partner integration

---

## Internationalization

### `/i18n/messages/en.json`
**Purpose**: English translations

### `/i18n/messages/es.json`
**Purpose**: Spanish translations

### `/i18n/messages/fr.json`
**Purpose**: French translations

### `/lib/i18n/messages/*.json`
**Purpose**: Duplicate i18n files in lib
**Notes**: Should be consolidated with /i18n

---

## Report/Audit Files

### `/reports/media_report.json`
**Purpose**: Media audit results

### `/reports/lighthouse-header.json`
**Purpose**: Lighthouse performance data

### `/reports/link_report.json`
**Purpose**: Link validation results

---

## Other Files

### `/r2-url-mapping.json`
**Purpose**: Cloudflare R2 URL mappings

### `/branding/tokens.json`
**Purpose**: Design tokens

### `/lib/tax-software/config/2024.json`
**Purpose**: Tax software configuration

### `/public/supersonic-business-profile.json`
**Purpose**: Supersonic business data

### `/public/sister_sites_nav_config.json`
**Purpose**: Sister site navigation

### `/public/catalog/pages.json`
**Purpose**: Page catalog

### `/public/images/homepage/image-mapping.json`
**Purpose**: Homepage image mappings

### `/public/videos/demos/scripts.json`
**Purpose**: Demo video scripts

---

## Authoritative JSON Candidates

Based on analysis, the following files contain program/enrollment configuration data:

| File | Contains | Recommendation |
|------|----------|----------------|
| `/config/programs.json` | Marketing content, 6 programs | Use for UI display |
| `/app/data/partner-programs.json` | Funding, pricing, 12+ programs | Use for enrollment logic |
| `/lms-content/curricula/program-curriculum-map.json` | Certifications, hours, 8 programs | Use for curriculum/compliance |
| `/public/api/programs.json` | Static snapshot | Deprecate, use DB |

**Recommendation**: 
1. `/lms-content/curricula/program-curriculum-map.json` is the most authoritative for **curriculum and compliance**
2. `/app/data/partner-programs.json` is authoritative for **funding and pricing**
3. Database `programs` table should be the single source of truth, with JSON files as seed data

---

## Missing JSON Files

The following data is NOT in JSON and should be:

1. **State compliance rules** - Currently hardcoded in migrations
2. **Document requirements per program** - In database only
3. **Eligibility rules** - Scattered across code
4. **Hour requirements per program** - In database only

**Recommendation**: Create `/config/compliance-rules.json` to centralize state-specific requirements.
