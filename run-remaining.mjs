/**
 * Run remaining migrations with proper error handling
 */
import { readFileSync } from 'fs';

const API_TOKEN = 'sbp_b043edfebcd486bf4967e21198d359e8b609788e';
const PROJECT_REF = 'cuxzzpsyufcewtmicszk';

async function runSQL(sql, attempt = 1) {
  const maxRetries = 3;
  
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    
    const data = await response.text();
    
    if (!response.ok) {
      // Rate limited - retry
      if (data.includes('ThrottlerException') && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2000 * attempt));
        return runSQL(sql, attempt + 1);
      }
      
      // Ignore "already exists"
      if (data.includes('already exists') || data.includes('duplicate') || data.includes('42P07')) {
        return { ok: true, skipped: true };
      }
      
      // Table doesn't exist - need to create first
      if (data.includes('relation "') && data.includes('does not exist')) {
        return { ok: false, needsTable: true, error: data.substring(0, 200) };
      }
      
      return { ok: false, error: data.substring(0, 150) };
    }
    return { ok: true };
  } catch (err) {
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
      return runSQL(sql, attempt + 1);
    }
    return { ok: false, error: err.message };
  }
}

async function runFile(filename, delay = 600) {
  console.log(`\n📦 ${filename}`);
  const content = readFileSync(`/workspace/project/Elevate-lms/supabase/migrations/${filename}`, 'utf8');
  
  // Parse into statements
  const statements = [];
  let buffer = '';
  let depth = 0;
  let inDollar = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '$' && content[i+1] === '$') {
      inDollar = !inDollar;
      buffer += '$$';
      i++;
      continue;
    }
    
    if (!inDollar) {
      if (char === '(') depth++;
      if (char === ')') depth--;
    }
    
    buffer += char;
    
    if (char === ';' && depth === 0 && !inDollar) {
      const stmt = buffer.trim();
      if (stmt && !stmt.startsWith('--') && stmt.length > 2) {
        statements.push(stmt);
      }
      buffer = '';
    }
  }
  
  console.log(`   ${statements.length} statements`);
  
  let success = 0, skipped = 0, failed = 0, needsTable = 0;
  
  for (const stmt of statements) {
    if (!stmt.trim()) continue;
    
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, delay));
    
    const result = await runSQL(stmt);
    
    if (result.skipped) skipped++;
    else if (result.needsTable) {
      needsTable++;
      // Don't count as failure - needs prerequisite
    }
    else if (result.ok) success++;
    else {
      failed++;
      if (failed <= 5) {
        console.log(`\n❌ ${stmt.substring(0, 60)}...`);
        console.log(`   ${result.error}`);
      }
    }
  }
  
  console.log(`\n   ✅${success} ⏭️${skipped} ❌${failed} ⏳${needsTable} (need tables)`);
  return { success, skipped, failed, needsTable };
}

async function main() {
  console.log('🚀 Running remaining migrations...\n');
  
  const files = [
    '20260810000001_ai_agents_dev_studio.sql',
    '20260810000002_course_generation_pipeline.sql',
    '20260810000006_host_shop_subscriptions.sql',
    '20260815000001_store_product_images_variants.sql',
  ];
  
  let total = { success: 0, skipped: 0, failed: 0, needsTable: 0 };
  
  for (const f of files) {
    const result = await runFile(f, 500);
    total.success += result.success;
    total.skipped += result.skipped;
    total.failed += result.failed;
    total.needsTable += result.needsTable;
  }
  
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`TOTAL: ✅${total.success} ⏭️${total.skipped} ❌${total.failed}`);
  console.log(`${'═'.repeat(50)}`);
  
  if (total.needsTable > 0) {
    console.log(`\n⚠️  ${total.needsTable} statements need prerequisite tables`);
  }
}

main().catch(console.error);
