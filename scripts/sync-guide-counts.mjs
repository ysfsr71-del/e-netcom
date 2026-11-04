// Synchronize static guide counts from cards; draft/noindex pages are excluded.
// Usage: node scripts/sync-guide-counts.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
const check=process.argv.includes('--check');
const root=path.resolve('public');
const guides=[
 {file:'rehber/index.html',prefix:'/rehber/',label:n=>`${n} konuda çevre okuryazarlığı ve sürdürülebilir yaşam`,og:n=>`${n} konu ile sürdürülebilir yaşam, iklim ve çevre okuryazarlığı.`},
 {file:'en/guide/index.html',prefix:'/en/guide/',label:n=>`${n} topics on environmental literacy and sustainable living`,og:n=>`${n} topics on sustainable living, climate and environmental literacy.`},
 {file:'de/ratgeber/index.html',prefix:'/de/ratgeber/',label:n=>`${n} Themen zu Umweltkompetenz und nachhaltigem Leben`,og:n=>`${n} Themen zu nachhaltigem Leben, Klima und Umweltkompetenz.`}
];
let failed=false;
for(const g of guides){
 const file=path.join(root,g.file);const source=fs.readFileSync(file,'utf8');
 const cards=[...source.matchAll(/<a\b[^>]*>/gi)].map(m=>m[0]).filter(tag=>/\bclass\s*=\s*["\x27][^"\x27]*\bstory\b/i.test(tag)).map(tag=>{const href=tag.match(/\bhref\s*=\s*["\x27]([^"\x27]+)["\x27]/i);if(!href)throw Error(`Guide card without href: ${g.file}`);return href[1];});
 const unique=new Set();let n=0;
 for(const href of cards){
  if(unique.has(href))throw Error(`Duplicate guide card: ${g.file}: ${href}`);
  unique.add(href);
  if(!href.startsWith(g.prefix)||!/^\/[a-z0-9/-]+\/$/.test(href)||href.includes('..'))throw Error(`Unexpected guide URL: ${href}`);
  const target=path.join(root,decodeURIComponent(href).replace(/^\//,''),'index.html');
  if(!fs.existsSync(target))throw Error(`Missing article for card: ${href}`);
  const html=fs.readFileSync(target,'utf8');
  const robotsTags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
  const isDraft=robotsTags.some(tag=>/\bname\s*=\s*["']robots["']/i.test(tag)&&/\bcontent\s*=\s*["'][^"']*\bnoindex\b/i.test(tag));
  if(isDraft)continue;
  n++;
 }
 // Cards for unpublished drafts must never count as published.
 const p=source.match(/(<div class="toolbar"[^>]*><div><h2>[^<]*<\/h2><p>)([^<]*)(<\/p>)/);
 if(!p)throw Error(`Missing count text: ${g.file}`);
 let output=source.replace(p[0],p[1]+g.label(n)+p[3]);
 const og=/<meta property="og:description" content="[^"]*">/;
 if(og.test(output))output=output.replace(og,`<meta property="og:description" content="${g.og(n)}">`);
 else output=output.replace('</head>',`<meta property="og:description" content="${g.og(n)}"></head>`);
 if(check){
  if(output!==source){console.error(`OUT OF SYNC ${g.file}: published=${n}, cards=${cards.length}`);failed=true;}
  else console.log(`OK ${g.file}: published=${n}, cards=${cards.length}`);
 }else{if(output!==source)fs.writeFileSync(file,output);console.log(`SYNC ${g.file}: published=${n}, cards=${cards.length}`);}
}
if(failed)process.exitCode=1;
