// School library publication gate. Run: node scripts/check-school-library-publication.mjs
// Exit nonzero until all three articles are safely indexable and discoverable.
import { readFileSync, existsSync } from 'node:fs';
const origin = 'https://enetcomproject.com';
const pages = [
  ['tr','rehber/okul-esya-kutuphanesi/','rehber/index.html'],
  ['en','en/guide/school-library-of-things/','en/guide/index.html'],
  ['de','de/ratgeber/schulische-leihbibliothek/','de/ratgeber/index.html']
];
const sitemapPath = 'public/sitemap.xml';
const sitemap = readFileSync(sitemapPath,'utf8');
const errors = [];
for (const [lang,slug,listing] of pages) {
  const path = 'public/'+slug+'index.html';
  if (!existsSync(path)) { errors.push(lang+': missing article '+path); continue; }
  const html = readFileSync(path,'utf8');
  const index = readFileSync('public/'+listing,'utf8');
  const url = origin+'/'+slug;
  if (/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) errors.push(lang+': article is noindex');
  if (!html.includes('rel="canonical" href="'+url+'"')) errors.push(lang+': canonical missing');
  const cardLinks = [...index.matchAll(/href=["']([^"']+)["']/g)].map(m=>m[1]);
  if (!cardLinks.includes('/'+slug) && !cardLinks.includes(url)) errors.push(lang+': listing card missing');
  const image = html.match(/<img\b[^>]*>/i)?.[0] || '';
  if (!/\balt=["'][^"']+["']/i.test(image)) errors.push(lang+': descriptive image alt missing');
  if (!/<meta\s+name=["']description["']/i.test(html)) errors.push(lang+': meta description missing');
  if (!/property=["']og:description["']/i.test(html)) errors.push(lang+': OG description missing');
  if (!/name=["']twitter:image["']/i.test(html)) errors.push(lang+': Twitter image missing');
  if (!/<a\b[^>]*href=["']https:\/\//i.test(html)) errors.push(lang+': external source link missing');
  if (!sitemap.includes('<loc>'+url+'</loc>')) errors.push(lang+': sitemap URL missing');
  // A sitemap URL alone is insufficient: the language cluster must be reciprocal.
  const sitemapBlock = sitemap.split('<url>').find(block => block.includes('<loc>'+url+'</loc>'))?.split('</url>')[0] || '';
  for (const [other,otherSlug] of pages) {
    const expected = 'hreflang="'+other+'" href="'+origin+'/'+otherSlug+'"';
    if (!sitemapBlock.includes(expected)) errors.push(lang+': sitemap alternate missing '+other);
  }
  for (const [other,otherSlug] of pages) {
    if (!html.includes('hreflang="'+other+'" href="'+origin+'/'+otherSlug+'"')) errors.push(lang+': missing reciprocal hreflang '+other);
  }
  for (const marker of ['"@type":"Article"','"@type":"BreadcrumbList"','property="og:image"','name="twitter:card"','<h1','<img']) {
    if (!html.includes(marker)) errors.push(lang+': missing '+marker);
  }
}
if (errors.length) {
  console.error('School library NOT publication-ready:\n'+errors.map(x=>' - '+x).join('\n'));
  process.exitCode = 1;
} else {
  console.log('School library publication gate passed for TR/EN/DE (static checks only; editorial and live HTTP QA still required).');
}
