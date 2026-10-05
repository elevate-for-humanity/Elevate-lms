import {privateDecrypt,createDecipheriv} from 'node:crypto';
const blob={"key":"gcF3+WObwSpQO/NucaNDUCMXlhGAds2JfFkhjYqaS/uaBcyHBIRONmaSRRFWksyVXq4076ObmHnTghf/InF1o/+4EgcHurfNw3vnZHNoO//j59bBW48Hg2YQZ5TaSDe5HN3EuyIoWE6rHe4yvaeJIgEQjWfN8lC4TM4OoqzXJEI/SbFwlkqRSzdPBE3fT+ltfOhqzJGubMmd9kWoKWM8qShvJBSaob5cUGC47rN91RSi3X/csBGDDH4ucYHy1Gd/EoXBMP294BqPjUPBkMc4pI3ZM3079+AoBGIRzaU5kShJQAnoYKXBpj7S6M1nflrf73qPi/sMs4kg45NQJ924Miu7CMkR+c6XsTRtgsxE3/FBxZWKFZBJJkWcWt/rhMzIginH0qtReR0dfoPzVahJPHIWRvlw4E6RsgUgiA2SWMI6smZycnPf9wJnrs9Jegqmvm4jGuQxHBXN9R7nA2pKuplAXQX840wzemUR+VoHyO8ZHznSYWT2G65Kj6Cj2R2I","iv":"+bAsQsOYObu55+hW","data":"BnkKNgBE82VNOLijS0X2LDKt4zvYdBmAuOW2/odxj1+ZZJHt5q1C9vjYhyRvUzcktqrhHcHkkJhYdlrEt4X5quLlBbG/ndMbMbDNin9hteQ1EgbCp1NGVLbKeCb/WXhnUxW+e7xiH79ZNtSWgE+/mf0LvRYtwAtNpeI6o+yRFmTb+bLrHGgQhTc2FQPZnXDl7NyZnTVongvrbPfZlZwI7EfyJMdq/fIc/Z6eA67pTeistXz2Gkz6a8LCGy0FQWpx92EmPZd8qqHHlV7YbhCqBh0RSfpjx3jMD6wfpt+j9Y6k+rDWVp2o6oZqTQ0j2e9ACtnLc3OBi0hWrtMXUDXCbAlKYRyFiWHWVF06frISt0F4Blbud+R+JkbOKvBPEJAQIwxO+i5W5K+PRebnsjH7DGYg5lusuKEasdTuGjhoOj7lX6QR3Zdz","tag":"0UWLol8x6EVMrBk179jD6A=="};
const token=process.env.NORTHFLANK_API_TOKEN;
const base='https://api.northflank.com/v1/projects/elevate-platform';
async function nf(path,method='GET',body){
 const r=await fetch(base+path,{method,headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw new Error('Northflank '+method+' '+path+' HTTP '+r.status);
 if(r.status===204)return {};const j=await r.json();return j.data??j;
}
const transfer=await nf('/secrets/b2-setup-transfer-20261005/details');
const aes=privateDecrypt({key:transfer.secrets.variables.TRANSFER_PRIVATE_KEY,oaepHash:'sha256'},Buffer.from(blob.key,'base64'));
const d=createDecipheriv('aes-256-gcm',aes,Buffer.from(blob.iv,'base64'));d.setAuthTag(Buffer.from(blob.tag,'base64'));
const config=JSON.parse(Buffer.concat([d.update(Buffer.from(blob.data,'base64')),d.final()]).toString());
const current=await nf('/secrets/elevate-production-env/details');
await nf('/secrets/elevate-production-env','PATCH',{secrets:{...current.secrets,variables:{...current.secrets.variables,...config}}});
const verified=await nf('/secrets/elevate-production-env/details');
if(!Object.entries(config).every(([k,v])=>verified.secrets.variables[k]===v))throw new Error('Configuration readback mismatch');
const auth=await fetch('https://api.backblazeb2.com/b2api/v4/b2_authorize_account',{headers:{authorization:'Basic '+Buffer.from(config.ELEVATE_MEDIA_ACCESS_KEY_ID+':'+config.ELEVATE_MEDIA_SECRET_ACCESS_KEY).toString('base64')}});
if(!auth.ok)throw new Error('Restricted B2 credential HTTP '+auth.status);
console.info(JSON.stringify({saved:true,bucket:config.ELEVATE_MEDIA_BUCKET,provider:config.ELEVATE_MEDIA_PROVIDER,restrictedCredentialVerified:true}));
await nf('/secrets/b2-setup-transfer-20261005','DELETE');
console.info('Temporary transfer key removed');
