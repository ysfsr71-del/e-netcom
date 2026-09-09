const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 10000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-6-astra';

const PUBLIC_DIR = path.join(__dirname, 'public');

/* =========================================================
   EĞİTİM VERİLERİ
   ========================================================= */

const TRAININGS = [
  { date: '31 Ocak 2026', city: 'Sakarya', type: 'Yüz yüze', participants: 34, youthWorkers: 3, total: 37 },
  { date: '14 Şubat 2026', city: 'İstanbul', type: 'Yüz yüze', participants: 32, youthWorkers: 3, total: 35 },
  { date: '3 Mart 2026', city: 'Ankara', type: 'Yüz yüze', participants: 33, youthWorkers: 2, total: 35 },
  { date: '28 Mart 2026', city: 'Uşak', type: 'Çevrimiçi', participants: 36, youthWorkers: null, total: 36 },
  { date: '3 Nisan 2026', city: 'Konya', type: 'Yüz yüze', participants: 45, youthWorkers: null, total: 45 },
  { date: '4 Nisan 2026', city: 'Malatya', type: 'Çevrimiçi', participants: 26, youthWorkers: null, total: 26 },
  { date: '9 Nisan 2026', city: 'Aydın', type: 'Yüz yüze', participants: 104, youthWorkers: null, total: 104 },
  { date: '11 Nisan 2026', city: 'Burdur', type: 'Çevrimiçi', participants: 33, youthWorkers: null, total: 33 },
  { date: '15 Nisan 2026', city: 'Kahramanmaraş', type: 'Yüz yüze', participants: 35, youthWorkers: null, total: 35 },
  { date: '18 Nisan 2026', city: 'Afyonkarahisar', type: 'Çevrimiçi', participants: 37, youthWorkers: null, total: 37 },
  { date: '22 Nisan 2026', city: 'Şanlıurfa', type: 'Yüz yüze', participants: 78, youthWorkers: null, total: 78 },
  { date: '24 Nisan 2026', city: 'Gaziantep', type: 'Yüz yüze', participants: 90, youthWorkers: null, total: 90 },
  { date: '2 Mayıs 2026', city: 'Kütahya', type: 'Çevrimiçi', participants: 24, youthWorkers: null, total: 24 },
  { date: '6 Mayıs 2026', city: 'Muğla', type: 'Yüz yüze', participants: 72, youthWorkers: null, total: 72 },
  { date: '8 Mayıs 2026', city: 'Denizli', type: 'Yüz yüze', participants: 32, youthWorkers: null, total: 32 },
  { date: '9 Mayıs 2026', city: 'Bilecik', type: 'Çevrimiçi', participants: 37, youthWorkers: null, total: 37 },
  { date: '13 Mayıs 2026', city: 'Adana', type: 'Yüz yüze', participants: 35, youthWorkers: null, total: 35 },
  { date: '15 Mayıs 2026', city: 'Mersin', type: 'Yüz yüze', participants: 120, youthWorkers: null, total: 120 },
  { date: '20 Mayıs 2026', city: 'Samsun', type: 'Yüz yüze', participants: 53, youthWorkers: null, total: 53 },
  { date: '22 Mayıs 2026', city: 'Ordu', type: 'Yüz yüze', participants: 54, youthWorkers: null, total: 54 },
  { date: '23 Mayıs 2026', city: 'Karaman', type: 'Çevrimiçi', participants: 93, youthWorkers: null, total: 93 },
  { date: '11 Temmuz 2026', city: 'Tunceli', type: 'Çevrimiçi', participants: 51, youthWorkers: null, total: 51 }
];

/* =========================================================
   PROJE BİLGİLERİ
   ========================================================= */

const PROJECT_CONTEXT = `
Sen Astra'sın. e-NetCoM projesinin yapay zekâ destekli asistanısın.

Proje adı:
Doğanın Enerjileri Bizimle: Genç Liderler, Çevresel İletişim ve Medya Ağı (e-NetCoM)

Proje ID:
2024-1-TR01-KA220-YOU-000245332

Proje dönemi:
1 Aralık 2024 - 30 Kasım 2027

Koordinatör:
Radyo ve Televizyon Üst Kurulu (RTÜK)

Ortaklar:
- Erciyes Üniversitesi
- University of Vienna
- Romanian SNSPA
- Türkiye Gençlik Vakfı (TÜGVA)

Temel konular:
- Çevresel sürdürülebilirlik
- İklim değişikliği
- Çevresel iletişim
- Yeşil beceriler
- Gençlik çalışmaları
- Dijital öğrenme
- Çevresel yurttaşlık
- İklim liderliği
- Sürdürülebilir tüketim
- Atık yönetimi ve geri dönüşüm

30 Mayıs 2026 raporundaki temel göstergeler:
- 14 yüz yüze il
- 7 çevrimiçi il
- Toplam 1.098 katılımcı
- 24 interaktif eğitim/farkındalık videosu
- 21.696 görüntülenme
- 10 "1 Dakikada Çevre ve Sürdürülebilirlik" içeriği
- 11.077 görüntülenme
- 2 kamu spotu
- 6.251 görüntülenme
- e-NetCoM veritabanında 2.449 yerli ve yabancı kaynak

11 Temmuz 2026 tarihinde Tunceli'de çevrimiçi eğitim yapılmış ve 51 katılımcı kaydedilmiştir.
`;

