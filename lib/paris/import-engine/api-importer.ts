/**
 * PARIS Import Engine - API Importer
 * Imports and generates TypeScript clients from OpenAPI/Swagger specs
 */

import type {
  APIAnalysis,
  APIEndpoint,
  APIParameter,
  APIResponse,
  ImportResult,
} from './types';

/**
 * Parse OpenAPI/Swagger URL to extract specification
 */
export async function fetchOpenAPISpec(url: string): Promise<Record<string, unknown>> {
  // If it's a raw URL, fetch directly
  if (url.includes('raw.githubusercontent.com') || url.includes('rawgit.com')) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch spec: ${response.statusText}`);
    }
    return response.json();
  }

  // If it's a GitHub URL, convert to raw
  // eslint-disable-next-line no-useless-escape
  const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+)/);
  if (githubMatch) {
    const [, owner, repo, path] = githubMatch;
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${path}`;
    const response = await fetch(rawUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch spec: ${response.statusText}`);
    }
    return response.json();
  }

  // If it's a URL, try to fetch as-is
  if (url.startsWith('http')) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch spec: ${response.statusText}`);
    }
    return response.json();
  }

  throw new Error('Invalid specification URL');
}

/**
 * Detect OpenAPI version
 */
function detectOpenAPIVersion(spec: Record<string, unknown>): '3.0' | '3.1' | '2.0' | 'swagger' | 'unknown' {
  if (spec.openapi) {
    const version = String(spec.openapi);
    if (version.startsWith('3.1')) return '3.1';
    if (version.startsWith('3.0')) return '3.0';
  }
  if (spec.swagger) return 'swagger';
  return 'unknown';
}

/**
 * Parse OpenAPI 3.x specification
 */
function parseOpenAPI3(spec: Record<string, unknown>): APIAnalysis {
  const info = spec.info as Record<string, unknown> || {};
  const servers = spec.servers as Array<{ url: string }> || [];
  const paths = spec.paths as Record<string, Record<string, unknown>> || {};
  const components = spec.components as Record<string, unknown> || {};
  const schemas = components.schemas as Record<string, unknown> || {};
  const tags = spec.tags as Array<{ name: string; description?: string }> || [];

  const endpoints: APIEndpoint[] = [];
  const endpointTags = new Map<string, string[]>();

  // Extract tags from paths
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) {
        const op = details as Record<string, unknown>;
        const opTags = (op.tags as string[]) || ['Untagged'];
        
        // Store tag associations
        if (!endpointTags.has(path)) {
          endpointTags.set(path, []);
        }
        endpointTags.get(path)!.push(...opTags);

        // Parse parameters
        const parameters: APIParameter[] = [];
        const opParams = op.parameters as Array<Record<string, unknown>> || [];
        for (const param of opParams) {
          parameters.push({
            name: param.name as string,
            in: param.in as APIParameter['in'],
            type: (param.schema as Record<string, unknown>)?.type as string || 'string',
            required: param.required as boolean || false,
            description: param.description as string,
            example: (param.schema as Record<string, unknown>)?.example as string,
          });
        }

        // Parse request body
        let requestBody: APIEndpoint['requestBody'];
        const body = op.requestBody as Record<string, unknown>;
        if (body) {
          const content = body.content as Record<string, { schema?: Record<string, unknown>; example?: unknown }> || {};
          const jsonContent = content['application/json'];
          requestBody = {
            contentType: Object.keys(content)[0] || 'application/json',
            schema: jsonContent?.schema,
            example: jsonContent?.example,
            required: body.required as boolean || false,
          };
        }

        // Parse responses
        const responses: APIResponse[] = [];
        const opResponses = op.responses as Record<string, unknown> || {};
        for (const [statusCode, response] of Object.entries(opResponses)) {
          const resp = response as Record<string, unknown>;
          const respContent = resp.content as Record<string, { schema?: Record<string, unknown>; example?: unknown }> || {};
          const jsonResp = respContent['application/json'];

          responses.push({
            statusCode: statusCode === 'default' ? 0 : parseInt(statusCode),
            description: resp.description as string || '',
            contentType: Object.keys(respContent)[0],
            schema: jsonResp?.schema,
            example: jsonResp?.example,
          });
        }

        endpoints.push({
          path,
          method: method.toUpperCase() as APIEndpoint['method'],
          description: op.summary as string || op.description as string,
          parameters: parameters.length > 0 ? parameters : undefined,
          requestBody,
          responses,
          tags: opTags,
          security: (op.security as string[][])?.flat() || [],
        });
      }
    }
  }

  // Extract schemas
  const extractedSchemas: Record<string, unknown> = {};
  for (const [name, schema] of Object.entries(schemas)) {
    extractedSchemas[name] = schema;
  }

  return {
    name: info.title as string || 'API',
    version: info.version as string,
    description: info.description as string,
    baseUrl: servers[0]?.url || 'https://api.example.com',
    endpoints,
    schemas: extractedSchemas,
    security: (spec.security as string[][])?.flat() || [],
    tags: tags.map(t => t.name),
    openapi: spec.openapi as string,
  };
}

