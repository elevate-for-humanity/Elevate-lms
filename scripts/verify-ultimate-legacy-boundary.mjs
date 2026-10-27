import fs from 'node:fs';import path from 'node:path';
const root='lib/ultimate-course-builder';const forbidden=['@/lib/course-builder/','@/lib/course-factory/','@/lib/course-video/'];const failures=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx|js|mjs)$/.test(e.name)){const s=fs.readFileSync(p,'utf8');for(const x of forbidden)if(s.includes(x))failures.push(p+' imports '+x);}}}
walk(root);if(failures.length){console.error(failures.join('\n'));process.exit(1);}console.log('Ultimate legacy-boundary imports: PASS');
