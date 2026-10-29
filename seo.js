import fs from 'fs';
import path from 'path';
const origin='https://enetcomproject.com';
const pages=['/','/proje.html','/egitimler.html','/uluslararasi.html','/veritabani.html','/ciktilar.html','/gallery.html'];
const titles={
 '/':['e-NetCoM | Doğanın Enerjileri Bizimle','e-NetCoM | Environmental Communication and Youth Leadership','e-NetCoM | Umweltkommunikation und Jugendführung'],
 '/proje.html':['e-NetCoM Projesi | Çevresel İletişim ve Genç Liderlik','e-NetCoM Project | Environmental Communication and Youth Leadership','e-NetCoM Projekt | Umweltkommunikation und Jugendführung'],
 '/egitimler.html':['e-NetCoM Eğitimleri | 32 İl ve 1.604 Katılımcı','e-NetCoM Training | 30 Sessions, 32 Provinces, 1,604 Participants','e-NetCoM Schulungen | 30 Schulungen, 32 Provinzen, 1.604 Teilnehmende'],
 '/uluslararasi.html':['e-NetCoM Uluslararası Faaliyetler','e-NetCoM International Activities','e-NetCoM Internationale Aktivitäten'],
 '/veritabani.html':['e-NetCoM e-Merkez | Çevre ve Sürdürülebilirlik Kaynakları','e-NetCoM e-Centre | Environment and Sustainability Resources','e-NetCoM e-Zentrum | Umwelt und Nachhaltigkeit'],
 '/ciktilar.html':['e-NetCoM Proje Çıktıları | İçerik, Materyal ve Kaynak Merkezi','e-NetCoM Project Outputs | Content, Materials and Resources','e-NetCoM Projektergebnisse | Inhalte, Materialien und Ressourcen'],
 '/gallery.html':['e-NetCoM Etkinlik Galerileri','e-NetCoM Event Galleries','e-NetCoM Veranstaltungsgalerien']
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
  let title=html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||titles[req.path][li];
  if(req.path==='/gallery.html'&&req.query.city)title=String(req.query.city).slice(0,100)+' | '+title;
  html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+esc(title)+'</title>');
  html=html.replace(/<link\b(?=[^>]*rel=["']canonical["'])[^>]*>/gi,'');
  html=html.replace(/<meta\b(?=[^>]*(?:property|name)=["'](?:og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi,'');
  // Localized documents retain their page-specific translated descriptions.
  const description=html.match(/<meta name="description" content="([^"]*)"/i)?.[1]||'';
  let tags='<link rel="canonical" href="'+esc(canonical.href)+'">';
  for(const l of ['tr','en','de','x-default']){const u=new URL(canonical);u.searchParams.delete('lang');if(l==='en'||l==='de')u.searchParams.set('lang',l);tags+='<link rel="alternate" hreflang="'+l+'" href="'+esc(u.href)+'">';}
  for(const [k,v] of Object.entries({'og:type':'website','og:site_name':'e-NetCoM','og:title':title,'og:description':description,'og:url':canonical.href,'og:locale':{tr:'tr_TR',en:'en_GB',de:'de_DE'}[lang],'og:image':origin+'/thumbs/01.jpg','twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':origin+'/thumbs/01.jpg'}))tags+='<meta '+(k.startsWith('twitter:')?'name':'property')+'="'+k+'" content="'+esc(v)+'">';
  html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(tag,raw)=>{try{const data=JSON.parse(raw);if(data.url===origin+req.path){data.url=canonical.href;data.inLanguage=lang;if(data['@id'])data['@id']=canonical.href+'#page';}return '<script type="application/ld+json">'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script>';}catch{return tag;}});
  html=html.replace('</head>',tags+'<script src="/seo.js" defer></script><script src="/consent.js" defer></script></head>');
  if(req.path==='/gallery.html'&&!req.query.city){
   const cities=['Kayseri','Ankara','İstanbul','İzmir','Balıkesir','Tunceli','Viyana'];
   html=html.replace(/<div class="loading" id="loading">[^<]*<\/div>/,'<div class="notice">'+cities.map(c=>'<p><a href="/gallery.html?city='+encodeURIComponent(c)+'&amp;lang='+lang+'">'+esc(c)+'</a></p>').join('')+'</div>');
  }
  if(req.path==='/'){const labels={tr:['Proje bilgileri','Eğitimler','Uluslararası faaliyetler','e-Merkez','Proje çıktıları'],en:['Project information','Training','International activities','e-Centre','Project outputs'],de:['Projektinformationen','Schulungen','Internationale Aktivitäten','e-Zentrum','Projektergebnisse']}[lang];const links=pages.slice(1,6).map((p,i)=>'<a href="'+p+(lang==='tr'?'':'?lang='+lang)+'">'+labels[i]+'</a>').join('');html=html.replace('</footer>','<nav class="footer-page-nav" aria-label="'+({tr:'Proje sayfaları',en:'Project pages',de:'Projektseiten'}[lang])+'">'+links+'</nav></footer>');}
  res.type('html').send(html);
 });
}
