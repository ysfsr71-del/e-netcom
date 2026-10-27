(() => {
  function sync() {
    const lang = ['tr','en','de'].includes(document.documentElement.lang) ? document.documentElement.lang : 'tr';
    const u = new URL(location.href); u.searchParams.set('lang', lang);
    history.replaceState(null, '', u.pathname + u.search + u.hash);
    const canonical = new URL(u.pathname, 'https://enetcomproject.com');
    if(u.pathname === '/gallery.html' && u.searchParams.get('city')) canonical.searchParams.set('city', u.searchParams.get('city'));
    if(lang !== 'tr') canonical.searchParams.set('lang',lang);
    const c=document.querySelector('link[rel="canonical"]'); if(c)c.href=canonical.href;
    document.querySelectorAll('a[href]').forEach(a=>{
      if(a.getAttribute('href').startsWith('#'))return;
      const target=new URL(a.getAttribute('href'),location.origin);
      if(target.origin===location.origin && (target.pathname==='/' || /^\/(proje|egitimler|uluslararasi|veritabani|ciktilar|gallery)\.html$/.test(target.pathname))){target.searchParams.set('lang',lang);a.setAttribute('href',target.pathname+target.search+target.hash);}
    });
    const labels={'İçerik türü':['Content type','Inhaltstyp'],'Konu':['Topic','Thema'],'Kaynak dili':['Resource language','Quellensprache'],'Eğitim filtreleri':['Training filters','Schulungsfilter'],'Eğitim ili ara':['Search training provinces','Schulungsprovinz suchen']};
    document.querySelectorAll('[aria-label]').forEach(el=>{const raw=el.dataset.seoAria||el.getAttribute('aria-label');if(labels[raw]){el.dataset.seoAria=raw;el.setAttribute('aria-label',lang==='tr'?raw:labels[raw][lang==='en'?0:1]);}});
    const title=document.title, description=document.querySelector('meta[name="description"]')?.content || '';
    for(const [key,value] of Object.entries({'og:title':title,'og:description':description,'og:url':canonical.href,'og:locale':{tr:'tr_TR',en:'en_GB',de:'de_DE'}[lang],'twitter:title':title,'twitter:description':description})) {
      const tag=document.querySelector(`meta[property="${key}"],meta[name="${key}"]`); if(tag) tag.content=value;
    }
  }
  if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',sync);else sync();
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('click',e=>{if(e.target.closest('[data-lang-switch]'))queueMicrotask(sync)});
})();
