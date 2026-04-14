// PUBLIC ROUTE: partner lead capture form

// AUTH: Intentionally public — no authentication required

// app/api/partners/lead/route.ts
import { NextResponse } from 'next/server';
import { createOrUpdateContact, createOpportunity, createOrUpdateAccount, createLead } from '@/lib/integrations/salesforce';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const maxDuration = 60;

async function _POST(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;
const { name, email, phone, company, programInterest } = await request.json();

  if (!name || !email) {
    return NextResponse.json(
      { error: 'name and email are required' },
      { status: 400 }
    );
  }

  const [firstName, ...rest] = name.split(' ');
  const lastName = rest.join(' ') || 'Partner';

  // Create Account if company provided
  let accountId = null;
  if (company) {
    accountId = await createOrUpdateAccount({
      name: company,
      phone,
    });
  }

  // Create Lead (potential customer)
  const leadId = await createLead({
    firstName,
    lastName,
    email,
    company: company || 'Unknown',
    phone,
    leadSource: 'Web',
    status: 'Open - Not Contacted',
  });

  // Create Contact
  const contactId = await createOrUpdateContact({
    email,
    firstName,
    lastName,
    phone,
  });

  // Create Opportunity
  const oppName = `Elevate LMS - ${company || email}`;
  const closeDate = new Date();
  closeDate.setDate(closeDate.getDate() + 30);

  const opportunityId = await createOpportunity({
    name: oppName,
    closeDate: closeDate.toISOString().slice(0, 10),
    stageName: 'Qualification',
    amount: 5000,
  });

  return NextResponse.json({ 
    ok: true, 
    accountId,
    leadId,
    contactId,
    opportunityId
  });
}
export const POST = withApiAudit('/api/partners/lead', _POST);