/**
 * Parse Swagger 2.0 specification
 */
function parseSwagger2(spec: Record<string, unknown>): APIAnalysis {
  const info = spec.info as Record<string, unknown> || {};
  const basePath = spec.basePath as string || '';
  const host = spec.host as string || '';
  const schemes = (spec.schemes as string[]) || ['https'];
  const paths = spec.paths as Record<string, Record<string, unknown>> || {};
  const definitions = spec.definitions as Record<string, unknown> || {};
  const tags = spec.tags as Array<{ name: string }> || [];

  const baseUrl = `${schemes[0]}://${host}${basePath}`;

  const endpoints: APIEndpoint[] = [];

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) {
        const op = details as Record<string, unknown>;
        const opTags = (op.tags as string[]) || ['Untagged'];

        // Parse parameters
        const parameters: APIParameter[] = [];
        const opParams = op.parameters as Array<Record<string, unknown>> || [];
        for (const param of opParams) {
          parameters.push({
            name: param.name as string,
            in: param.in as APIParameter['in'],
            type: param.type as string || 'string',
            required: param.required as boolean || false,
            description: param.description as string,
            example: param.example as string,
          });
        }

        // Parse responses
        const responses: APIResponse[] = [];
        const opResponses = op.responses as Record<string, unknown> || {};
        for (const [statusCode, response] of Object.entries(opResponses)) {
          const resp = response as Record<string, unknown>;
          const schema = resp.schema as Record<string, unknown>;
          
          responses.push({
            statusCode: statusCode === 'default' ? 0 : parseInt(statusCode),
            description: resp.description as string || '',
            schema: schema?.$ref ? { [schema.$ref as string]: {} } : schema,
            example: resp.examples ? (resp.examples['application/json'] as unknown) : undefined,
          });
        }

        endpoints.push({
          path,
          method: method.toUpperCase() as APIEndpoint['method'],
          description: op.summary as string || op.description as string,
          parameters: parameters.length > 0 ? parameters : undefined,
          responses,
          tags: opTags,
        });
      }
    }
  }

  return {
    name: info.title as string || 'API',
    version: info.version as string,
    description: info.description as string,
    baseUrl: baseUrl || 'https://api.example.com',
    endpoints,
    schemas: definitions,
    security: [],
    tags: tags.map(t => t.name),
    swagger: spec.swagger as string,
  };
}

/**
 * Generate TypeScript client from API analysis
 */
