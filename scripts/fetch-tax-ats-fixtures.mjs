import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const dir=path.resolve('tests/fixtures/tax-ats/ty2026');
const manifest=JSON.parse(await fs.readFile(path.join(dir,'scenarios.json'),'utf8'));
for(const scenario of manifest.scenarios){
 const url=new URL(scenario.sourceUrl);
 if(url.protocol!=='https:'||url.hostname!=='www.irs.gov')throw new Error('Expected official IRS source');
 const response=await fetch(url);
 if(!response.ok)throw new Error(`IRS download failed: ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(createHash('sha256').update(bytes).digest('hex')!==scenario.sourceSha256)throw new Error(`Source changed: ${scenario.id}`);
 await fs.writeFile(path.join(dir,scenario.fixture),bytes);
 console.log(`${scenario.id}: verified`);
}
