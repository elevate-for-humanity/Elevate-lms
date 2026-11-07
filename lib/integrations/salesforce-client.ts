/** Server-only Salesforce REST transport. Credentials never leave this client. */
export type SalesforceConfig = {
  instanceUrl?: string; apiKey?: string; clientId?: string; clientSecret?: string;
};
type Fields = Record<string, unknown>;
type ObjectName = 'Contact' | 'Account' | 'Opportunity' | 'Lead';
type Description = { createable: boolean; updateable: boolean; fields: Array<{
  name: string; createable: boolean; updateable: boolean; nillable?: boolean;
  defaultedOnCreate?: boolean; type?: string; restrictedPicklist?: boolean;
  picklistValues?: Array<{ value: string; active: boolean }>;
}> };
export class SalesforceError extends Error {
  constructor(public readonly code: string) { super(code); }
}
export function salesforceOrigin(value: string | undefined): string {
  try {
    const url = new URL(value || '');
    if (url.protocol !== 'https:' || url.port || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash ||
      !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:my\.)?salesforce\.com$/i.test(url.hostname)) throw new Error();
    return url.origin;
  } catch { throw new SalesforceError('SALESFORCE_INSTANCE_URL_INVALID'); }
}
export const salesforceLiteral = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const recordId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$/.test(value);
export class SalesforceClient {
  private readonly origin: string;
  private token?: string;
  private version?: string;
  constructor(private readonly config: SalesforceConfig, private readonly http: typeof fetch = fetch) {
    this.origin = salesforceOrigin(config.instanceUrl);
    this.token = config.apiKey;
  }
  private async json(path: string, init: RequestInit = {}): Promise<any> {
    let response: Response;
    try {
      response = await this.http(this.origin + path, {
        ...init, redirect: 'error', signal: AbortSignal.timeout(15_000),
        headers: { 'Content-Type': 'application/json', ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}), ...init.headers },
      });
    } catch { throw new SalesforceError('SALESFORCE_REQUEST_UNCONFIRMED'); }
    if (!response.ok) throw new SalesforceError(response.status === 401 ? 'SALESFORCE_AUTH_REJECTED' : response.status === 403 ? 'SALESFORCE_PERMISSION_DENIED' : 'SALESFORCE_REQUEST_REJECTED');
    if (response.status === 204) return null;
    try { return await response.json(); }
    catch { throw new SalesforceError('SALESFORCE_RESPONSE_INVALID'); }
  }
  private async connect() {
    if (!this.token) {
      if (!this.config.clientId || !this.config.clientSecret) throw new SalesforceError('SALESFORCE_CREDENTIALS_REQUIRED');
      let response: Response;
      try {
        response = await this.http(this.origin + '/services/oauth2/token', {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15_000),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'client_credentials', client_id: this.config.clientId, client_secret: this.config.clientSecret }),
        });
      } catch { throw new SalesforceError('SALESFORCE_AUTH_UNAVAILABLE'); }
      if (!response.ok) throw new SalesforceError('SALESFORCE_AUTH_REJECTED');
      let data: any;
      try { data = await response.json(); } catch { throw new SalesforceError('SALESFORCE_AUTH_REJECTED'); }
      if (typeof data.access_token !== 'string' || !data.access_token || (data.instance_url && salesforceOrigin(data.instance_url) !== this.origin)) throw new SalesforceError('SALESFORCE_AUTH_REJECTED');
      this.token = data.access_token;
    }
    if (!this.version) {
      const versions = await this.json('/services/data/');
      const available = Array.isArray(versions) ? versions.filter((v: any) => typeof v.version === 'string' && /^\d{2,3}\.0$/.test(v.version)) : [];
      available.sort((a: any, b: any) => Number(b.version) - Number(a.version));
      if (!available.length) throw new SalesforceError('SALESFORCE_API_VERSION_UNAVAILABLE');
      this.version = available[0].version;
    }
  }
  private async describe(object: ObjectName): Promise<Description> {
    await this.connect();
    const data = await this.json(`/services/data/v${this.version}/sobjects/${object}/describe`);
    if (!Array.isArray(data?.fields)) throw new SalesforceError('SALESFORCE_SCHEMA_UNAVAILABLE');
    return data;
  }
  async compatibility() {
    const objects: Record<string, { createable: boolean; updateable: boolean; fields: string[] }> = {};
    for (const name of ['Contact', 'Account', 'Opportunity', 'Lead'] as const) {
      const description = await this.describe(name);
      objects[name] = { createable: description.createable === true, updateable: description.updateable === true,
        fields: description.fields.filter(f => f.createable || f.updateable).map(f => f.name) };
    }
    return { connected: true, instance: this.origin, apiVersion: this.version, objects, checkedAt: new Date().toISOString(), delivery_verified: false };
  }
  async write(object: ObjectName, data: Fields, match?: { field: 'Email' | 'Name'; value: string }): Promise<string> {
    const schema = await this.describe(object);
    let id: string | undefined;
    if (match) {
      const query = `SELECT Id FROM ${object} WHERE ${match.field} = '${salesforceLiteral(match.value)}' LIMIT 2`;
      const found = await this.json(`/services/data/v${this.version}/query?${new URLSearchParams({ q: query })}`);
      if (!Array.isArray(found?.records) || found.records.length > 1) throw new SalesforceError('SALESFORCE_MATCH_AMBIGUOUS');
      if (found.records.length) {
        if (!recordId(found.records[0].Id)) throw new SalesforceError('SALESFORCE_RESPONSE_INVALID');
        id = found.records[0].Id;
      }
    }
    const operation = id ? 'updateable' : 'createable';
    if (!schema[operation]) throw new SalesforceError('SALESFORCE_OBJECT_NOT_WRITABLE');
    const fields = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
    for (const [key, value] of Object.entries(fields)) {
      const field = schema.fields.find(f => f.name === key);
      if (!field?.[operation]) throw new SalesforceError('SALESFORCE_FIELD_NOT_WRITABLE');
      if (field.restrictedPicklist && value !== null && !field.picklistValues?.some(v => v.active && v.value === value)) throw new SalesforceError('SALESFORCE_PICKLIST_VALUE_INVALID');
    }
    if (!id && schema.fields.some(f => f.createable && f.nillable === false && f.defaultedOnCreate === false && (fields[f.name] === undefined || fields[f.name] === null || fields[f.name] === ''))) throw new SalesforceError('SALESFORCE_REQUIRED_FIELD_MISSING');
    const path = `/services/data/v${this.version}/sobjects/${object}`;
    const result = await this.json(path + (id ? '/' + id : ''), { method: id ? 'PATCH' : 'POST', body: JSON.stringify(fields) });
    if (!id) {
      if (result?.success !== true || !recordId(result.id)) throw new SalesforceError('SALESFORCE_WRITE_UNCONFIRMED');
      id = result.id;
    }
    // Never claim delivery on an accepted write alone. Do not replay ambiguous writes.
    const saved = await this.json(path + '/' + id + '?' + new URLSearchParams({ fields: ['Id', ...Object.keys(fields)].join(',') }));
    if (saved?.Id !== id || Object.entries(fields).some(([key, value]) => saved[key] !== value)) throw new SalesforceError('SALESFORCE_READBACK_MISMATCH');
    return id!;
  }
}
