import https from 'https';

const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eHp6cHN5dWZjZXd0bWljc3prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE2MTA0NywiZXhwIjoyMDczNzM3MDQ3fQ.5JRYvJPzFzsVaZQkbZDLcohP7dq8LWQEFeFdVByyihE';

async function searchMarbolism() {
  const tables = ['products', 'courses', 'course_lessons', 'platform_settings', 'tenants'];
  console.log('--- SCANNING SUPABASE FOR \"MARBOLISM\" ---');

  for (const table of tables) {
    const options = {
      hostname: 'cuxzzpsyufcewtmicszk.supabase.co',
      port: 443,
      path: `/rest/v1/${table}?or=(name.ilike.*marbolism*,description.ilike.*marbolism*,long_description.ilike.*marbolism*,content.ilike.*marbolism*)`,
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': 'Bearer ' + apiKey
      }
    };

    await new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.length > 0) {
              console.log(`[${table}] FOUND ${data.length} matches.`);
              data.forEach(item => {
                console.log(`  - ID: ${item.id} | Slug: ${item.slug || 'N/A'}`);
              });
            } else {
              // console.log(`[${table}] No matches.`);
            }
          } catch (e) {
            // console.log(`[${table}] Skip (no columns match)`);
          }
          resolve();
        });
      });
      req.on('error', (e) => resolve());
      req.end();
    });
  }
}

searchMarbolism();
