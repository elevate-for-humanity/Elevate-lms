import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const LETTER_OF_SUPPORT_TEMPLATE = `
{{date}}

{{funder_name}}
{{funder_address}}

Re: Letter of Support for {{program_name}}

To Whom It May Concern,

On behalf of {{partner_name}}, I am writing to express our strong support for ${PLATFORM_DEFAULTS.orgName}'s {{program_name}} initiative in {{city}}, {{state}}.

${PLATFORM_DEFAULTS.orgName} has demonstrated a clear commitment to providing high-quality, workforce-aligned training in partnership with employers, community organizations, and public agencies. Through this collaboration, participants will gain the technical skills, professional behaviors, and wraparound supports needed to enter and advance in careers in {{sector_description}}.

Our organization intends to support this effort by:
- Referring eligible participants to the program, and
- Collaborating on work-based learning, job placement, and ongoing support services.

We believe this initiative is well aligned with the goals of {{funder_name}} to expand access to equitable training and employment opportunities—especially for individuals facing barriers to work. We strongly support Elevate for Humanity's application and look forward to partnering to deliver measurable outcomes for our community.

If you need additional information, please feel free to contact us at {{partner_contact_info}}.

Sincerely,

{{partner_signer_name}}
{{partner_signer_title}}
{{partner_name}}
`;
