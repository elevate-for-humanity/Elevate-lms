#!/usr/bin/env node
/**
 * Link Integrity Check
 * Scans active Next.js app trees and shared UI for literal internal links.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nextConfig from '../../next.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const reportsDir = path.join(rootDir, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const APP_DIRS = [
  path.join(rootDir,'apps','marketing','app'),
  path.join(rootDir,'apps','lms','app'),
  path.join(rootDir,'apps','admin','app'),
  path.join(rootDir,'apps','app'),
  path.join(rootDir,'app'),
  path.join(rootDir,'app-legacy'),
].filter(fs.existsSync);
const SOURCE_DIRS = [...APP_DIRS, path.join(rootDir,'components')].filter(fs.existsSync);
const publicDir = path.join(rootDir,'public');

const escapeRegExp=(v)=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function collectRoutes(dir, base='') {
  const routes=[];
  if(!fs.existsSync(dir)) return routes;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if(entry.name.startsWith('.')||entry.name.startsWith('_')||entry.name==='api') continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) {
      const seg=entry.name.startsWith('(')?'':`/${entry.name}`;
      routes.push(...collectRoutes(full,base+seg));
    } else if(/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) routes.push(base||'/');
  }
  return routes;
}
function collectStatic(dir,base='') {
  const out=[]; if(!fs.existsSync(dir)) return out;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})) {
    if(e.name.startsWith('.')) continue;
    const full=path.join(dir,e.name), p=`${base}/${e.name}`;
    if(e.isDirectory()) out.push(...collectStatic(full,p)); else out.push(p);
  }
  return out;
}
function extractLinks(dir) {
  const links=new Set(); if(!fs.existsSync(dir)) return links;
  const walk=(d)=>{ for(const e of fs.readdirSync(d,{withFileTypes:true})) {
    if(['node_modules','.next','.git'].includes(e.name)||e.name.startsWith('.')) continue;
    const full=path.join(d,e.name);
    if(e.isDirectory()) walk(full);
    else if(/\.(tsx|ts|jsx|js)$/.test(e.name)) {
      const c=fs.readFileSync(full,'utf8');
      for(const re of [/href\s*=\s*["']([^"']+)["']/g,/router\.(?:push|replace)\(\s*["']([^"']+)["']/g,/redirect\(\s*["']([^"']+)["']/g]) {
        for(const m of c.matchAll(re)) if(m[1].startsWith('/')&&!m[1].startsWith('//')) links.add(m[1].split('?')[0].split('#')[0]);
      }
    }
  }}; walk(dir); return links;
}
function routeRegex(route) {
  if(route==='/') return /^\/$/;
  const parts=route.split('/').filter(Boolean).map(s=>{
    if(/^\[\[\.\.\..+\]\]$/.test(s)) return '(?:/.*)?';
    if(/^\[\.\.\..+\]$/.test(s)) return '/.+';
    if(/^\[.+\]$/.test(s)) return '/[^/]+';
    return '/'+escapeRegExp(s);
  }); return new RegExp('^'+parts.join('')+'/?$');
}

const routes=[...new Set(APP_DIRS.flatMap(d=>collectRoutes(d)))];
const staticFiles=new Set(collectStatic(publicDir));
const links=new Set(); for(const d of SOURCE_DIRS) for(const l of extractLinks(d)) links.add(l);
const redirectSources=typeof nextConfig?.redirects==='function'?(await nextConfig.redirects()).map(r=>r.source):[];
const redirectRegexes=redirectSources.map(routeRegex);
const routeRegexes=routes.map(routeRegex);

const broken=[], valid=[];
for(const link of links) {
  const ok=routeRegexes.some(r=>r.test(link))||redirectRegexes.some(r=>r.test(link))||staticFiles.has(link);
  (ok?valid:broken).push({link,status:ok?'valid':'broken'});
}
const report={timestamp:new Date().toISOString(),summary:{appTrees:APP_DIRS.length,routesDiscovered:routes.length,totalLinks:links.size,validLinks:valid.length,brokenLinks:broken.length},brokenLinks:broken,validLinks:valid.slice(0,200)};
fs.writeFileSync(path.join(reportsDir,'link_report.json'),JSON.stringify(report,null,2));
console.log(`Link integrity: ${APP_DIRS.length} app trees, ${routes.length} routes, ${links.size} internal links.`);
if(links.size<20){ console.error('FAIL: Link coverage is implausibly low; integrity cannot be proven.'); process.exit(1); }
if(broken.length){ console.error(`FAIL: ${broken.length} broken internal link(s).`); broken.slice(0,100).forEach(x=>console.error(`  - ${x.link}`)); process.exit(1); }
console.log('PASS: Active-platform internal links resolve to a route, redirect, or static asset.');
process.exit(0);