/* =========================================================
   YARDIMCI FONKSİYONLAR
   ========================================================= */

function normalize(text) {
  return String(text || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function isGreeting(message) {
  const m = normalize(message).trim();

  return (
    /^(merhaba|selam|hey)( astra)?$/.test(m) ||
    /^(nasilsin)( astra)?$/.test(m)
  );
}

function isTrainingQuestion(message) {
  const m = normalize(message);

  const terms = [
    'egitim',
    'egitimler',
    'katilimci',
    'katilim',
    'genclik calisani',
    'hangi iller',
    'hangi il',
    'hangi sehir',
    'sehirlerde',
    '2026',
    'sakarya',
    'istanbul',
    'ankara',
    'konya',
    'aydin',
    'kahramanmaras',
    'sanliurfa',
    'gaziantep',
    'mugla',
    'denizli',
    'adana',
    'mersin',
    'samsun',
    'ordu',
    'usak',
    'malatya',
    'burdur',
    'afyonkarahisar',
    'kutahya',
    'bilecik',
    'karaman',
    'tunceli'
  ];

  return terms.some(term => m.includes(term));
}

function wantsTable(message) {
  const m = normalize(message);

  return (
    m.includes('tablo') ||
    m.includes('listele') ||
    m.includes('liste halinde')
  );
}

function wantsAllTrainings(message) {
  const m = normalize(message);

  return (
    (
      (m.includes('tum') ||
       m.includes('hepsi') ||
       m.includes('butun')) &&
      (m.includes('egitim') || m.includes('il'))
    ) ||
    m.includes('hangi illerde') ||
    m.includes('hangi illerde egitim') ||
    m.includes('2026 yilinda yapilan egitim') ||
    m.includes('2026 yilinda hangi illerde')
  );
}

function findTraining(message) {
  const m = normalize(message);

  return TRAININGS.find(training =>
    m.includes(normalize(training.city))
  );
}

/* =========================================================
   DOĞRUDAN EĞİTİM CEVAPLARI
   ========================================================= */

function directTrainingAnswer(message) {

  if (wantsAllTrainings(message)) {

    if (wantsTable(message)) {

      let output =
        '| Tarih | İl | Eğitim Türü | Katılımcı |\n' +
        '|---|---|---|---:|\n';

      for (const training of TRAININGS) {
        output +=
          `| ${training.date} | ${training.city} | ${training.type} | ${training.total} |\n`;
      }

      return output;
    }

    return (
      `2026 yılında kayıtlı eğitimler **${TRAININGS.length} ilde** gerçekleştirilmiştir.\n\n` +
      TRAININGS
        .map(
          (training, index) =>
            `${index + 1}. **${training.city}** — ${training.date} — ${training.total} kişi`
        )
        .join('\n')
    );
  }

  const training = findTraining(message);

  if (training) {

    let output =
      `**${training.city} – ${training.date}**\n\n` +
      `- Eğitim türü: **${training.type}**\n` +
      `- Katılımcı: **${training.participants} kişi**`;

    if (training.youthWorkers !== null) {

      output +=
        `\n- Gençlik çalışanı: **${training.youthWorkers} kişi**` +
        `\n- Gençlik çalışanları dahil toplam: **${training.total} kişi**`;

    } else {

      output +=
        `\n- Gençlik çalışanı sayısı: **kayıtlı değil**` +
        `\n- Toplam kayıtlı katılım: **${training.total} kişi**`;
    }

    return output;
  }

  return null;
}

/* =========================================================
   OPENAI
   ========================================================= */

function askOpenAI(message, history) {

  return new Promise((resolve, reject) => {

    if (!OPENAI_API_KEY) {
      reject(new Error('OPENAI_API_KEY bulunamadı.'));
      return;
    }

    const input = [
      {
        role: 'system',
        content:
          PROJECT_CONTEXT +
          `

Kurallar:
1. Türkçe cevap ver.
2. Kullanıcının sorusuna doğrudan cevap ver.
3. Bilmediğin bilgiyi uydurma.
4. e-NetCoM ile ilgili verilen proje bağlamını esas al.
5. Kullanıcı tablo isterse Markdown tablo kullan.
6. Kısa, anlaşılır ve profesyonel cevaplar ver.`
      }
    ];

    if (Array.isArray(history)) {

      for (const item of history.slice(-4)) {

        if (!item || !item.content) {
          continue;
        }

        input.push({
          role: item.role === 'assistant'
            ? 'assistant'
            : 'user',
          content: String(item.content)
        });
      }
    }

    input.push({
      role: 'user',
      content: message
    });

    const requestBody = JSON.stringify({
      model: OPENAI_MODEL,
      input,
      reasoning: {
        effort: 'low'
      },
      max_output_tokens: 1200
    });

    const request = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/responses',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        },
        timeout: 25000
      },
      response => {

        let data = '';

        response.on('data', chunk => {
          data += chunk;
        });

        response.on('end', () => {

          try {

            const json = JSON.parse(data);

            if (
              response.statusCode < 200 ||
              response.statusCode >= 300
            ) {

              reject(
                new Error(
                  `OpenAI HTTP ${response.statusCode}: ` +
                  (json.error?.message ||
                   data.slice(0, 500))
                )
              );

              return;
            }

            let text =
              typeof json.output_text === 'string'
                ? json.output_text
                : '';

            if (!text && Array.isArray(json.output)) {

              for (const item of json.output) {

                if (!Array.isArray(item.content)) {
                  continue;
                }

                for (const content of item.content) {

                  if (
                    content &&
                    content.type === 'output_text' &&
                    typeof content.text === 'string'
                  ) {
                    text += content.text;
                  }
                }
              }
            }

            if (!text) {
              reject(
                new Error('OpenAI boş cevap döndürdü.')
              );
              return;
            }

            resolve(text.trim());

          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on('timeout', () => {
      request.destroy(
        new Error('OpenAI zaman aşımına uğradı.')
      );
    });

    request.on('error', error => {
      reject(error);
    });

    request.write(requestBody);
    request.end();
  });
}

/* =========================================================
   JSON CEVABI
   ========================================================= */

function sendJson(res, status, payload) {

  res.writeHead(status, {
    'Content-Type':
      'application/json; charset=utf-8'
  });

  res.end(JSON.stringify(payload));
}

/* =========================================================
   STATİK WEB SİTESİ
   ========================================================= */

function serveStatic(req, res) {

  let requestedPath =
    decodeURIComponent(
      req.url.split('?')[0]
    );

  if (requestedPath === '/') {
    requestedPath = '/index.html';
  }

  const safePath =
    path.normalize(
      path.join(PUBLIC_DIR, requestedPath)
    );

  if (
    safePath !== PUBLIC_DIR &&
    !safePath.startsWith(PUBLIC_DIR + path.sep)
  ) {
    sendJson(res, 403, {
      error: 'Forbidden'
    });
    return;
  }

  fs.readFile(safePath, (error, data) => {

    if (error) {

      if (error.code === 'ENOENT') {
        sendJson(res, 404, {
          error: 'Not found'
        });
      } else {
        sendJson(res, 500, {
          error: 'Server error'
        });
      }

      return;
    }

    const extension =
      path.extname(safePath).toLowerCase();

    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.mp4': 'video/mp4'
    };

    res.writeHead(200, {
      'Content-Type':
        contentTypes[extension] ||
        'application/octet-stream'
    });

    res.end(data);
  });
}

/* =========================================================
   SUNUCU
   ========================================================= */

const server = http.createServer((req, res) => {

  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS'
  );

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  /* HEALTH */

  if (
    req.method === 'GET' &&
    req.url === '/api/health'
  ) {

    sendJson(res, 200, {
      ok: !!OPENAI_API_KEY,
      knowledgeBase:
        !!process.env.OPENAI_VECTOR_STORE_ID,
      model: OPENAI_MODEL,
      astraVersion: 'V5-DIRECT'
    });

    return;
  }

  /* CHAT */

  if (
    req.method === 'POST' &&
    req.url === '/api/chat'
  ) {

    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {

      try {

        const data =
          JSON.parse(body || '{}');

        const message =
          String(data.message || '').trim();

        const history =
          Array.isArray(data.history)
            ? data.history
            : [];

        if (!message) {

          sendJson(res, 400, {
            reply: 'Lütfen bir soru yazın.'
          });

          return;
        }

        console.log(
          'ASTRA SORU:',
          message
        );

        /* Selamlama */

        if (isGreeting(message)) {

          sendJson(res, 200, {
            reply:
              'Merhaba! Ben **Astra**, e-NetCoM projesinin yapay zekâ destekli asistanıyım. 🌱\n\n' +
              'Proje, eğitimler, katılımcı sayıları, iller, sürdürülebilirlik ve çevresel iletişim hakkında bana soru sorabilirsiniz.'
          });

          return;
        }

        /* Eğitim soruları */

        if (isTrainingQuestion(message)) {

          const answer =
            directTrainingAnswer(message);

          if (answer) {

            sendJson(res, 200, {
              reply: answer
            });

            return;
          }
        }

        /* Genel yapay zekâ */

        const answer =
          await askOpenAI(
            message,
            history
          );

        sendJson(res, 200, {
          reply: answer
        });

      } catch (error) {

        console.error(
          'ASTRA HATA:',
          error
        );

        sendJson(res, 200, {
          reply:
            'Astra şu anda yanıt oluştururken bir sorun yaşadı. Lütfen birkaç saniye sonra tekrar deneyin.'
        });
      }
    });

    return;
  }

  /* Web sitesini göster */

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 404, {
    error: 'Not found'
  });
});

server.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `e-NetCoM Astra V5-DIRECT ${PORT} portunda çalışıyor.`
    );
  }
);
