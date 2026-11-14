import { describe, expect, it, vi } from 'vitest';
import { SalesforceClient, salesforceOrigin, salesforceLiteral } from '@/lib/integrations/salesforce-client';
const id = '003000000000001AAA';
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const fields = ['Name', 'FirstName', 'LastName', 'Email', 'Phone'].map(name => ({ name, createable: true, updateable: true }));
const schema = { createable: true, updateable: true, fields };
function client(responses: Response[], config = { instanceUrl: 'https://example.my.salesforce.com', apiKey: 'test-secret' }) {
  const http = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => responses.shift()!);
  return { sf: new SalesforceClient(config, http), http };
}
describe('Salesforce compatibility transport', () => {
  it.each(['http://example.my.salesforce.com', 'https://evil.test', 'https://example.my.salesforce.com.evil.test', 'https://user:secret@example.my.salesforce.com', 'https://example.my.salesforce.com/path', 'https://example.my.salesforce.com?token=secret'])('rejects unsafe instance %s before transmitting credentials', value => {
    expect(() => salesforceOrigin(value)).toThrow('SALESFORCE_INSTANCE_URL_INVALID');
  });
  it('escapes SOQL backslashes and quotes before encoding the entire query', async () => {
    const email = "o'neil\\@example.org";
    const { sf, http } = client([json([{ version: '60.0' }]), json(schema), json({ records: [{ Id: id }] }), new Response(null, { status: 204 }), json({ Id: id, Email: email })]);
    expect(await sf.write('Contact', { Email: email }, { field: 'Email', value: email })).toBe(id);
    const url = new URL(http.mock.calls[2][0] as string);
    expect(url.searchParams.get('q')).toContain(`Email = '${salesforceLiteral(email)}' LIMIT 2`);
    expect(http.mock.calls.every(call => (call[1] as RequestInit).redirect === 'error')).toBe(true);
  });
  it('does not report success or retry when a PATCH is rejected', async () => {
    const { sf, http } = client([json([{ version: '60.0' }]), json(schema), json({ records: [{ Id: id }] }), json([{ message: 'private Salesforce detail' }], 403)]);
    await expect(sf.write('Account', { Name: 'Shop' }, { field: 'Name', value: 'Shop' })).rejects.toThrow('SALESFORCE_PERMISSION_DENIED');
    expect(http).toHaveBeenCalledTimes(4);
  });
  it('rejects duplicate matches without choosing an arbitrary contact', async () => {
    const { sf, http } = client([json([{ version: '60.0' }]), json(schema), json({ records: [{ Id: id }, { Id: id }] })]);
    await expect(sf.write('Contact', { Email: 'a@example.org' }, { field: 'Email', value: 'a@example.org' })).rejects.toThrow('SALESFORCE_MATCH_AMBIGUOUS');
    expect(http).toHaveBeenCalledTimes(3);
  });
  it('requires readback of the written values', async () => {
    const { sf, http } = client([json([{ version: '60.0' }]), json(schema), json({ id, success: true }), json({ Id: id, Name: 'Different' })]);
    await expect(sf.write('Account', { Name: 'Shop' })).rejects.toThrow('SALESFORCE_READBACK_MISMATCH');
    expect(http).toHaveBeenCalledTimes(4);
  });
  it('uses client credentials on the configured My Domain, then discovers supported versions', async () => {
    const http = vi.fn(async (url: string) => url.endsWith('/token') ? json({ access_token: 'private-token', instance_url: 'https://example.my.salesforce.com' }) : url.endsWith('/services/data/') ? json([{ version: '59.0' }, { version: '62.0' }]) : json(schema));
    const sf = new SalesforceClient({ instanceUrl: 'https://example.my.salesforce.com', clientId: 'client', clientSecret: 'private' }, http);
    const proof = await sf.compatibility();
    expect(proof.apiVersion).toBe('62.0');
    expect(proof.delivery_verified).toBe(false);
    expect(JSON.stringify(proof)).not.toContain('private');
    expect(http).toHaveBeenCalledTimes(6);
  });
  it('checks org-specific required fields and restricted picklists before writes', async () => {
    const required = { ...schema, fields: [...fields, { name: 'Region__c', createable: true, updateable: true, nillable: false, defaultedOnCreate: false }] };
    const a = client([json([{ version: '60.0' }]), json(required)]);
    await expect(a.sf.write('Account', { Name: 'Shop' })).rejects.toThrow('SALESFORCE_REQUIRED_FIELD_MISSING');
    expect(a.http).toHaveBeenCalledTimes(2);
    const restricted = { ...schema, fields: [{ name: 'StageName', createable: true, updateable: true, restrictedPicklist: true, picklistValues: [{ value: 'Qualified', active: true }] }] };
    const b = client([json([{ version: '60.0' }]), json(restricted)]);
    await expect(b.sf.write('Opportunity', { StageName: 'Enrollment' })).rejects.toThrow('SALESFORCE_PICKLIST_VALUE_INVALID');
    expect(b.http).toHaveBeenCalledTimes(2);
  });
  it('rejects fields that Salesforce does not permit the integration user to write', async () => {
    const { sf, http } = client([json([{ version: '60.0' }]), json(schema)]);
    await expect(sf.write('Contact', { Name: 'read-only compound name', Secret__c: 'value' })).rejects.toThrow('SALESFORCE_FIELD_NOT_WRITABLE');
    expect(http).toHaveBeenCalledTimes(2);
  });
});
