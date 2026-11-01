import fs from 'fs';
import path from 'path';
const origin='https://enetcomproject.com';
const pages=['/','/proje.html','/egitimler.html','/uluslararasi.html','/veritabani.html','/ciktilar.html','/gallery.html','/cop31.html'];
const titles={
 '/':['e-NetCoM | Doğanın Enerjileri Bizimle','e-NetCoM | Environmental Communication and Youth Leadership','e-NetCoM | Umweltkommunikation und Jugendführung'],
 '/proje.html':['e-NetCoM Projesi | Çevresel İletişim ve Genç Liderlik','e-NetCoM Project | Environmental Communication and Youth Leadership','e-NetCoM Projekt | Umweltkommunikation und Jugendführung'],
 '/egitimler.html':['e-NetCoM Eğitimleri | Yüz Yüze ve Çevrimiçi Eğitimler','e-NetCoM Training | In-Person and Online Sustainability Education','e-NetCoM Schulungen | Präsenz- und Online-Bildung'],
 '/uluslararasi.html':['e-NetCoM Uluslararası Faaliyetler','e-NetCoM International Activities','e-NetCoM Internationale Aktivitäten'],
 '/veritabani.html':['e-NetCoM e-Merkez | Çevre ve Sürdürülebilirlik Kaynakları','e-NetCoM e-Centre | Environment and Sustainability Resources','e-NetCoM e-Zentrum | Umwelt und Nachhaltigkeit'],
 '/ciktilar.html':['e-NetCoM Proje Çıktıları | İçerik, Materyal ve Kaynak Merkezi','e-NetCoM Project Outputs | Content, Materials and Resources','e-NetCoM Projektergebnisse | Inhalte, Materialien und Ressourcen'],
 '/gallery.html':['e-NetCoM Etkinlik Galerileri','e-NetCoM Event Galleries','e-NetCoM Veranstaltungsgalerien'],
 '/cop31.html':['COP31 Antalya 2026 | İklim Zirvesi ve Gençlik Rehberi – e-NetCoM','COP31 Antalya 2026 | Climate Summit and Youth Guide – e-NetCoM','COP31 Antalya 2026 | Klimagipfel und Jugendleitfaden – e-NetCoM']
};
const descriptions={
 '/':{
  tr:'e-NetCoM çevresel iletişim, gençlik liderliği, sürdürülebilirlik eğitimleri ve proje çalışmalarını keşfedin.',
  en:'Discover e-NetCoM environmental communication, youth leadership, sustainability training and project activities.',
  de:'Entdecken Sie e-NetCoM: Umweltkommunikation, Jugendführung, Nachhaltigkeitsbildung und Projektaktivitäten.'
 },
 '/proje.html':{
  tr:'e-NetCoM projesinin amaçlarını, ortaklarını ve çevresel iletişim ile gençlik liderliği çalışmalarını inceleyin.',
  en:'Learn about the e-NetCoM project, its partners, environmental communication goals and youth leadership activities.',
  de:'Erfahren Sie mehr über das e-NetCoM-Projekt, seine Partner, Umweltkommunikation und Jugendführung.'
 },
 '/egitimler.html':{
  tr:'e-NetCoM yüz yüze ve çevrimiçi sürdürülebilirlik eğitimlerini, katılımcı bilgilerini ve etkinlik arşivlerini keşfedin.',
  en:'Explore e-NetCoM in-person and online sustainability training, participation figures and event archives.',
  de:'Entdecken Sie e-NetCoM-Präsenz- und Online-Schulungen zu Nachhaltigkeit, Teilnahmezahlen und Veranstaltungsarchive.'
 },
 '/uluslararasi.html':{
  tr:'e-NetCoM uluslararası faaliyetlerini, iş birliklerini ve gençlik odaklı çevresel iletişim çalışmalarını inceleyin.',
  en:'Explore e-NetCoM international activities, partnerships and youth-focused environmental communication.',
  de:'Entdecken Sie internationale e-NetCoM-Aktivitäten, Partnerschaften und jugendorientierte Umweltkommunikation.'
 },
 '/veritabani.html':{
  tr:'e-NetCoM e-Merkez veritabanında 2.449 çevre ve sürdürülebilirlik kaynağını başlık, yazar, konu, tür ve dile göre arayın.',
  en:'Search 2,449 environment and sustainability resources in the e-NetCoM e-Centre database by title, author, topic, type and language.',
  de:'Durchsuchen Sie 2.449 Umwelt- und Nachhaltigkeitsquellen im e-NetCoM e-Zentrum nach Titel, Autor, Thema, Typ und Sprache.'
 },
 '/ciktilar.html':{
  tr:'e-NetCoM proje çıktılarını, eğitim materyallerini, dijital içerikleri ve sürdürülebilirlik kaynaklarını inceleyin.',
  en:'Discover e-NetCoM project outputs, training materials, digital content and sustainability resources.',
  de:'Entdecken Sie e-NetCoM-Projektergebnisse, Schulungsmaterialien, digitale Inhalte und Nachhaltigkeitsressourcen.'
 },
 '/gallery.html':{
  tr:'e-NetCoM eğitim ve etkinlik fotoğraf arşivlerini, program afişlerini ve il bazlı galerileri görüntüleyin.',
  en:'Browse e-NetCoM training and event photo archives, programme posters and galleries by province.',
  de:'Sehen Sie e-NetCoM-Fotoarchive, Programmplakate und Veranstaltungsgalerien nach Provinz.'
 },
 '/cop31.html':{
  tr:'COP31 Antalya 2026 iklim zirvesi hakkında e-NetCoM rehberi, iklim farkındalığı ve gençlik odaklı içerikler.',
  en:'An independent e-NetCoM guide to COP31 Antalya 2026, climate negotiations and youth climate awareness.',
  de:'Ein unabhängiger e-NetCoM-Leitfaden zur COP31 Antalya 2026 und zum Klimabewusstsein junger Menschen.'
 }
};
const desc={en:'Explore e-NetCoM environmental communication, youth leadership, sustainability training and project resources.',de:'Entdecken Sie Umweltkommunikation, Jugendführung, Nachhaltigkeitsschulungen und Projektmaterialien von e-NetCoM.'};
// Cache file contents between requests while picking up changed files automatically.
// This avoids repeatedly reading the large home page and training archive.
const seoFileCache=new Map();
function readSeoFile(file){
 const stat=fs.statSync(file);
 const existing=seoFileCache.get(file);
 if(existing&&existing.mtimeMs===stat.mtimeMs&&existing.size===stat.size)return existing.text;
 const value=fs.readFileSync(file,'utf8');
 if(seoFileCache.size>=24)seoFileCache.clear();
 seoFileCache.set(file,{mtimeMs:stat.mtimeMs,size:stat.size,text:value});
 return value;
}
// Training records are read from the existing archive; no duplicate SEO data is maintained.
function trainingGalleryDetails(dir,city){
  if(!city)return null;
  try{
    const source=readSeoFile(path.join(dir,'public','egitimler.html'));
    const norm=v=>String(v).replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().toLocaleLowerCase('tr-TR');
    for(const match of source.matchAll(/<article class="record (face|online)"[^>]*>([\s\S]*?)<\/article>/g)){
      const body=match[2],name=body.match(/<h3>([^<]+)<\/h3>/)?.[1];
      if(!name)continue;
      // A joint training record covers multiple cities; do not miss its
      // participants merely because the heading lists several provinces.
      const members=name.replace(/&amp;/g,'&').split(' · ')[0]
        .replace(/\s+ve\s+/gi,',').split(/\s*[&,]\s*/).map(norm);
      if(!members.includes(norm(city)))continue;
      return {type:match[1],shared:members.length>1,date:body.match(/<p>([^<]*2026)<\/p>/)?.[1]||'',people:body.match(/<div class="people">([^<]*)<\/div>/)?.[1]||''};
    }
  }catch{}
  return null;
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Render a small, factual preview of the existing e-Centre catalogue in the
// initial HTML. The interactive browser search replaces this after JSON loads.
let databasePreviewCache=null;
function databasePreview(dir,lang){
  if(databasePreviewCache===null){
    try{
      const data=JSON.parse(readSeoFile(path.join(dir,'public','assets','database','database.json')));
      const items=Array.isArray(data)?data:(Array.isArray(data.items)?data.items:[]);
      databasePreviewCache=items.slice(0,10);
    }catch{
      databasePreviewCache=[];
    }
  }
  const sourceLabel=lang==='en'?'Open original source':lang==='de'?'Originalquelle öffnen':'Özgün kaynağı aç';
  return databasePreviewCache.map(item=>{
    const title=esc(item.title||'e-NetCoM');
    const author=item.author?'<strong>'+esc(item.author)+'</strong>':'';
    const description=item.description?'<p>'+esc(String(item.description).slice(0,320))+'</p>':'';
    const tags=[item.content_type,item.topic,item.lang,item.year].filter(Boolean)
      .map(value=>'<span class="tag">'+esc(value)+'</span>').join('');
    const link=typeof item.url==='string' && /^https?:\/\//i.test(item.url)
      ?'<a href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer">'+sourceLabel+' ↗</a>':'';
    return '<article class="item"><div class="tags">'+tags+'</div><h2>'+title+'</h2>'+author+description+link+'</article>';
  }).join('');
}
// Read the public e-Centre catalogue once per file revision, sharing the cache
// between the interactive page's preview and the crawlable source index.
let resourceIndexCache=null;
function resourceIndex(dir){
  try{
    const file=path.join(dir,'public','assets','database','database.json');
    const stat=fs.statSync(file);
    if(!resourceIndexCache||resourceIndexCache.mtimeMs!==stat.mtimeMs||resourceIndexCache.size!==stat.size){
      const parsed=JSON.parse(readSeoFile(file));
      resourceIndexCache={mtimeMs:stat.mtimeMs,size:stat.size,items:Array.isArray(parsed)?parsed:(Array.isArray(parsed.items)?parsed.items:[])};
    }
    return resourceIndexCache.items;
  }catch{return [];}
}
function resourceCatalogueHtml(dir,lang,page){
  const items=resourceIndex(dir),perPage=60,totalPages=Math.ceil(items.length/perPage);
  if(!totalPages||page<1||page>totalPages)return null;
  const labels={
    tr:{title:'e-NetCoM E-Merkez Kaynak Dizini',intro:'Çevre ve sürdürülebilirlik araştırma kaynaklarını sayfa sayfa keşfedin. Ayrıntılı filtreleme için E-Merkez aramasını kullanın.',source:'Özgün kaynağı aç',back:'E-Merkez aramasına dön',previous:'Önceki sayfa',next:'Sonraki sayfa',page:'Sayfa',of:'/',count:'kaynak'},
    en:{title:'e-NetCoM e-Centre Resource Index',intro:'Browse environmental and sustainability research resources. Use the e-Centre search for detailed filtering.',source:'Open original source',back:'Back to e-Centre search',previous:'Previous page',next:'Next page',page:'Page',of:'of',count:'resources'},
    de:{title:'e-NetCoM e-Zentrum Quellenverzeichnis',intro:'Entdecken Sie Umwelt- und Nachhaltigkeitsquellen. Die detaillierte Suche finden Sie im e-Zentrum.',source:'Originalquelle öffnen',back:'Zurück zur e-Zentrum-Suche',previous:'Vorherige Seite',next:'Nächste Seite',page:'Seite',of:'von',count:'Quellen'}
  };
  const L=labels[lang],urlFor=(p,l=lang)=>{
    const u=new URL('/kaynaklar.html',origin);
    if(p>1)u.searchParams.set('page',String(p));
    if(l!=='tr')u.searchParams.set('lang',l);
    return u.href;
  };
  const canonical=urlFor(page),start=(page-1)*perPage;
  const cards=items.slice(start,start+perPage).map(item=>{
    const title=esc(item.title||'e-NetCoM');
    const author=item.author?'<span>'+esc(item.author)+'</span>':'';
    const summary=item.description?'<p>'+esc(String(item.description).slice(0,350))+'</p>':'';
    const meta=[item.content_type,item.topic,item.lang,item.year].filter(Boolean).map(esc).join(' · ');
    const link=typeof item.url==='string'&&/^https?:\/\//i.test(item.url)
      ?'<a href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer">'+L.source+' ↗</a>':'';
    return '<article><h2>'+title+'</h2><div class="meta">'+meta+'</div>'+author+summary+link+'</article>';
  }).join('');
  const nav='<nav aria-label="Pagination">'+(page>1?'<a href="'+esc(urlFor(page-1))+'">← '+L.previous+'</a>':'')+
    '<span>'+L.page+' '+page+' '+L.of+' '+totalPages+'</span>'+
    (page<totalPages?'<a href="'+esc(urlFor(page+1))+'">'+L.next+' →</a>':'')+'</nav>';
  const alternate=['tr','en','de','x-default'].map(l=>'<link rel="alternate" hreflang="'+l+'" href="'+esc(urlFor(page,l==='x-default'?'tr':l))+'">').join('');
  const title=L.title+' – '+L.page+' '+page;
  const schema={'@context':'https://schema.org','@type':'CollectionPage','@id':canonical+'#webpage',url:canonical,name:title,inLanguage:lang,isPartOf:{'@id':origin+'/#website'}};
  const searchUrl='/veritabani.html'+(lang==='tr'?'':'?lang='+lang);
  return '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+esc(title)+'</title><meta name="description" content="'+esc(L.intro)+'"><link rel="canonical" href="'+esc(canonical)+'">'+alternate+
    '<script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>'+
    '<style>*{box-sizing:border-box}body{margin:0;background:#f5f9f6;color:#153c2f;font:16px/1.6 system-ui,Arial,sans-serif}main{max-width:1040px;margin:auto;padding:28px 20px 64px}h1{font-size:clamp(1.7rem,4vw,2.5rem);line-height:1.2}h2{font-size:1.15rem;line-height:1.35;margin:0 0 8px}article{background:#fff;border:1px solid #dce9df;border-radius:12px;padding:18px;margin:14px 0;overflow-wrap:anywhere}article p{margin:8px 0}a{color:#126c50}a:focus-visible{outline:3px solid #177c5e;outline-offset:3px}.meta{color:#526e60;font-size:.9rem;margin-bottom:8px}nav{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px;margin:26px 0}nav a{background:#e0f2e8;padding:9px 13px;border-radius:8px}header{padding-bottom:12px;border-bottom:2px solid #dce9df}</style>'+
    '</head><body><main><header><a href="'+esc(searchUrl)+'">← '+L.back+'</a><h1>'+L.title+'</h1><p>'+L.intro+'</p><p><strong>'+items.length.toLocaleString(lang==='tr'?'tr-TR':lang==='de'?'de-DE':'en-US')+' '+L.count+'</strong></p></header>'+
    nav+cards+nav+'</main></body></html>';
}
export function installSeo(app,dir){
 // Crawlable, paginated source index: no change to homepage layout.
 app.get('/kaynaklar.html',(req,res)=>{
  const lang=['en','de'].includes(req.query.lang)?req.query.lang:'tr';
  const raw=req.query.page;
  if(raw!==undefined&&(typeof raw!=='string'||!/^\d+$/.test(raw)))return res.sendStatus(404);
  const page=raw===undefined?1:Number(raw);
  if(!Number.isSafeInteger(page)||page<1)return res.sendStatus(404);
  const html=resourceCatalogueHtml(dir,lang,page);
  if(!html)return res.sendStatus(404);
  res.type('html').send(html);
 });

 // The verification key stays in Render configuration, outside Git history.
 app.get('/indexnow-key.txt',(req,res)=>{
  const key=process.env.INDEXNOW_KEY?.trim();
  res.set('X-Robots-Tag','noindex');
  if(!key||! /^[a-zA-Z0-9-]{8,128}$/.test(key))return res.sendStatus(404);
  res.type('text/plain').send(key);
 });
 app.use((req,res,next)=>{
  res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN','Permissions-Policy':'camera=(), microphone=(), geolocation=()'});
  if(req.path.startsWith('/qa/')||req.path.startsWith('/api/admin/')||['/yonetim','/yonetim.html'].includes(req.path))res.set('X-Robots-Tag','noindex, nofollow');
  if(req.path==='/index.html')return res.redirect(301,'/'+req.url.slice('/index.html'.length));
  next();
 });
 // Only published gallery locations should create indexable SEO URLs.
 // This list is derived from the sitemap to avoid maintaining a second city registry.
 const knownGalleryCities=new Map();
 try{
  const sitemap=readSeoFile(path.join(dir,'public','sitemap.xml'));
  for(const m of sitemap.matchAll(/<loc>([^<]*\/gallery\.html\?city=[^<]+)<\/loc>/g)){
   const c=new URL(m[1].replace(/&amp;/g,'&')).searchParams.get('city');
   if(c&&!knownGalleryCities.has(c.toLocaleLowerCase('tr-TR')))knownGalleryCities.set(c.toLocaleLowerCase('tr-TR'),c);
  }
 }catch{}
 app.get(pages,(req,res)=>{
  const lang=['en','de'].includes(req.query.lang)?req.query.lang:'tr', li=['tr','en','de'].indexOf(lang);
  const canonical=new URL(req.path,origin);
  const requestedGalleryCity=req.path==='/gallery.html'&&typeof req.query.city==='string'?req.query.city.slice(0,100).trim():null;
  const galleryCity=requestedGalleryCity?(knownGalleryCities.size?knownGalleryCities.get(requestedGalleryCity.toLocaleLowerCase('tr-TR')):requestedGalleryCity):null;
  if(requestedGalleryCity&&knownGalleryCities.size&&!galleryCity)res.set('X-Robots-Tag','noindex, follow');
  if(galleryCity)canonical.searchParams.set('city',galleryCity);
  if(lang!=='tr')canonical.searchParams.set('lang',lang);
  const file=req.path==='/'?'index.html':req.path.slice(1);
  const localized=path.join(dir,'.cache','localized',lang,file);
  let html=readSeoFile(lang!=='tr'&&fs.existsSync(localized)?localized:path.join(dir,'public',file));
  if(req.path==='/veritabani.html'){
    const preview=databasePreview(dir,lang);
    if(preview)html=html.replace('<div id="results"></div>','<div id="results">'+preview+'</div>');
    const indexLabel=lang==='en'?'Browse all sources (paginated)':lang==='de'?'Alle Quellen im Verzeichnis entdecken':'Tüm kaynakları sayfa sayfa keşfet';
    const indexHref='/kaynaklar.html'+(lang==='tr'?'':'?lang='+lang);
    html=html.replace('<div id="results">','<p style="margin:12px 0"><a href="'+indexHref+'">'+indexLabel+' →</a></p><div id="results">');
  }
  let title=titles[req.path]?.[li] || (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'e-NetCoM');
  const galleryDetails=galleryCity?trainingGalleryDetails(dir,galleryCity):null;
  if(galleryCity)title=galleryCity+' | '+title;
  // Include a crawlable city heading without altering the client-side gallery controls.
  if(galleryCity){
    const label=lang==='en'?'Event Gallery':lang==='de'?'Veranstaltungsgalerie':'Etkinlik Galerisi';
    const marker='<h1 id="title">Eğitim Programı</h1>';
    html=html.replace(marker,'<h1 id="title">'+esc(galleryCity+' · '+label)+'</h1>');
  }
  html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+esc(title)+'</title>');
  html=html.replace(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/gi,'');
  html=html.replace(/<link\b(?=[^>]*rel=["']alternate["'])(?=[^>]*hreflang=)[^>]*>/gi,'');
  html=html.replace(/<script\b[^>]*id=["']enetcom-seo-language-canonical["'][^>]*>[\s\S]*?<\/script>/gi,'');
  html=html.replace(/<meta\b(?=[^>]*(?:property|name)=["'](?:og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi,'');
  // Localized documents retain their page-specific translated descriptions.
  let description=descriptions[req.path]?.[lang] || desc[lang] || descriptions['/'].tr;
  if(galleryDetails){
    const mode=galleryDetails.type==='face'?{tr:'yüz yüze',en:'in-person',de:'Präsenz'}:{tr:'çevrimiçi',en:'online',de:'Online'};
    const participants=galleryDetails.people;
    if(galleryDetails.shared){
      description=lang==='en'
        ?'e-NetCoM joint '+mode.en+' training including '+galleryCity+' on '+galleryDetails.date+' ('+participants+' across the joint session). Photos and programme.'
        :lang==='de'
        ?'e-NetCoM: Gemeinsame '+mode.de+'-Schulung mit '+galleryCity+' am '+galleryDetails.date+' ('+participants+' insgesamt). Fotos und Programm.'
        :'e-NetCoM '+galleryCity+' ilini de kapsayan '+galleryDetails.date+' tarihli ortak '+mode.tr+' eğitim ('+participants+' toplam katılımcı). Fotoğraflar ve program.';
    }else{
      description=lang==='en'
        ?'e-NetCoM '+galleryCity+' '+mode.en+' training on '+galleryDetails.date+' ('+participants+'). Explore event photos and programme materials.'
        :lang==='de'
        ?'e-NetCoM '+galleryCity+': '+mode.de+'-Schulung am '+galleryDetails.date+' ('+participants+'). Fotos und Programmmaterialien.'
        :'e-NetCoM '+galleryCity+' '+mode.tr+' eğitimi: '+galleryDetails.date+', '+participants+'. Etkinlik fotoğrafları ve program akışı.';
    }
  }
  // Replace existing meta description or insert it when absent.
  html=html.replace(/<meta\s+name=["']description["'][^>]*>/gi,'');
  html=html.replace('</head>','<meta name="description" content="'+esc(description)+'"></head>');

  html=html.replace(/<html\b[^>]*>/i,tag=>tag.replace(/lang=["'][^"']*["']/i,'lang="'+lang+'"'));
  let tags='<link rel="canonical" href="'+esc(canonical.href)+'">';
  for(const l of ['tr','en','de','x-default']){const u=new URL(canonical);u.searchParams.delete('lang');if(l==='en'||l==='de')u.searchParams.set('lang',l);tags+='<link rel="alternate" hreflang="'+l+'" href="'+esc(u.href)+'">';}
  for(const [k,v] of Object.entries({'og:type':'website','og:site_name':'e-NetCoM','og:title':title,'og:description':description,'og:url':canonical.href,'og:locale':{tr:'tr_TR',en:'en_GB',de:'de_DE'}[lang],'og:image':origin+(req.path==='/cop31.html'?'/assets/optimized/hero-1600.webp':'/thumbs/01.jpg'),'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':origin+(req.path==='/cop31.html'?'/assets/optimized/hero-1600.webp':'/thumbs/01.jpg')}))tags+='<meta '+(k.startsWith('twitter:')?'name':'property')+'="'+k+'" content="'+esc(v)+'">';
  html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,raw)=>{try{const data=JSON.parse(raw);if(data.url===origin+req.path){data.url=canonical.href;data.inLanguage=lang;if(data['@id'] && ['WebPage','CollectionPage'].includes(data['@type']))data['@id']=canonical.href+'#webpage';}return '<script type="application/ld+json">'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script>';}catch{return tag;}});
  // Page-level structured data: language-aware WebPage and breadcrumb trail.
  // Does not replace existing Project, WebSite or event structured data.
  const homeUrl=new URL('/',origin);
  if(lang!=='tr')homeUrl.searchParams.set('lang',lang);
  const webpage={
    '@context':'https://schema.org',
    '@type':'WebPage',
    '@id':canonical.href+'#webpage',
    url:canonical.href,
    name:title,
    description,
    inLanguage:lang,
    isPartOf:{'@id':origin+'/#website'}
  };
  const breadcrumbs={
    '@context':'https://schema.org',
    '@type':'BreadcrumbList',
    itemListElement:[
      {'@type':'ListItem',position:1,name:lang==='tr'?'Ana Sayfa':lang==='de'?'Startseite':'Home',item:homeUrl.href},
      ...(req.path==='/'?[]:[{'@type':'ListItem',position:2,name:title,item:canonical.href}])
    ]
  };
  const schemaTags=(req.path==='/'?[webpage]:[webpage,breadcrumbs]).map(obj=>'<script type="application/ld+json">'+JSON.stringify(obj).replace(/</g,'\\u003c')+'</script>').join('');
  html=html.replace('</head>',tags+schemaTags+'<script src="/seo.js" defer></script><script src="/consent.js" defer></script>' + (req.path==='/'?'<script src="/province-participation.js" defer></script>':'') + '</head>');
  if(req.path==='/gallery.html'&&!req.query.city){
    // One registry for sitemap, canonical URLs, and the browsable archive index.
    const cities=[...knownGalleryCities.values()].sort((a,b)=>a.localeCompare(b,'tr'));
    const heading=lang==='en'?'Browse event galleries':lang==='de'?'Veranstaltungsgalerien entdecken':'Etkinlik galerilerini keşfedin';
    const intro=lang==='en'?'Browse published training and international event archives.':lang==='de'?'Entdecken Sie veröffentlichte Schulungs- und internationale Veranstaltungsarchive.':'Yayımlanan eğitim ve uluslararası etkinlik arşivlerine göz atın.';
    const links=cities.map(c=>'<li><a href="/gallery.html?city='+encodeURIComponent(c)+(lang==='tr'?'':'&amp;lang='+lang)+'">'+esc(c)+'</a></li>').join('');
    const listing='<div class="notice"><h2>'+heading+'</h2><p>'+intro+'</p><ul style="columns:3;column-width:160px;line-height:2;padding-left:24px">'+links+'</ul></div>';
    html=html.replace(/<div class="loading" id="loading">[^<]*<\/div>/,listing);
    const itemList={'@context':'https://schema.org','@type':'ItemList','name':heading,'itemListElement':cities.map((c,i)=>({'@type':'ListItem',position:i+1,name:c,url:origin+'/gallery.html?city='+encodeURIComponent(c)+(lang==='tr'?'':'&lang='+lang)}))};
    html=html.replace('</head>','<script type="application/ld+json">'+JSON.stringify(itemList).replace(/</g,'\\u003c')+'</script></head>');
  }

  // Keep HTML rendering stable; do not apply malformed regex cleanup here.
  res.type('html').send(html);
 });
}
