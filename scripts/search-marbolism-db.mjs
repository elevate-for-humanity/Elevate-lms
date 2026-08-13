import https from 'node:https';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !apiKey) {
  console.error('SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

const endpoint = new URL(supabaseUrl);

async function searchMarbolism() {
  const tables = ['products', 'courses', 'course_lessons', 'platform_settings', 'tenants'];
  console.log('--- SCANNING SUPABASE FOR "MARBOLISM" ---');

  let requestFailures = 0;
  for (const table of tables) {
    const options = {
      hostname: endpoint.hostname,
      port: endpoint.port || 443,
      path: `/rest/v1/${table}?or=(name.ilike.*marbolism*,description.ilike.*marbolism*,long_description.ilike.*marbolism*,content.ilike.*marbolism*)`,
      method: 'GET',
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    };

    await new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if ((res.statusCode || 500) >= 400) {
            requestFailures += 1;
            console.error(`[${table}] request failed with HTTP ${res.statusCode}`);
            resolve();
            return;
          }
          try {
            const data = JSON.parse(body);
            if (Array.isArray(data) && data.length > 0) {
              console.log(`[${table}] FOUND ${data.length} matches.`);
              for (const item of data) console.log(`  - ID: ${item.id} | Slug: ${item.slug || 'N/A'}`);
            }
          } catch {
            requestFailures += 1;
            console.error(`[${table}] returned an invalid JSON response.`);
          }
          resolve();
        });
      });
      req.on('error', (error) => {
        requestFailures += 1;
        console.error(`[${table}] request error: ${error.message}`);
        resolve();
      });
      req.end();
    });
  }

  if (requestFailures) process.exit(1);
}

searchMarbolism().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
