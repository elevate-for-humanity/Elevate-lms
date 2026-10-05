import {generateKeyPairSync} from 'node:crypto';
const token=process.env.NORTHFLANK_API_TOKEN;
const base='https://api.northflank.com/v1/projects/elevate-platform';
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const r=await fetch(base+'/secrets',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({name:'b2-setup-transfer-20261005',type:'secret',secretType:'environment',priority:0,restrictions:{restricted:true,nfObjects:[],tags:[]},secrets:{variables:{TRANSFER_PRIVATE_KEY:privateKey}}})});
if(!r.ok)throw new Error('Secure transfer setup HTTP '+r.status);
console.info('TRANSFER_PUBLIC_KEY='+Buffer.from(publicKey).toString('base64'));
