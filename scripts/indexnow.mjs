// Explicit changed-URL submissions only. Never submit the whole sitemap on startup.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const origin='https://enetcomproject.com';
const args=process.argv.slice(2),dryRun=args.includes('--dry-run');
const urls=[...new Set(args.filter(a=>a!=='--dry-run'))];
if(!urls.length)throw new Error('Pass the canonical URLs changed by this release.');
const allowed=new Set(['/','/proje.html','/egitimler.html','/uluslararasi.html','/veritabani.html','/ciktilar.html']);
for(const raw of urls){const u=new URL(raw);if(u.origin!==origin||!allowed.has(u.pathname)||u.hash||[...u.searchParams.keys()].some(k=>k!=='lang')||(u.search&& !['en','de'].includes(u.searchParams.get('lang'))))throw new Error('Only canonical public project URLs are allowed.');}
const statePath=process.env.INDEXNOW_STATE_PATH||'.cache/indexnow-state.json';
let state={};try{state=JSON.parse(fs.readFileSync(statePath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const changed=[];
for(const url of urls){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(r.status!==200||r.url!==url)throw new Error('URL is not a direct HTTP 200: '+url);const html=await r.text();const hash=crypto.createHash('sha256').update(html).digest('hex');if(state[url]?.hash!==hash)changed.push({url,hash});}
if(dryRun||!changed.length){console.log(JSON.stringify({dryRun,changed:changed.map(x=>x.url),skipped:urls.length-changed.length}));process.exit(0);}
const key=process.env.INDEXNOW_KEY?.trim();if(!key||! /^[a-zA-Z0-9-]{8,128}$/.test(key))throw new Error('Valid INDEXNOW_KEY required.');
const keyLocation=origin+'/indexnow-key.txt';const verification=await fetch(keyLocation,{signal:AbortSignal.timeout(30000)});if(verification.status!==200||(await verification.text()).trim()!==key)throw new Error('Live verification file does not match.');
const response=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({host:new URL(origin).host,key,keyLocation,urlList:changed.map(x=>x.url)}),signal:AbortSignal.timeout(30000)});
if(![200,202].includes(response.status))throw new Error('IndexNow HTTP '+response.status);
for(const {url,hash}of changed)state[url]={hash,submittedAt:new Date().toISOString(),status:response.status};
fs.mkdirSync(path.dirname(statePath),{recursive:true});fs.writeFileSync(statePath,JSON.stringify(state,null,2));
console.log(JSON.stringify({status:response.status,submitted:changed.map(x=>x.url),meaning:response.status===200?'received; indexing not guaranteed':'received; key validation pending'}));
