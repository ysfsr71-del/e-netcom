const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

function loadEnv(){
  const p=path.join(__dirname,'.env');
  if(!fs.existsSync(p)) return;

  for(const line of fs.readFileSync(p,'utf8').split(/\r?\n/)){
    const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if(!m) continue;

    let v=m[2];
    if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))
      v=v.slice(1,-1);

    if(!process.env[m[1]]) process.env[m[1]]=v;
  }
}

loadEnv();

const PORT=Number(process.env.PORT||3000);
const ROOT=path.join(__dirname,'public');

const mime={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp'
};

function send(res,status,type,body){
  res.writeHead(status,{
    'Content-Type':type,
    'Cache-Control':'no-store'
  });
  res.end(body);
}

function staticFile(req,res){
  let u=decodeURIComponent((req.url||'/').split('?')[0]);

  if(u==='/') u='/index.html';

  const fp=path.normalize(path.join(ROOT,u));

  if(!fp.startsWith(ROOT))
    return send(res,403,'text/plain','Forbidden');

  fs.readFile(fp,(e,b)=>{
    if(e)
      return send(res,404,'text/plain','Not found');

    send(
      res,
      200,
      mime[path.extname(fp)]||'application/octet-stream',
      b
    );
  });
}

function extractText(obj){
  if(!obj) return '';

  if(typeof obj==='string')
    return obj;

  if(Array.isArray(obj))
    return obj.map(extractText).filter(Boolean).join('\n');

  if(typeof obj==='object'){
    if(typeof obj.text==='string')
      return obj.text;

    if(obj.type==='output_text' && typeof obj.text==='string')
      return obj.text;

    if(obj.output_text)
      return extractText(obj.output_text);

    if(obj.content)
      return extractText(obj.content);

    if(obj.output)
      return extractText(obj.output);
  }

  return '';
}

function openaiRequest(payload){
  return new Promise((resolve,reject)=>{
    const key=process.env.OPENAI_API_KEY;

    if(!key)
      return reject(new Error('Astra API anahtarı yapılandırılmamış.'));

    const data=JSON.stringify(payload);

    const req=https.request(
      'https://api.openai.com/v1/responses',
      {
        method:'POST',
        headers:{
          'Authorization':`Bearer ${key}`,
          'Content-Type':'application/json',
          'Content-Length':Buffer.byteLength(data)
        }
      },
      r=>{
        let out='';

        r.on('data',c=>out+=c);

        r.on('end',()=>{
          try{
            const j=JSON.parse(out);

            if(r.statusCode>=400)
              return reject(
                new Error(
                  j?.error?.message ||
                  `OpenAI API ${r.statusCode}`
                )
              );

            resolve(j);

          }catch(e){
            reject(e);
          }
        });
      }
    );

    req.on('error',reject);
    req.write(data);
    req.end();
  });
}


/* =========================================================
   DOĞRULANMIŞ E-NETCOM EĞİTİM VERİLERİ
   ========================================================= */