export function generateTypeScriptClient(analysis: APIAnalysis): string {
  const lines: string[] = [];
  
  // Header
  lines.push('/**');
  lines.push(` * ${analysis.name} API Client`);
  if (analysis.version) lines.push(` * Version: ${analysis.version}`);
  if (analysis.description) lines.push(` * ${analysis.description}`);
  lines.push(` * Generated by PARIS Import Engine`);
  lines.push(' */');
  lines.push('');
  lines.push("import { createClient, SupabaseClient } from '@supabase/supabase-js';");
  lines.push('');

  // Types
  lines.push('// Types');
  lines.push('');
  
  for (const [name, schema] of Object.entries(analysis.schemas)) {
    lines.push(`export interface ${name} {`);
    if (typeof schema === 'object' && schema !== null) {
      const schemaObj = schema as Record<string, unknown>;
      const properties = schemaObj.properties as Record<string, unknown> || {};
      const required = (schemaObj.required as string[]) || [];
      
      for (const [propName, prop] of Object.entries(properties)) {
        const propSchema = prop as Record<string, unknown>;
        const type = mapOpenAPIType(propSchema.type as string, propSchema.format as string);
        const optional = required.includes(propName) ? '' : '?';
        const description = propSchema.description ? ` // ${propSchema.description}` : '';
        lines.push(`  ${propName}${optional}: ${type};${description}`);
      }
    }
    lines.push('}');
    lines.push('');
  }

  // Client class
  lines.push(`export class ${analysis.name.replace(/[^a-zA-Z0-9]/g, '')}Client {`);
  lines.push('  private baseUrl: string;');
  lines.push('  private headers: Record<string, string>;');
  lines.push('');
  lines.push(`  constructor(config: { baseUrl?: string; apiKey?: string }) {`);
  lines.push(`    this.baseUrl = config.baseUrl || '${analysis.baseUrl}';`);
  lines.push('    this.headers = {');
  lines.push(`      'Content-Type': 'application/json',`);
  lines.push('    };');
  lines.push('    if (config.apiKey) {');
  lines.push("      this.headers['Authorization'] = `Bearer ${config.apiKey}`;");
  lines.push('    }');
  lines.push('  }');
  lines.push('');

  // Generate methods for each endpoint
  for (const endpoint of analysis.endpoints) {
    const methodName = generateMethodName(endpoint);
    const params = generateMethodParams(endpoint);
    const bodyType = endpoint.requestBody ? extractTypeName(endpoint.requestBody.schema) : 'unknown';
    
    lines.push(`  /**`);
    if (endpoint.description) lines.push(`   * ${endpoint.description}`);
    lines.push(`   */`);
    lines.push(`  async ${methodName}(${params}): Promise<${bodyType}> {`);
    lines.push(`    const url = new URL(\`\${this.baseUrl}${endpoint.path}\`);`);
    
    // Add query parameters
    const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];
    for (const param of queryParams) {
      lines.push(`    if (${param.name} !== undefined) {`);
      lines.push(`      url.searchParams.set('${param.name}', String(${param.name}));`);
      lines.push('    }');
    }

    lines.push('');
    
    const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE' && endpoint.requestBody;
    const hasPathParams = endpoint.parameters?.some(p => p.in === 'path');
    
    lines.push('    const options: RequestInit = {');
    lines.push(`      method: '${endpoint.method}',`);
    lines.push('      headers: this.headers,');
    
    if (hasBody) {
      lines.push('      body: JSON.stringify(requestBody),');
    }
    
    lines.push('    };');
    lines.push('');
    lines.push('    const response = await fetch(url.toString(), options);');
    lines.push('');
    
    // Handle different response types
    const successCodes = endpoint.responses.filter(r => r.statusCode >= 200 && r.statusCode < 300);
    if (successCodes.length > 0) {
      lines.push('    if (!response.ok) {');
      lines.push('      const error = await response.json().catch(() => ({}));');
      lines.push('      throw new Error(error.message || `HTTP error! status: ${response.status}`);');
      lines.push('    }');
      lines.push('');
      lines.push('    return response.json();');
    }
    
    lines.push('  }');
    lines.push('');
  }

  lines.push('}');
  lines.push('');
  
  // Export factory function
  lines.push(`export function create${analysis.name.replace(/[^a-zA-Z0-9]/g, '')}Client(config: { baseUrl?: string; apiKey?: string }) {`);
  lines.push(`  return new ${analysis.name.replace(/[^a-zA-Z0-9]/g, '')}Client(config);`);
  lines.push('}');

  return lines.join('\n');
}

/**
 * Map OpenAPI type to TypeScript type
 */
