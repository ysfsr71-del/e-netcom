// Run: node scripts/check-education-consistency.js
import fs from 'node:fs';
const html=fs.readFileSync('public/index.html','utf8');
const json=JSON.parse(fs.readFileSync('public/shared-training-participation.json','utf8'));
const training=html.match(/const trainingData=\[([\s\S]*?)\];/);
const extras=html.match(/const additionalActivities=\[([\s\S]*?)\];/);
if(!training||!extras)throw Error('Education source blocks missing');
const base=[...training[1].matchAll(/\['([^']+)','([^']+)','(Yüz yüze|Çevrimiçi)','([^']*)',(\d+)\]/g)]
.map(m=>({date:m[1],city:m[2],mode:m[3],participants:+m[5]}));
const shared=[...extras[1].matchAll(/\['([^']+)','([^']+)','[^']+','(Yüz yüze|Çevrimiçi)',[^\n]*?,(\d+),'completed','([^']+)'\]/g)]
.map(m=>({date:m[1],city:m[2],mode:m[3],participants:+m[4],id:m[5]}));
const groups=new Map();for(const x of shared){if(!groups.has(x.id))groups.set(x.id,[]);groups.get(x.id).push(x)}
const errors=[];const sums=[];
for(const [id,arr] of groups){
 const ref=json.sessions.find(x=>x.id===id);
 if(!ref){errors.push('Missing shared session '+id);continue}
 const unique=[...new Set(arr.map(x=>x.participants))];
 const total=unique.length===1?unique[0]:arr.reduce((n,x)=>n+x.participants,0);
 if(total!==ref.total)errors.push(id+' total '+total+' vs JSON '+ref.total);
 if(unique.length!==1)for(const x of arr)if(ref.provinces[x.city]!==x.participants)errors.push(id+' province '+x.city+' '+x.participants+' vs '+ref.provinces[x.city]);
 if(unique.length===1&&Object.keys(ref.provinces).length!==arr.length)errors.push(id+' province count mismatch');
 if(Object.values(ref.provinces).reduce((a,b)=>a+b,0)!==ref.total)errors.push(id+' province sum differs from total');
 sums.push({id,total,mode:arr[0].mode,cities:arr.map(x=>x.city)});
}
const all=[...base,...sums.map(x=>({mode:x.mode,participants:x.total}))];
const sum=x=>x.reduce((n,a)=>n+a.participants,0);
const result={sessions:all.length,provinces:new Set([...base.map(x=>x.city),...shared.map(x=>x.city)]).size,participants:sum(all),face:sum(all.filter(x=>x.mode==='Yüz yüze')),online:sum(all.filter(x=>x.mode==='Çevrimiçi')),onlineProvinces:new Set([...base.filter(x=>x.mode==='Çevrimiçi').map(x=>x.city),...shared.filter(x=>x.mode==='Çevrimiçi').map(x=>x.city)]).size};
const archive=fs.readFileSync('public/egitimler.html','utf8');
const fmt=n=>n.toLocaleString('tr-TR');
if(!archive.includes('<b>'+fmt(result.participants)+'</b>'))errors.push('Archive total participant count stale');
if(!archive.includes('<b>'+result.sessions+'</b><span>Gerçekleşen eğitim'))errors.push('Archive session count stale');
if(!archive.includes('<b>'+result.provinces+'</b><span>Ulaşılan il'))errors.push('Archive province count stale');
console.log(JSON.stringify({result,errors},null,2));if(errors.length)process.exitCode=1;