const VERIFIED_TRAINING_DATA = [

  {
    date:'31 Ocak 2026',
    city:'Sakarya',
    type:'Yüz yüze',
    participants:34,
    youthWorkers:3,
    total:37,
    place:'TÜGVA Sakarya İl Temsilciliği'
  },

  {
    date:'14 Şubat 2026',
    city:'İstanbul',
    type:'Yüz yüze',
    participants:32,
    youthWorkers:3,
    total:35,
    place:'TÜGVA Genel Merkezi'
  },

  {
    date:'3 Mart 2026',
    city:'Ankara',
    type:'Yüz yüze',
    participants:33,
    youthWorkers:2,
    total:35,
    place:'TÜGVA Ankara İl Temsilciliği'
  },

  {
    date:'3 Nisan 2026',
    city:'Konya',
    type:'Yüz yüze',
    participants:45,
    youthWorkers:null,
    total:45,
    place:'Konya Büyükşehir Belediyesi Sosyal İnovasyon Merkezi'
  },

  {
    date:'9 Nisan 2026',
    city:'Aydın',
    type:'Yüz yüze',
    participants:104,
    youthWorkers:null,
    total:104,
    place:'Aydın Adnan Menderes Üniversitesi İletişim Fakültesi'
  },

  {
    date:'15 Nisan 2026',
    city:'Kahramanmaraş',
    type:'Yüz yüze',
    participants:35,
    youthWorkers:null,
    total:35,
    place:'Çukurova Elektrik Anadolu Lisesi'
  },

  {
    date:'22 Nisan 2026',
    city:'Şanlıurfa',
    type:'Yüz yüze',
    participants:78,
    youthWorkers:null,
    total:78,
    place:'CEASE Şanlıurfa Anadolu İmam Hatip Lisesi'
  },

  {
    date:'24 Nisan 2026',
    city:'Gaziantep',
    type:'Yüz yüze',
    participants:90,
    youthWorkers:null,
    total:90,
    place:'Vehbi Dinçerler Science High School'
  },

  {
    date:'6 Mayıs 2026',
    city:'Muğla',
    type:'Yüz yüze',
    participants:72,
    youthWorkers:null,
    total:72,
    place:'Jurgutreis Anadolu High School'
  },

  {
    date:'8 Mayıs 2026',
    city:'Denizli',
    type:'Yüz yüze',
    participants:32,
    youthWorkers:null,
    total:32,
    place:'İbrahim Cinkaya Social Science High School'
  },

  {
    date:'13 Mayıs 2026',
    city:'Adana',
    type:'Yüz yüze',
    participants:35,
    youthWorkers:null,
    total:35,
    place:'Seyhan Rotary Anadolu High School'
  },

  {
    date:'15 Mayıs 2026',
    city:'Mersin',
    type:'Yüz yüze',
    participants:120,
    youthWorkers:null,
    total:120,
    place:'Korukent Anadolu High School'
  },

  {
    date:'20 Mayıs 2026',
    city:'Samsun',
    type:'Yüz yüze',
    participants:53,
    youthWorkers:null,
    total:53,
    place:'Aziz Atık Science High School'
  },

  {
    date:'22 Mayıs 2026',
    city:'Ordu',
    type:'Yüz yüze',
    participants:54,
    youthWorkers:null,
    total:54,
    place:'Ordu Science High School'
  },

  {
    date:'28 Mart 2026',
    city:'Uşak',
    type:'Çevrimiçi',
    participants:36,
    youthWorkers:null,
    total:36,
    place:'Dijital Eğitim'
  },

  {
    date:'4 Nisan 2026',
    city:'Malatya',
    type:'Çevrimiçi',
    participants:26,
    youthWorkers:null,
    total:26,
    place:'Dijital Eğitim'
  },

  {
    date:'11 Nisan 2026',
    city:'Burdur',
    type:'Çevrimiçi',
    participants:33,
    youthWorkers:null,
    total:33,
    place:'Dijital Eğitim'
  },

  {
    date:'18 Nisan 2026',
    city:'Afyonkarahisar',
    type:'Çevrimiçi',
    participants:37,
    youthWorkers:null,
    total:37,
    place:'Dijital Eğitim'
  },

  {
    date:'2 Mayıs 2026',
    city:'Kütahya',
    type:'Çevrimiçi',
    participants:24,
    youthWorkers:null,
    total:24,
    place:'Dijital Eğitim'
  },

  {
    date:'9 Mayıs 2026',
    city:'Bilecik',
    type:'Çevrimiçi',
    participants:37,
    youthWorkers:null,
    total:37,
    place:'Dijital Eğitim'
  },

  {
    date:'23 Mayıs 2026',
    city:'Karaman',
    type:'Çevrimiçi',
    participants:93,
    youthWorkers:null,
    total:93,
    place:'Dijital Eğitim'
  },

  {
    date:'11 Temmuz 2026',
    city:'Tunceli',
    type:'Çevrimiçi',
    participants:51,
    youthWorkers:null,
    total:51,
    place:'Dijital Eğitim'
  }

];


/* =========================================================
   EĞİTİM SORUSU ALGILAMA
   ========================================================= */

function isTrainingQuery(msg){

  return /eğitim|katılımcı|gençlik çalışanı|81 il|hangi il|hangi şehir|sakarya|istanbul|ankara|konya|aydın|kahramanmaraş|şanlıurfa|gaziantep|muğla|denizli|adana|mersin|samsun|ordu|uşak|malatya|burdur|afyonkarahisar|kütahya|bilecik|karaman|tunceli/i.test(msg);

}


/* =========================================================
   EĞİTİM VERİSİNİ ASTRA'YA AKTAR
   ========================================================= */

