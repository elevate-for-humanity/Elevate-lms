import {
  describe,
  expect,
  it,
} from 'vitest';


const baseUrl =
  process.env.TEST_BASE_URL ??
  'http://localhost:3000';


async function request(
  path: string,
  init?: RequestInit,
) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    redirect: 'manual',
  });
}


describe('Unified Studio protected routes', () => {
  it('protects media assets API', async () => {
    const response = await request(
      '/api/admin/media-assets',
    );


    expect([401, 403, 302, 307]).toContain(
      response.status,
    );
  });


  it('protects media health API', async () => {
    const response = await request(
      '/api/admin/dev-studio/media/health',
    );


    expect([401, 403, 302, 307]).toContain(
      response.status,
    );
  });


  it('protects CFD health API', async () => {
    const response = await request(
      '/api/admin/dev-studio/cfd/health',
    );


    expect([401, 403, 302, 307]).toContain(
      response.status,
    );
  });


  it('protects CFD projects API', async () => {
    const response = await request(
      '/api/admin/cfd-projects',
    );


    expect([401, 403, 302, 307]).toContain(
      response.status,
    );
  });


  it('does not expose health secrets', async () => {
    const response = await request(
      '/api/devstudio/health',
    );


    const text = await response.text();


    expect(text).not.toContain(
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
        '__not_configured__',
    );


    expect(text).not.toContain(
      process.env.NORTHFLANK_API_TOKEN ??
        '__not_configured__',
    );
  });
});
