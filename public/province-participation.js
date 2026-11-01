(function(){
const dataUrl='/shared-training-participation.json';
const norm=s=>String(s||'').trim().toLocaleLowerCase('tr-TR');
let sessions=[];
fetch(dataUrl,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{
 sessions=d.sessions||[];
 const title=document.getElementById('cityTitle');
 const root=title?.closest('.map-info')||title?.parentElement?.parentElement;
 if(!title||!root)return;
 const update=()=>{
  const city=title.textContent.trim();
  const match=sessions.find(x=>Object.keys(x.provinces).some(p=>norm(p)===norm(city)));
  root.querySelectorAll('.province-participation-detail').forEach(x=>x.remove());
  if(!match)return;
  const n=Object.entries(match.provinces).find(([p])=>norm(p)===norm(city))?.[1];
  if(!Number.isInteger(n))return;
  const cards=root.querySelectorAll('.map-activity-card');
  for(const card of cards){
   if(!card.textContent.includes(String(match.total)))continue;
   const line=document.createElement('div');
   line.className='info-row province-participation-detail';
   const lang=document.documentElement.lang||'tr';
   const label=lang==='en'?'Province participation':lang==='de'?'Teilnehmende aus der Provinz':'İl katılımı';
   const person=lang==='en'?'people':lang==='de'?'Personen':'kişi';
   const left=document.createElement('span');left.textContent=label;
   const right=document.createElement('b');right.textContent=n+' '+person;
   line.append(left,right);
   const rows=card.querySelectorAll('.info-row');
   if(rows.length)rows[0].after(line);else card.append(line);
  }
 };
 const observer=new MutationObserver(()=>{observer.disconnect();update();observer.observe(root,{childList:true,subtree:true,characterData:true});});
 observer.observe(root,{childList:true,subtree:true,characterData:true});
 update();
}).catch(()=>{});
})();
