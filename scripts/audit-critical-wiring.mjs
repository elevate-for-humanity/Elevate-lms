import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const roots = ['apps','components','lib','hooks','data','supabase','scripts'];
const exts = new Set(['.ts','.tsx','.js','.jsx','.sql','.mjs']);
function walk(dir,out=[]){if(!fs.existsSync(dir)) return out; for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.next','.git','dist','build'].includes(ent.name)) continue; const p=path.join(dir,ent.name); ent.isDirectory()?walk(p,out):(exts.has(path.extname(ent.name))&&out.push(p));} return out;}
const files=roots.flatMap(r=>walk(path.join(root,r)));
const records=files.map(p=>({path:path.relative(root,p).replaceAll('\\','/'),text:fs.readFileSync(p,'utf8')}));
const searches={
  secureIdentity:/secure_identity|prepareSSNForStorage|hashSSN\(|ssn_last4|ssn_hash/i,
  identityDocuments:/government.?issued|photo id|identity document|driver.?s license|state id|identity_documents_uploaded/i,
  verificationSubmit:/verification\/submit|idFront|idBack|selfie/i,
  cartRoutes:/cart_items|cart-checkout|\/api\/cart\//i,
  pwaRegistration:/serviceWorker\.register|PwaRegistration|PWAInit|AdminPwaRegister|manifest-(?:lms|admin|marketing)/i,
  heroOverlay:/hero|banner/i,
};
let md=`# Critical wiring references\n\nGenerated: ${new Date().toISOString()}\n\n`;
for(const [name,re] of Object.entries(searches)){
  const hits=records.filter(r=>re.test(r.text));
  md+=`## ${name}\n\n${hits.length} files\n\n`+hits.map(r=>`- ${r.path}`).join('\n')+'\n\n';
}
const routeFiles=records.filter(r=>/\/route\.(?:ts|js)$/.test(r.path) && /cart|identity|ssn|verification|application|idFront|selfie/i.test(r.path+' '+r.text.slice(0,5000)));
md+='## Critical route files\n\n'+routeFiles.map(r=>`- ${r.path}`).join('\n')+'\n';
const out=path.join(root,'docs/audits/critical-wiring.md'); fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,md); console.log(`Wrote ${path.relative(root,out)}`);
