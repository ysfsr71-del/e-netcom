import {JSDOM,VirtualConsole} from 'jsdom';import fs from 'fs';
const pages=['index','proje','egitimler','uluslararasi','veritabani','ciktilar'];let failures=[];const rows=[];
for(const name of pages)for(const lang of ['en','de']){
 const file='.cache/localized/'+lang+'/'+name+'.html';let source=fs.readFileSync(file,'utf8');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(source,{url:'https://enetcomproject.com/'+(name==='index'?'':name+'.html')+'?lang='+lang,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.IntersectionObserver=class{observe(){}disconnect(){}};w.matchMedia=()=>({matches:false});w.setInterval=()=>0;w.scrollTo=()=>{};w.fetch=async()=>({ok:true,json:async()=>[],text:async()=>'<svg></svg>'});w.requestIdleCallback=()=>0;}});
 await new Promise(r=>dom.window.addEventListener('load',()=>setTimeout(r,20),{once:true}));const d=dom.window.document;const rawH1=new JSDOM(source).window.document.querySelector('h1').textContent;
 const values={};for(const l of ['tr','en','de']){d.querySelector('[data-lang-switch="'+l+'"],button[data-lang="'+l+'"]').click();values[l]=d.querySelector('h1').textContent;}
 if(values.tr===values.en||values.tr===values.de||errors.length)failures.push({name,lang,values,errors});rows.push({name,lang,rawH1,values,errors});dom.window.close();
}
fs.writeFileSync('../audit/v2/ssr-tests.json',JSON.stringify(rows,null,2));console.log('12 SSR hydration cases',failures.length?'FAIL':'PASS');if(failures.length){console.log(failures);process.exit(1)}