function trainingContext(){

  const rows=VERIFIED_TRAINING_DATA
    .map(x =>
      `${x.date} | ${x.city} | ${x.type} | ${x.participants} | ${x.youthWorkers===null?'belirtilmemiş':x.youthWorkers} | ${x.total} | ${x.place}`
    )
    .join('\n');

  return `

DOĞRULANMIŞ 81 İL EĞİTİM AĞI VERİSİ
(site üzerinde kullanılan güncel kayıt):

Sütunlar:
Tarih | İl | Eğitim türü | Katılımcı | Gençlik çalışanı | Toplam | Yer

${rows}

ÖNEMLİ:

Gençlik çalışanı sayısı yalnızca kaynakta açıkça verilen ilk üç kayıtta biliniyor.

Diğer kayıtlarda "belirtilmemiş" de.

Katılımcı sayısı ile toplamı birbirine karıştırma.
`;

}


/* =========================================================
   ASTRA CHAT
   ========================================================= */

async function chat(body,res){

  const msg=String(body?.message||'').trim();

  if(!msg)
    return send(
      res,
      400,
      'application/json; charset=utf-8',
      JSON.stringify({error:'Mesaj boş.'})
    );

  const history=
    Array.isArray(body?.history)
      ? body.history.slice(-4)
      : [];

  const tools=[];

  if(process.env.OPENAI_VECTOR_STORE_ID){

    tools.push({
      type:'file_search',
      vector_store_ids:[
        process.env.OPENAI_VECTOR_STORE_ID
      ],
      max_num_results:8
    });

  }


  const prompt=`

Sen Astra'sın; e-NetCoM projesinin resmi dijital asistanısın.

Türkçe konuş ve kullanıcıya doğrudan, anlaşılır ve kurumsal bir dille yardımcı ol.

TEMEL GÖREVİN

- e-NetCoM projesi, faaliyetleri, eğitim ağı, dijital içerikleri, medya çalışmaları, ortakları ve proje belgeleri hakkında güvenilir bilgi vermek.

- Öncelik sırası:

1. Bu sistem mesajındaki açıkça verilmiş doğrulanmış yapılandırılmış veriler.
2. e-NetCoM bilgi tabanındaki doğrulanmış proje belgeleri.
3. Kullanıcı tarafından verilen bilgiler.

- Bu kaynaklarda açıkça bulunmayan bir bilgiyi tahmin etme, uydurma veya başka bir bilgiyle doldurma.


SAYISAL VERİ VE EĞİTİM KURALLARI

- Tarih, il, eğitim türü, katılımcı, gençlik çalışanı ve toplam sayılarını ayrı alanlar olarak değerlendir.

- Kaynakta gençlik çalışanı sayısı belirtilmiyorsa "belirtilmemiş" de.

- Katılımcı sayısını gençlik çalışanı sayısı gibi gösterme.

- Bir il için kayıt yapılandırılmış veride varsa, özellikle il/tarih/katılımcı sorularında önce bu kaydı kullan.

- Kullanıcı birden fazla eğitim isterse mümkün olduğunca tüm ilgili kayıtları eksiksiz listele.

- Kullanıcı tablo isterse gerçek Markdown tablo üret.

Tablo için varsayılan sütunlar:

Tarih | İl | Eğitim türü | Katılımcı sayısı

Gençlik çalışanı istenirse ayrı sütun ekle.

- Bir toplam hesaplaman gerekiyorsa hangi alanları topladığını belirt.

- Kaynakta verilen toplam ile kendi hesapladığın toplamı karıştırma.

- Bilgi tabanı ile yapılandırılmış site verisi arasında açık bir uyuşmazlık görürsen sessizce birini diğerine dönüştürme.

Uyuşmazlığı kısa ve açık biçimde belirt.


KAYNAK VE DOĞRULUK KURALLARI

- Proje belgeleri ve bilgi tabanı birincil kaynaklardır.

- Sayılar, tarihler, il adları, katılımcı sayıları, faaliyet adları, proje ortakları ve proje dönemi gibi somut bilgileri doğrulamaya çalış.

- Kullanıcı "kaynağı nedir?" veya "nereden biliyorsun?" derse bilginin hangi tür e-NetCoM kaynağından geldiğini açıkla.

- Yapılandırılmış eğitim verisi kullanıldıysa bunu da belirt.

- Kaynak yeterli değilse açıkça söyle.


CEVAP BİÇİMİ

- Basit sorulara kısa ve doğrudan cevap ver.

- Çoklu kayıt/listelerde tablo veya madde işaretleri kullan.

- Gereksiz uzun açıklamalardan kaçın.

- Türkçe yazım ve noktalama kurallarına dikkat et.

- Kurumsal ama doğal bir dil kullan.

- "Sayın kullanıcı" deme.

- Markdown kullanabilirsin.

- Özellikle tabloları gerçek Markdown biçiminde üret.


PROJE BAĞLAMI

- e-NetCoM; çevresel sürdürülebilirlik, iklim değişikliği, gençlik, iletişim, medya ve yeşil beceriler ekseninde yürütülen Erasmus+ projesidir.

- Faaliyetler, 81 il eğitim ağı, dijital öğrenme araçları, medya içerikleri, ağ oluşturma ve proje ortaklıkları hakkında yardımcı ol.


İÇERİK ÜRETİMİ

- Haber, sosyal medya metni, duyuru, başlık, kısa açıklama, sunum metni veya benzeri içerik istenirse yayınlanabilir ve somut bir taslak üret.

- Gerçek proje verilerini değiştirme.

- Olmayan etkinlik, sayı, tarih, ortak veya sonuç icat etme.


SINIRLAR

- e-NetCoM adına resmi karar, taahhüt veya politika oluşturuyormuş gibi davranma.

- Gizli, kişisel veya kamuya açık olmayan proje bilgilerini ifşa etme.

- Güncel dış web veya sosyal medya verisine erişimin yoksa varmış gibi davranma.


AMAÇ

Kullanıcıya belgelerine dayanan ve sayısal verilerde dikkatli davranan güvenilir bir e-NetCoM proje asistanı gibi cevap ver.
`;

  const enrichedPrompt=
    prompt+
    (isTrainingQuery(msg)
      ? trainingContext()
      : '');


  const input=[
    {
      role:'system',
      content:enrichedPrompt
    },

    ...history.map(x=>({
      role:x.role==='assistant'
        ? 'assistant'
        : 'user',

      content:String(x.content||'')
    })),

    {
      role:'user',
      content:msg
    }
  ];


  try{

    const r=await openaiRequest({

      model:
        process.env.OPENAI_MODEL ||
        'gpt-6-astra',

      input,

      tools,

      reasoning:{
        effort:'low'
      },

      max_output_tokens:2200

    });


    send(
      res,
      200,
      'application/json; charset=utf-8',
      JSON.stringify({
        reply:
          extractText(r) ||
          'Yanıt üretilemedi.'
      })
    );


  }catch(e){

    console.error(e);

    send(
      res,
      200,
      'application/json; charset=utf-8',
      JSON.stringify({
        reply:
          'Astra şu anda yanıt veremiyor. Lütfen birkaç saniye sonra tekrar deneyin.',
        degraded:true
      })
    );

  }

}


