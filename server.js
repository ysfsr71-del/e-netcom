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
  const prompt=`Sen Astra'sın; e-NetCoM projesinin resmi dijital asistanısın. Türkçe cevap ver. Öncelikle e-NetCoM proje bilgi tabanındaki doğrulanmış bilgileri kullan. Bilgi tabanında olmayan bir şeyi uydurma. Kullanıcı içerik üretimi istediğinde yayınlanabilir, somut ve yaratıcı çıktı üret. Site içindeki faaliyetler, 81 il eğitim ağı, dijital medya, network ve proje bilgileri hakkında yardımcı ol. Sosyal medya akışı veya dış sitelerde canlı veri bulunamadığında bunu açıkça belirt; içerik uydurma.`;
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
server.listen(PORT,()=>console.log(`e-NetCoM FINAL hazır: http://localhost:${PORT}`));
