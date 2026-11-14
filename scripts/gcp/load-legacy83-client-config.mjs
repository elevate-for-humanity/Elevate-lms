import {readFileSync,appendFileSync} from 'node:fs';
import {privateDecrypt,createDecipheriv,constants} from 'node:crypto';
const envelope=JSON.parse(Buffer.from(readFileSync('.deploy/legacy83-firebase-client.b64','utf8').trim(),'base64').toString('utf8'));
if(envelope.version!==1)throw Error('Unsupported customer connection envelope');
const key=privateDecrypt({key:readFileSync(process.env.DECRYPTION_KEY_FILE),padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(envelope.encryptedKey,'base64'));
const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.iv,'base64'));
decipher.setAuthTag(Buffer.from(envelope.tag,'base64'));
const profile=JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'base64')),decipher.final()]).toString('utf8'));
if(profile.projectId!=='icywilliams-svp'||profile.authDomain!=='icywilliams-svp.firebaseapp.com'||!/^AIza[A-Za-z0-9_-]+$/.test(profile.apiKey||''))throw Error('Customer Firebase authority does not match the verified live site');
const names={apiKey:'API_KEY',authDomain:'AUTH_DOMAIN',projectId:'PROJECT_ID',storageBucket:'STORAGE_BUCKET',messagingSenderId:'MESSAGING_SENDER_ID',appId:'APP_ID',measurementId:'MEASUREMENT_ID'};
for(const [field,suffix] of Object.entries(names)){
 const value=profile[field];
 if(typeof value!=='string')continue;
 if(/[\r\n\0]/.test(value))throw Error('Invalid customer application setting');
 console.log('::add-mask::'+value);
 appendFileSync(process.env.GITHUB_ENV,'NEXT_PUBLIC_FIREBASE_'+suffix+'='+value+'\n');
}
console.log('Verified existing customer public Firebase connection recovered.');