/* =========================================================
   SERVER
   ========================================================= */

const server=http.createServer((req,res)=>{

  if(
    req.method==='GET' &&
    req.url.startsWith('/api/health')
  ){

    return send(
      res,
      200,
      'application/json; charset=utf-8',
      JSON.stringify({

        ok:!!process.env.OPENAI_API_KEY,

        knowledgeBase:
          !!process.env.OPENAI_VECTOR_STORE_ID,

        model:
          process.env.OPENAI_MODEL ||
          'gpt-6-astra',

        astraVersion:'V3'

      })
    );

  }


  if(
    req.method==='POST' &&
    req.url==='/api/chat'
  ){

    let raw='';

    req.on('data',c=>raw+=c);

    req.on('end',async()=>{

      try{

        await chat(
          JSON.parse(raw||'{}'),
          res
        );

      }catch(e){

        send(
          res,
          200,
          'application/json; charset=utf-8',
          JSON.stringify({
            reply:
              'Astra bağlantısı geçici olarak kullanılamıyor.',
            degraded:true
          })
        );

      }

    });

    return;

  }


  staticFile(req,res);

});


server.listen(
  PORT,
  '0.0.0.0',
  ()=>console.log(
    `e-NetCoM Astra V3 hazır: http://0.0.0.0:${PORT}`
  )
);
