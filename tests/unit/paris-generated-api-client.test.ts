import { expect, it, vi } from 'vitest';
import { stripTypeScriptTypes } from 'node:module';
import { generateTypeScriptClient, importAPI } from '@/lib/paris/import-engine/api-importer';
it('generated clients substitute path and query parameters and reject upstream errors', async () => {
  const source = generateTypeScriptClient({name: 'Example', baseUrl: 'https://api.example.test/v1', schemas: {}, security: [], tags: [], endpoints: [{path: '/widgets/{id}', method: 'GET', parameters: [{name: 'id', in: 'path', type: 'string', required: true}, {name: 'search', in: 'query', type: 'string', required: false}], responses: [{statusCode: 200, description: 'OK'}]}]});
  const compiled = stripTypeScriptTypes(source).replace(/^import .*$/gm, '').replaceAll('export ', '');
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json({id: 'a/b'})).mockResolvedValueOnce(Response.json({message: 'unavailable'}, {status: 503}));
  const client = new Function('fetch', compiled + '\nreturn createExampleClient({});')(fetcher);
  expect(await client.getResource('a/b', {search: 'hello world'})).toEqual({id: 'a/b'});
  expect(fetcher.mock.calls[0][0]).toBe('https://api.example.test/v1/widgets/a%2Fb?search=hello+world');
  await expect(client.getResource('a')).rejects.toThrow('unavailable');
});
it('OpenAPI default servers resolve against the actual specification origin', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({openapi: '3.0.0', info: {title: 'Example'}, paths: {}})));
  try {
    const result = await importAPI('https://api.example.test/spec.json');
    expect(result.success).toBe(true);
    expect(result.analysis).toMatchObject({baseUrl: 'https://api.example.test/'});
  } finally { vi.unstubAllGlobals(); }
});