function mapOpenAPIType(type: string | undefined, format: string | undefined): string {
  if (!type) return 'unknown';
  
  switch (type) {
    case 'string':
      if (format === 'date-time' || format === 'date') return 'string'; // Could be Date
      if (format === 'email') return 'string';
      if (format === 'uuid') return 'string';
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'unknown[]'; // Would need to check items
    case 'object':
      return 'Record<string, unknown>';
    default:
      return 'unknown';
  }
}

/**
 * Extract type name from schema reference
 */
function extractTypeName(schema: Record<string, unknown> | undefined): string {
  if (!schema) return 'unknown';
  
  if (schema.$ref) {
    const ref = schema.$ref as string;
    return ref.split('/').pop() || 'unknown';
  }
  
  return mapOpenAPIType(schema.type as string, schema.format as string);
}

/**
 * Generate method name from endpoint
 */
function generateMethodName(endpoint: APIEndpoint): string {
  const path = endpoint.path.replace(/\//g, '_').replace(/[{}]/g, '');
  const method = endpoint.method.toLowerCase();
  
  // Common REST conventions
  const action = 
    endpoint.method === 'GET' ? 'get' :
    endpoint.method === 'POST' ? 'create' :
    endpoint.method === 'PUT' || endpoint.method === 'PATCH' ? 'update' :
    endpoint.method === 'DELETE' ? 'delete' :
    method;

  // Extract resource name from path
  const segments = endpoint.path.split('/').filter(Boolean);
  const resource = segments[segments.length - 1]?.replace(/{.*}/, '') || 'resource';

  return `${action}${capitalize(resource)}`;
}

/**
 * Generate method parameters
 */
function generateMethodParams(endpoint: APIEndpoint): string {
  const params: string[] = [];
  
  // Path parameters
  const pathParams = endpoint.parameters?.filter(p => p.in === 'path') || [];
  for (const param of pathParams) {
    params.push(`${param.name}: ${mapOpenAPIType(param.type, undefined)}`);
  }
  
  // Query parameters
  const queryParams = endpoint.parameters?.filter(p => p.in === 'query') || [];
  if (queryParams.length > 0) {
    const queryInterface = `{\n      ${queryParams.map(p => `${p.name}?: ${mapOpenAPIType(p.type, undefined)}`).join(',\n      ')}\n    }`;
    params.push(`queryParams?: ${queryInterface}`);
  }
  
  // Request body
  if (endpoint.requestBody) {
    const bodyType = extractTypeName(endpoint.requestBody.schema);
    params.push(`requestBody: ${bodyType}`);
  }
  
  return params.join(', ');
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Main API import function
 */
export async function importAPI(
  specUrl: string,
  options?: { apiKey?: string }
): Promise<ImportResult> {
  try {
    const spec = await fetchOpenAPISpec(specUrl);
    const version = detectOpenAPIVersion(spec);
    
    let analysis: APIAnalysis;
    
    if (version === '3.0' || version === '3.1') {
      analysis = parseOpenAPI3(spec);
    } else if (version === 'swagger' || version === '2.0') {
      analysis = parseSwagger2(spec);
    } else {
      return {
        success: false,
        errors: ['Unable to parse API specification. Please ensure it is valid OpenAPI 3.x or Swagger 2.0.'],
      };
    }

    // Generate TypeScript client
    const clientCode = generateTypeScriptClient(analysis);

    return {
      success: true,
      analysis,
      exportPath: clientCode,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}

/**
 * Generate Supabase Edge Function from API endpoint
 */
export function generateSupabaseEdgeFunction(
  endpoint: APIEndpoint,
  apiClientCode: string
): string {
  const functionName = generateMethodName(endpoint).replace(/([A-Z])/g, '_$1').toLowerCase();
  
  return `
// Supabase Edge Function: ${functionName}
// Generated by PARIS Import Engine

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Parse request
    const { data: authData } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '')
    )

    if (!authData.user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const requestBody = await req.json()

    // TODO: Implement ${endpoint.method} ${endpoint.path} logic here
    // ${endpoint.description || ''}

    const result = {
      success: true,
      message: 'Edge function placeholder',
      endpoint: '${endpoint.method} ${endpoint.path}',
      data: requestBody,
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
`;
}
