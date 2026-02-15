import { logger } from '@/lib/logger';
/**
 * Salesforce API Integration
 */

interface ContactData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface OpportunityData {
  name: string;
  closeDate: string;
  stageName: string;
  amount: number;
}

interface AccountData {
  name: string;
  industry?: string;
  phone?: string;
  website?: string;
  numberOfEmployees?: number;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
}

interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone?: string;
  status?: string;
  leadSource?: string;
  industry?: string;
  title?: string;
}

/**
 * Get Salesforce access token (they can generate this themselves in Salesforce UI)
 * No IT team needed - they just:
 * 1. Go to Setup > Apps > App Manager
 * 2. Create Connected App
 * 3. Copy credentials
 * 4. Paste into your settings
 */
async function getSalesforceAuth() {
  const apiKey = process.env.SALESFORCE_API_KEY;
  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;

  if (!apiKey || !instanceUrl) {
    return null;
  }

  return { apiKey, instanceUrl };
}

/**
 * Create or update a contact in Salesforce
 */
export async function createOrUpdateContact(
  data: ContactData
): Promise<string | null> {
  const auth = await getSalesforceAuth();
  if (!auth) return null;

  const { apiKey, instanceUrl } = auth;

  try {
    // Check if contact exists
    const searchResponse = await fetch(
      `${instanceUrl}/services/data/v58.0/query?q=SELECT+Id+FROM+Contact+WHERE+Email='${encodeURIComponent(data.email)}'`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      logger.error('Salesforce search error:', searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();

    if (searchData.records && searchData.records.length > 0) {
      // Update existing contact
      const contactId = searchData.records[0].Id;
      const updateResponse = await fetch(
        `${instanceUrl}/services/data/v58.0/sobjects/Contact/${contactId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            FirstName: data.firstName,
            LastName: data.lastName,
            Phone: data.phone,
          }),
        }
      );

      if (!updateResponse.ok) {
        logger.error('Salesforce update error:', updateResponse.status);
        return null;
      }

      return contactId;
    } else {
      // Create new contact
      const createResponse = await fetch(
        `${instanceUrl}/services/data/v58.0/sobjects/Contact`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            FirstName: data.firstName,
            LastName: data.lastName,
            Email: data.email,
            Phone: data.phone,
          }),
        }
      );

      if (!createResponse.ok) {
        logger.error('Salesforce create error:', createResponse.status);
        return null;
      }

      const createData = await createResponse.json();
      return createData.id;
    }
  } catch (error) { /* Error handled silently */ 
    logger.error('Error with Salesforce contact:', error);
    return null;
  }
}

/**
 * Create an opportunity in Salesforce
 */
export async function createOpportunity(
  data: OpportunityData
): Promise<string | null> {
  const apiKey = process.env.SALESFORCE_API_KEY;
  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;

  if (!apiKey || !instanceUrl) {
    return null;
  }

  try {
    const response = await fetch(
      `${instanceUrl}/services/data/v58.0/sobjects/Opportunity`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Name: data.name,
          CloseDate: data.closeDate,
          StageName: data.stageName,
          Amount: data.amount,
        }),
      }
    );

    if (!response.ok) {
      logger.error('Salesforce opportunity create error:', response.status);
      return null;
    }

    const responseData = await response.json();
    return responseData.id;
  } catch (error) { /* Error handled silently */ 
    logger.error('Error creating Salesforce opportunity:', error);
    return null;
  }
}

/**
 * Create or update an Account in Salesforce
 * Self-service: Client sets up in 5 minutes, no IT team needed
 */
export async function createOrUpdateAccount(
  data: AccountData
): Promise<string | null> {
  const auth = await getSalesforceAuth();
  if (!auth) return null;

  const { apiKey, instanceUrl } = auth;

  try {
    // Check if account exists
    const searchResponse = await fetch(
      `${instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(
        `SELECT Id FROM Account WHERE Name = '${data.name.replace(/'/g, "\\'")}'`
      )}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      return null;
    }

    const searchResult = await searchResponse.json();

    if (searchResult.records && searchResult.records.length > 0) {
      // Update existing
      const accountId = searchResult.records[0].Id;
      
      await fetch(
        `${instanceUrl}/services/data/v57.0/sobjects/Account/${accountId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Name: data.name,
            Industry: data.industry,
            Phone: data.phone,
            Website: data.website,
            NumberOfEmployees: data.numberOfEmployees,
            BillingStreet: data.billingStreet,
            BillingCity: data.billingCity,
            BillingState: data.billingState,
            BillingPostalCode: data.billingPostalCode,
            BillingCountry: data.billingCountry,
          }),
        }
      );

      return accountId;
    } else {
      // Create new
      const createResponse = await fetch(
        `${instanceUrl}/services/data/v57.0/sobjects/Account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Name: data.name,
            Industry: data.industry,
            Phone: data.phone,
            Website: data.website,
            NumberOfEmployees: data.numberOfEmployees,
            BillingStreet: data.billingStreet,
            BillingCity: data.billingCity,
            BillingState: data.billingState,
            BillingPostalCode: data.billingPostalCode,
            BillingCountry: data.billingCountry,
          }),
        }
      );

      const result = await createResponse.json();
      return result.id;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Create a Lead in Salesforce
 * Self-service: No IT team required
 */
export async function createLead(
  data: LeadData
): Promise<string | null> {
  const auth = await getSalesforceAuth();
  if (!auth) return null;

  const { apiKey, instanceUrl } = auth;

  try {
    const response = await fetch(
      `${instanceUrl}/services/data/v57.0/sobjects/Lead`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FirstName: data.firstName,
          LastName: data.lastName,
          Email: data.email,
          Company: data.company,
          Phone: data.phone,
          Status: data.status || 'Open - Not Contacted',
          LeadSource: data.leadSource || 'Web',
          Industry: data.industry,
          Title: data.title,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    return null;
  }
}
