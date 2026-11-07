import { logger } from '@/lib/logger';
import { getSecrets } from '@/lib/secrets';
import { SalesforceClient, SalesforceError } from './salesforce-client';
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


export async function getSalesforceClient() {
  const config = await getSecrets(['SALESFORCE_INSTANCE_URL', 'SALESFORCE_API_KEY', 'SALESFORCE_CLIENT_ID', 'SALESFORCE_CLIENT_SECRET']);
  return new SalesforceClient({ instanceUrl: config.SALESFORCE_INSTANCE_URL, apiKey: config.SALESFORCE_API_KEY,
    clientId: config.SALESFORCE_CLIENT_ID, clientSecret: config.SALESFORCE_CLIENT_SECRET });
}
async function confirmedWrite(operation: (client: SalesforceClient) => Promise<string>): Promise<string | null> {
  try { return await operation(await getSalesforceClient()); }
  catch (error) {
    logger.error('Salesforce write was not verified', { code: error instanceof SalesforceError ? error.code : 'SALESFORCE_UNAVAILABLE' });
    return null;
  }
}
export async function createOrUpdateContact(data: ContactData): Promise<string | null> {
  return confirmedWrite(client => client.write('Contact', { FirstName: data.firstName, LastName: data.lastName,
    Email: data.email, Phone: data.phone }, { field: 'Email', value: data.email }));
}
export async function createOpportunity(data: OpportunityData): Promise<string | null> {
  return confirmedWrite(client => client.write('Opportunity', { Name: data.name, CloseDate: data.closeDate, StageName: data.stageName, Amount: data.amount }));
}
export async function createOrUpdateAccount(data: AccountData): Promise<string | null> {
  return confirmedWrite(client => client.write('Account', { Name: data.name, Industry: data.industry, Phone: data.phone,
    Website: data.website, NumberOfEmployees: data.numberOfEmployees, BillingStreet: data.billingStreet,
    BillingCity: data.billingCity, BillingState: data.billingState, BillingPostalCode: data.billingPostalCode,
    BillingCountry: data.billingCountry }, { field: 'Name', value: data.name }));
}
export async function createLead(data: LeadData): Promise<string | null> {
  return confirmedWrite(client => client.write('Lead', { FirstName: data.firstName, LastName: data.lastName,
    Email: data.email, Company: data.company, Phone: data.phone, Status: data.status, LeadSource: data.leadSource,
    Industry: data.industry, Title: data.title }));
}
