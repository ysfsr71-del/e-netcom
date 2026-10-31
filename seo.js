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
  tr:'e-NetCoM e-Merkez çevre, sürdürülebilirlik ve çevresel iletişim konularında kaynak ve materyaller sunar.',
  en:'Browse e-NetCoM e-Centre resources and materials on the environment, sustainability and environmental communication.',
  de:'Finden Sie im e-NetCoM e-Zentrum Materialien zu Umwelt, Nachhaltigkeit und Umweltkommunikation.'
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
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function installSeo(app,dir){
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
 app.get(pages,(req,res)=>{
  const lang=['en','de'].includes(req.query.lang)?req.query.lang:'tr', li=['tr','en','de'].indexOf(lang);
  const canonical=new URL(req.path,origin);
  if(req.path==='/gallery.html' && typeof req.query.city==='string')canonical.searchParams.set('city',req.query.city.slice(0,100));
  if(lang!=='tr')canonical.searchParams.set('lang',lang);
  const file=req.path==='/'?'index.html':req.path.slice(1);
  const localized=path.join(dir,'.cache','localized',lang,file);
  let html=fs.readFileSync(lang!=='tr'&&fs.existsSync(localized)?localized:path.join(dir,'public',file),'utf8');
  let title=titles[req.path]?.[li] || (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'e-NetCoM');
  if(req.path==='/gallery.html'&&req.query.city)title=String(req.query.city).slice(0,100)+' | '+title;
  html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+esc(title)+'</title>');
  html=html.replace(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/gi,'');
  html=html.replace(/<link\b(?=[^>]*rel=["']alternate["'])(?=[^>]*hreflang=)[^>]*>/gi,'');
  html=html.replace(/<script\b[^>]*id=["']enetcom-seo-language-canonical["'][^>]*>[\s\S]*?<\/script>/gi,'');
  html=html.replace(/<meta\b(?=[^>]*(?:property|name)=["'](?:og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi,'');
  // Localized documents retain their page-specific translated descriptions.
  const description=descriptions[req.path]?.[lang] || desc[lang] || descriptions['/'].tr;
  // Replace existing meta description or insert it when absent.
  html=html.replace(/<meta\\s+name=["']description["'][^>]*>/gi,'');
  html=html.replace('</head>','<meta name="description" content="'+esc(description)+'"></head>');

  html=html.replace(/<html\b[^>]*>/i,tag=>tag.replace(/lang=["'][^"']*["']/i,'lang="'+lang+'"'));
  let tags='<link rel="canonical" href="'+esc(canonical.href)+'">';
  for(const l of ['tr','en','de','x-default']){const u=new URL(canonical);u.searchParams.delete('lang');if(l==='en'||l==='de')u.searchParams.set('lang',l);tags+='<link rel="alternate" hreflang="'+l+'" href="'+esc(u.href)+'">';}
  for(const [k,v] of Object.entries({'og:type':'website','og:site_name':'e-NetCoM','og:title':title,'og:description':description,'og:url':canonical.href,'og:locale':{tr:'tr_TR',en:'en_GB',de:'de_DE'}[lang],'og:image':origin+(req.path==='/cop31.html'?'/assets/optimized/hero-1600.webp':'/thumbs/01.jpg'),'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':origin+(req.path==='/cop31.html'?'/assets/optimized/hero-1600.webp':'/thumbs/01.jpg')}))tags+='<meta '+(k.startsWith('twitter:')?'name':'property')+'="'+k+'" content="'+esc(v)+'">';
  html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,raw)=>{try{const data=JSON.parse(raw);if(data.url===origin+req.path){data.url=canonical.href;data.inLanguage=lang;if(data['@id'])data['@id']=canonical.href+'#page';}return '<script type="application/ld+json">'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script>';}catch{return tag;}});
  html=html.replace('</head>',tags+'<script src="/seo.js" defer></script><script src="/consent.js" defer></script></head>');
  if(req.path==='/gallery.html'&&!req.query.city){
   const cities=['Kayseri','Ankara','İstanbul','İzmir','Balıkesir','Tunceli','Viyana'];
   html=html.replace(/<div class="loading" id="loading">[^<]*<\/div>/,'<div class="notice">'+cities.map(c=>'<p><a href="/gallery.html?city='+encodeURIComponent(c)+'&amp;lang='+lang+'">'+esc(c)+'</a></p>').join('')+'</div>');
  }

  // Keep HTML rendering stable; do not apply malformed regex cleanup here.
  res.type('html').send(html);
 });
}
