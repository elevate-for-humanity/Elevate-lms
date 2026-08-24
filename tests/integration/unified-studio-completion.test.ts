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

  it('protects the canonical Studio health API and does not expose secrets', async () => {
    const response = await request(
      '/api/admin/dev-studio/health',
    );
    const text = await response.text();

    expect([401, 403, 302, 307]).toContain(response.status);
    expect(text).not.toContain(
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
        '__not_configured__',
    );
    expect(text).not.toContain(
      process.env.NORTHFLANK_API_TOKEN ??
        '__not_configured__',
    );
  });

  it('protects the canonical Admin-owned Studio health route', async () => {
    const response = await request('/api/admin/dev-studio/health');
    const text = await response.text();

    expect([401, 403, 302, 307]).toContain(response.status);
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
