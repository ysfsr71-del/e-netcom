(() => {
  function sync() {
    const lang = ['tr','en','de'].includes(document.documentElement.lang) ? document.documentElement.lang : 'tr';
    const u = new URL(location.href); u.searchParams.set('lang', lang);
    history.replaceState(null, '', u.pathname + u.search + u.hash);
    const canonical = new URL(u.pathname, 'https://enetcomproject.com');
    if(u.pathname === '/gallery.html' && u.searchParams.get('city')) canonical.searchParams.set('city', u.searchParams.get('city'));
    if(lang !== 'tr') canonical.searchParams.set('lang',lang);
    const c=document.querySelector('link[rel="canonical"]'); if(c)c.href=canonical.href;
    const title=document.title, description=document.querySelector('meta[name="description"]')?.content || '';
    for(const [key,value] of Object.entries({'og:title':title,'og:description':description,'og:url':canonical.href,'og:locale':{tr:'tr_TR',en:'en_GB',de:'de_DE'}[lang],'twitter:title':title,'twitter:description':description})) {
      const tag=document.querySelector(`meta[property="${key}"],meta[name="${key}"]`); if(tag) tag.content=value;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('click',e=>{if(e.target.closest('[data-lang-switch]'))queueMicrotask(sync)});
})();
