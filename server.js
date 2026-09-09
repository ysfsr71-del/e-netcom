const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

function loadEnv(){
  const p=path.join(__dirname,'.env'); if(!fs.existsSync(p)) return;
  for(const line of fs.readFileSync(p,'utf8').split(/\r?\n/)){
    const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if(!m) continue;
    let v=m[2]; if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
    if(!process.env[m[1]]) process.env[m[1]]=v;
  }
}
loadEnv();
const PORT=Number(process.env.PORT||3000), ROOT=path.join(__dirname,'public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
function send(res,status,type,body){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body)}
function staticFile(req,res){
  let u=decodeURIComponent((req.url||'/').split('?')[0]); if(u==='/') u='/index.html';
  const fp=path.normalize(path.join(ROOT,u)); if(!fp.startsWith(ROOT)) return send(res,403,'text/plain','Forbidden');
  fs.readFile(fp,(e,b)=>{if(e)return send(res,404,'text/plain','Not found'); send(res,200,mime[path.extname(fp)]||'application/octet-stream',b)})
}
function extractText(obj){
  if(!obj) return '';
  if(typeof obj==='string') return obj;
  if(Array.isArray(obj)) return obj.map(extractText).filter(Boolean).join('\n');
  if(typeof obj==='object'){
    if(typeof obj.text==='string') return obj.text;
    if(obj.type==='output_text' && typeof obj.text==='string') return obj.text;
    if(obj.output_text) return extractText(obj.output_text);
    if(obj.content) return extractText(obj.content);
    if(obj.output) return extractText(obj.output);
  }
  return '';
}
function openaiRequest(payload){
  return new Promise((resolve,reject)=>{
    const key=process.env.OPENAI_API_KEY;
    if(!key) return reject(new Error('Astra API anahtarı yapılandırılmamış.'));
    const data=JSON.stringify(payload);
    const req=https.request('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}},r=>{
      let out=''; r.on('data',c=>out+=c); r.on('end',()=>{try{const j=JSON.parse(out); if(r.statusCode>=400)return reject(new Error(j?.error?.message||`OpenAI API ${r.statusCode}`)); resolve(j)}catch(e){reject(e)}})
    }); req.on('error',reject); req.write(data); req.end();
  })
}
async function chat(body,res){
  const msg=String(body?.message||'').trim(); if(!msg) return send(res,400,'application/json; charset=utf-8',JSON.stringify({error:'Mesaj boş.'}));
  const history=Array.isArray(body?.history)?body.history.slice(-4):[];
  const tools=[]; if(process.env.OPENAI_VECTOR_STORE_ID) tools.push({type:'file_search',vector_store_ids:[process.env.OPENAI_VECTOR_STORE_ID],max_num_results:8});
  const prompt=`Sen Astra'sın; e-NetCoM projesinin resmi dijital asistanısın. Türkçe konuş ve kullanıcıya doğrudan, anlaşılır ve kurumsal bir dille yardımcı ol.

TEMEL GÖREVİN
- e-NetCoM projesi, faaliyetleri, eğitim ağı, dijital içerikleri, medya çalışmaları, ortakları ve proje belgeleri hakkında güvenilir bilgi vermek.
- Kullanıcının sorusunu önce e-NetCoM bilgi tabanındaki doğrulanmış içeriklere göre yanıtlamak.
- Bilgi tabanında açıkça bulunmayan bir bilgiyi tahmin etmemek, uydurmamak veya başka bir bilgiyle doldurmamak.

KAYNAK VE DOĞRULUK KURALLARI
- Proje belgeleri ve bilgi tabanı birincil kaynaktır.
- Sayılar, tarihler, il adları, katılımcı sayıları, faaliyet adları, proje ortakları ve proje dönemi gibi somut bilgileri mümkün olduğunca bilgi tabanından doğrula.
- 'Katılımcı', 'gençlik çalışanı' ve 'toplam' gibi farklı sayı türlerini birbirine karıştırma. Kaynakta ayrım varsa aynen koru.
- Bir kaynakta farklı tarihlere ait veriler bulunuyorsa tarihleri birbirine karıştırma; hangi döneme ait olduğunu açıkça belirt.
- Bilgi tabanında cevap için yeterli veri yoksa bunu açıkça söyle. Kesin olmayan bir bilgiyi kesinmiş gibi sunma.
- Kullanıcı 'kaynağı nedir?', 'nereden biliyorsun?' veya benzeri bir soru sorarsa, bilginin e-NetCoM proje belgeleri/bilgi tabanındaki ilgili içerikten geldiğini açıkla; elindeki kaynak adını biliyorsan belirt.

CEVAP BİÇİMİ
- Basit sorulara kısa ve doğrudan cevap ver.
- Birden fazla unsur isteniyorsa madde işaretleri veya kısa tablolar kullan.
- Kullanıcı özellikle ayrıntı istemedikçe gereksiz uzun açıklamalar yapma.
- Aynı bilgiyi tekrar tekrar anlatma.
- Türkçe yazım ve noktalama kurallarına dikkat et.
- Kurumsal ama robotik olmayan, doğal bir dil kullan.
- Kullanıcıya 'Sayın kullanıcı' gibi gereksiz hitaplar kullanma.

PROJE BAĞLAMI
- e-NetCoM, çevresel sürdürülebilirlik, iklim değişikliği, gençlik, iletişim, medya ve yeşil beceriler ekseninde yürütülen bir Erasmus+ projesidir.
- Faaliyetler, 81 il eğitim ağı, dijital öğrenme araçları, medya içerikleri, ağ oluşturma ve proje ortaklıkları hakkında sorulara yardımcı ol.
- Kullanıcı belirli bir il, tarih veya faaliyet soruyorsa mümkün olduğunca ilgili kaydı bulup doğrudan yanıtla.

İÇERİK ÜRETİMİ
- Kullanıcı proje için haber, sosyal medya metni, duyuru, başlık, kısa açıklama, sunum metni veya benzeri bir içerik isterse yayınlanabilir ve somut bir taslak üret.
- İçerik üretirken doğrulanmış proje bilgilerini koru; olmayan etkinlik, sayı, tarih, ortak veya sonuç icat etme.
- Kullanıcı yaratıcı bir metin istediğinde yaratıcı olabilirsin; ancak gerçek proje verileriyle kurgu unsurlarını birbirine karıştırma.

SINIRLAR
- e-NetCoM adına resmi karar, taahhüt veya politika oluşturuyormuş gibi davranma.
- Gizli, kişisel veya kamuya açık olmayan proje bilgilerini ifşa etme.
- Bilgi tabanında bulunmayan güncel sosyal medya veya dış web verilerini varmış gibi sunma.
- Bir sorunun cevabından emin değilsen bunu açıkça belirt ve mümkünse kullanıcının hangi bilgiyi sorması gerektiğini netleştir.

AMAÇ
Kullanıcı Astra ile konuştuğunda, yalnızca genel bir sohbet botuyla değil, e-NetCoM projesini belgelerine dayanarak bilen, sayısal verilerde dikkatli davranan ve gerektiğinde sınırlarını açıkça belirten güvenilir bir proje asistanıyla konuştuğunu hissetsin.`;
  const input=[{role:'system',content:prompt},...history.map(x=>({role:x.role==='assistant'?'assistant':'user',content:String(x.content||'')})),{role:'user',content:msg}];
  try{const r=await openaiRequest({model:process.env.OPENAI_MODEL||'gpt-6-astra',input,tools,reasoning:{effort:'low'},max_output_tokens:1800}); send(res,200,'application/json; charset=utf-8',JSON.stringify({reply:extractText(r)||'Yanıt üretilemedi.'}))}
  catch(e){console.error(e); send(res,200,'application/json; charset=utf-8',JSON.stringify({reply:'Astra şu anda yanıt veremiyor. Site içeriği ve bilgi merkezi kullanılabilir durumda; lütfen birkaç saniye sonra tekrar deneyin.',degraded:true}))}
}
const server=http.createServer((req,res)=>{
  if(req.method==='GET' && req.url.startsWith('/api/health')) return send(res,200,'application/json; charset=utf-8',JSON.stringify({ok:!!process.env.OPENAI_API_KEY,knowledgeBase:!!process.env.OPENAI_VECTOR_STORE_ID,model:process.env.OPENAI_MODEL||'gpt-6-astra'}));
  if(req.method==='POST' && req.url==='/api/chat'){
    let raw=''; req.on('data',c=>raw+=c); req.on('end',async()=>{try{await chat(JSON.parse(raw||'{}'),res)}catch(e){send(res,200,'application/json; charset=utf-8',JSON.stringify({reply:'Astra bağlantısı geçici olarak kullanılamıyor.',degraded:true}))}}); return;
  }
  staticFile(req,res);
});
server.listen(PORT,'0.0.0.0',()=>console.log(`e-NetCoM FINAL hazır: http://0.0.0.0:${PORT}`));
