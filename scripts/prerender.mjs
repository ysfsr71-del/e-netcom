import {JSDOM,VirtualConsole} from 'jsdom';
import fs from 'fs';import path from 'path';
const root=path.resolve('public');
const files=['index.html','proje.html','egitimler.html','uluslararasi.html','veritabani.html','ciktilar.html'];
const capture=`<script id="ssr-capture">window.__ssrOriginal=new Map();{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())if(!n.parentElement.closest('script,style'))window.__ssrOriginal.set(n,n.nodeValue);}</script>`;
const boot=`<script id="ssr-restore">window.__enetcomOriginalText=new WeakMap();document.querySelectorAll('[data-ssr-text]').forEach(el=>{JSON.parse(el.getAttribute('data-ssr-text')).forEach(([i,t])=>{const n=el.childNodes[i];if(n&&n.nodeType===3)window.__enetcomOriginalText.set(n,t)});el.removeAttribute('data-ssr-text')});</script>`;
for(const file of files){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 for(const lang of ['en','de']){
  const bodyStart=source.indexOf('<body');const pos=source.indexOf('<script',bodyStart);
  const input=source.slice(0,pos)+capture+source.slice(pos);
  const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(input,{url:'https://enetcomproject.com/'+(file==='index.html'?'':file)+'?lang='+lang,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
   w.localStorage.setItem('enetcom_lang',lang);
   w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
   w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};
   w.scrollTo=()=>{};w.setInterval=()=>0;
   w.requestIdleCallback=cb=>w.setTimeout(()=>cb({timeRemaining:()=>50}),0);
   w.fetch=async u=>{const p=path.join(root,String(u).split('?')[0].replace(/^\//,''));let data=fs.existsSync(p)&&fs.statSync(p).isFile()?fs.readFileSync(p,'utf8'):'[]';return {ok:true,status:200,text:async()=>data,json:async()=>JSON.parse(data)}};
  }});
  await new Promise(resolve=>dom.window.addEventListener('load',()=>setTimeout(resolve,80),{once:true}));
  const d=dom.window.document;
  for(const [n,t] of dom.window.__ssrOriginal){if(!n.parentElement||!n.isConnected||n.nodeValue===t)continue;const el=n.parentElement;let arr=JSON.parse(el.getAttribute('data-ssr-text')||'[]');arr.push([Array.from(el.childNodes).indexOf(n),t]);el.setAttribute('data-ssr-text',JSON.stringify(arr));}
  d.getElementById('ssr-capture')?.remove();
  // Transient UI state is never serialized. Data and the original client scripts remain intact.
  d.documentElement.lang=lang;
  let html=dom.serialize();const start=html.indexOf('<script',html.indexOf('<body'));html=html.slice(0,start)+boot+html.slice(start);
  const out=path.resolve('.cache','localized',lang);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,file),html);
  console.log(file,lang,'H1:',d.querySelector('h1')?.textContent.trim(),'errors:',errors.length);
  if(errors.length)console.log(errors.slice(0,3));dom.window.close();
 }
}

const media={};function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.name.startsWith('.')||entry.name==='localized'||entry.name==='qa')continue;const p=path.join(dir,entry.name);if(entry.isDirectory())scan(p);else if(/\.(jpe?g|png|webp|avif|pdf)$/i.test(entry.name)){const folder=path.relative(root,dir).split(path.sep).join('/');(media[folder] ||= []).push({name:entry.name,type:'file'});}}}scan(root);fs.writeFileSync(path.join(root,'gallery-manifest.json'),JSON.stringify(media));
