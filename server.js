const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.join(__dirname, "public");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};


/* =========================================================
   E-NETCOM EĞİTİM VERİLERİ
   ========================================================= */

const TRAININGS = [
  ["31 Ocak 2026","Sakarya","Yüz yüze",34,3,37],
  ["14 Şubat 2026","İstanbul","Yüz yüze",32,3,35],
  ["3 Mart 2026","Ankara","Yüz yüze",33,2,35],
  ["3 Nisan 2026","Konya","Yüz yüze",45,null,45],
  ["9 Nisan 2026","Aydın","Yüz yüze",104,null,104],
  ["15 Nisan 2026","Kahramanmaraş","Yüz yüze",35,null,35],
  ["22 Nisan 2026","Şanlıurfa","Yüz yüze",78,null,78],
  ["24 Nisan 2026","Gaziantep","Yüz yüze",90,null,90],
  ["6 Mayıs 2026","Muğla","Yüz yüze",72,null,72],
  ["8 Mayıs 2026","Denizli","Yüz yüze",32,null,32],
  ["13 Mayıs 2026","Adana","Yüz yüze",35,null,35],
  ["15 Mayıs 2026","Mersin","Yüz yüze",120,null,120],
  ["20 Mayıs 2026","Samsun","Yüz yüze",53,null,53],
  ["22 Mayıs 2026","Ordu","Yüz yüze",54,null,54],

  ["28 Mart 2026","Uşak","Çevrimiçi",36,null,36],
  ["4 Nisan 2026","Malatya","Çevrimiçi",26,null,26],
  ["11 Nisan 2026","Burdur","Çevrimiçi",33,null,33],
  ["18 Nisan 2026","Afyonkarahisar","Çevrimiçi",37,null,37],
  ["2 Mayıs 2026","Kütahya","Çevrimiçi",24,null,24],
  ["9 Mayıs 2026","Bilecik","Çevrimiçi",37,null,37],
  ["23 Mayıs 2026","Karaman","Çevrimiçi",93,null,93],
  ["11 Temmuz 2026","Tunceli","Çevrimiçi",51,null,51]
];


/* =========================================================
   TEMEL PROJE BİLGİLERİ
   ========================================================= */

const PROJECT_CONTEXT = `
e-NetCoM projesi:

Proje adı:
Doğanın Enerjileri Bizimle: Genç Liderler, Çevresel İletişim ve Medya Ağı (e-NetCoM)

Erasmus+ KA220-YOU Cooperation Partnerships in Youth projesidir.

Proje numarası:
2024-1-TR01-KA220-YOU-000245332

Proje dönemi:
1 Aralık 2024 - 30 Kasım 2027

Koordinatör:
RTÜK

Ortaklar:
Erciyes Üniversitesi
Universität Wien
SNSPA
Türkiye Gençlik Vakfı

Ana konular:
- çevresel sürdürülebilirlik
- iklim değişikliği
- gençlik
- iletişim
- medya
- yeşil beceriler
- dijital öğrenme
- çevresel yurttaşlık
- akran eğitimi

Projenin temel çalışma alanları:
- 81 il eğitim ağı
- e-NetCoM veri tabanı
- e-NetCoM Network
- eğitim programları
- kısa filmler
- 1 Dakikada Çevre ve Sürdürülebilirlik içerikleri
- kamu spotları
- hashtag kampanyaları
- e-Merkez
- Astra dijital asistanı

Mayıs 2026 sonu itibarıyla raporlanan temel göstergeler:
- 22 tamamlanan il
- 1.098 katılımcı 30 Mayıs 2026 rapor kesiti
- 11 Temmuz 2026 Tunceli çevrimiçi eğitimiyle 1.149 katılımcı
- 81 il eğitim ağı
- 24 interaktif eğitim/farkındalık videosu
- 10 "1 Dakikada..." içeriği
- 2 kamu spotu
- e-NetCoM veri tabanında 2.449 kaynak
`;


/* =========================================================
   YARDIMCI FONKSİYONLAR
   ========================================================= */

function send(res, status, type, body) {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}


function staticFile(req, res) {

  let url = decodeURIComponent(
    (req.url || "/").split("?")[0]
  );

  if (url === "/") {
    url = "/index.html";
  }

  const filePath = path.normalize(
    path.join(ROOT, url)
  );

  if (!filePath.startsWith(ROOT)) {
    return send(
      res,
      403,
      "text/plain",
      "Forbidden"
    );
  }

  fs.readFile(filePath, (err, data) => {

    if (err) {
      return send(
        res,
        404,
        "text/plain",
        "Not found"
      );
    }

    send(
      res,
      200,
      mime[path.extname(filePath)] ||
      "application/octet-stream",
      data
    );

  });
}


function extractText(response) {

  if (!response) return "";

  if (
    typeof response.output_text === "string" &&
    response.output_text.trim()
  ) {
    return response.output_text;
  }

  if (Array.isArray(response.output)) {

    for (const item of response.output) {

      if (!item) continue;

      if (
        typeof item.text === "string" &&
        item.text.trim()
      ) {
        return item.text;
      }

      if (Array.isArray(item.content)) {

        for (const content of item.content) {

          if (
            typeof content.text === "string" &&
            content.text.trim()
          ) {
            return content.text;
          }

        }

      }

    }

  }

  return "";
}


/* =========================================================
   OPENAI
   ========================================================= */

function askOpenAI(input) {

  return new Promise((resolve, reject) => {

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return reject(
        new Error("OPENAI_API_KEY bulunamadı.")
      );
    }

    const payload = JSON.stringify({
      model:
        process.env.OPENAI_MODEL ||
        "gpt-6-astra",

      input: input,

      reasoning: {
        effort: "low"
      },

      max_output_tokens: 1600
    });


    const request = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/responses",
        method: "POST",

        timeout: 25000,

        headers: {
          "Authorization":
            "Bearer " + apiKey,

          "Content-Type":
            "application/json",

          "Content-Length":
            Buffer.byteLength(payload)
        }
      },

      response => {

        let body = "";

        response.setEncoding("utf8");

        response.on("data", chunk => {
          body += chunk;
        });

        response.on("end", () => {

          let json;

          try {
            json = JSON.parse(body);
          } catch (e) {
            return reject(
              new Error(
                "OpenAI yanıtı JSON olarak okunamadı."
              )
            );
          }

          if (response.statusCode >= 400) {

            return reject(
              new Error(
                json?.error?.message ||
                "OpenAI API hatası: " +
                response.statusCode
              )
            );

          }

          resolve(json);

        });

      }
    );


    request.on("timeout", () => {

      request.destroy(
        new Error(
          "OpenAI isteği 25 saniyede tamamlanmadı."
        )
      );

    });


    request.on("error", error => {
      reject(error);
    });


    request.write(payload);
    request.end();

  });

}


/* =========================================================
   EĞİTİM VERİSİ
   ========================================================= */

function trainingContext() {

  return TRAININGS.map(row => {

    const youth =
      row[4] === null
        ? "belirtilmemiş"
        : row[4];

    return (
      `${row[0]} | ${row[1]} | ${row[2]} | ` +
      `Katılımcı: ${row[3]} | ` +
      `Gençlik çalışanı: ${youth} | ` +
      `Toplam: ${row[5]}`
    );

  }).join("\n");

}


function isTrainingQuestion(message) {

  return /eğitim|katılımcı|gençlik çalışanı|81 il|hangi il|hangi şehir|sakarya|istanbul|ankara|konya|aydın|kahramanmaraş|şanlıurfa|gaziantep|muğla|denizli|adana|mersin|samsun|ordu|uşak|malatya|burdur|afyonkarahisar|kütahya|bilecik|karaman|tunceli/i
    .test(message);

}


/* =========================================================
   ASTRA
   ========================================================= */

async function chat(body, res) {

  const message =
    String(body?.message || "").trim();

  if (!message) {

    return send(
      res,
      400,
      "application/json; charset=utf-8",
      JSON.stringify({
        error: "Mesaj boş."
      })
    );

  }


  const history =
    Array.isArray(body?.history)
      ? body.history.slice(-4)
      : [];


  let systemPrompt = `

Sen Astra'sın.

Sen e-NetCoM projesinin resmi dijital asistanısın.

Türkçe konuş.

Kısa, açık, doğal ve güvenilir cevaplar ver.

Asla bilgi uydurma.

Bilgi kaynakların:
1. Bu sistem mesajında verilen e-NetCoM bilgileri.
2. Doğrulanmış eğitim kayıtları.
3. Kullanıcının mesajı.

Bir bilgi burada yoksa kesinmiş gibi söyleme.

${PROJECT_CONTEXT}

`;


  if (isTrainingQuestion(message)) {

    systemPrompt += `

DOĞRULANMIŞ EĞİTİM KAYITLARI:

Tarih | İl | Eğitim türü | Katılımcı | Gençlik çalışanı | Toplam

${trainingContext()}

EĞİTİM KURALLARI:

- Katılımcı sayısı ile toplam sayıyı birbirine karıştırma.
- Gençlik çalışanı sayısı "belirtilmemiş" ise bunu açıkça söyle.
- Sakarya kaydı: 34 katılımcı + 3 gençlik çalışanı = 37 toplam.
- İstanbul kaydı: 32 katılımcı + 3 gençlik çalışanı = 35 toplam.
- Ankara kaydı: 33 katılımcı + 2 gençlik çalışanı = 35 toplam.
- Kullanıcı tüm eğitimleri isterse tablo oluştur.
- Tablo istenirse Markdown tablo kullan.
- Tarihleri değiştirme.
- Verilmeyen sayıları tahmin etme.

`;

  }


  systemPrompt += `

CEVAP BİÇİMİ:

Basit sorular:
1-3 cümle.

Çoklu kayıtlar:
Markdown tablo veya madde listesi.

Kullanıcı "kaynak" sorarsa:
Bilginin e-NetCoM proje kayıtlarından veya yapılandırılmış eğitim verisinden geldiğini açıkla.

Kurumsal ama doğal bir dil kullan.

"Sayın kullanıcı" deme.

`;


  const input = [

    {
      role: "system",
      content: systemPrompt
    },

    ...history.map(item => ({
      role:
        item.role === "assistant"
          ? "assistant"
          : "user",

      content:
        String(item.content || "")
    })),

    {
      role: "user",
      content: message
    }

  ];


  try {

    console.log(
      "Astra isteği:",
      message
    );


    const response =
      await askOpenAI(input);


    const reply =
      extractText(response);


    if (!reply) {

      throw new Error(
        "OpenAI boş yanıt döndürdü."
      );

    }


    return send(
      res,
      200,
      "application/json; charset=utf-8",
      JSON.stringify({
        reply: reply
      })
    );


  } catch (error) {

    console.error(
      "ASTRA HATASI:",
      error.message
    );


    return send(
      res,
      200,
      "application/json; charset=utf-8",
      JSON.stringify({

        reply:
          "Astra şu anda yanıt veremiyor. Lütfen birkaç saniye sonra tekrar deneyin.",

        degraded: true,

        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined

      })
    );

  }

}


/* =========================================================
   SERVER
   ========================================================= */

const server =
  http.createServer(
    (req, res) => {


      /* HEALTH */

      if (
        req.method === "GET" &&
        req.url.startsWith(
          "/api/health"
        )
      ) {

        return send(
          res,
          200,
          "application/json; charset=utf-8",

          JSON.stringify({

            ok:
              !!process.env.OPENAI_API_KEY,

            knowledgeBase:
              !!process.env.OPENAI_VECTOR_STORE_ID,

            model:
              process.env.OPENAI_MODEL ||
              "gpt-6-astra",

            astraVersion:
              "V4-DIRECT"

          })

        );

      }


      /* CHAT */

      if (
        req.method === "POST" &&
        req.url === "/api/chat"
      ) {

        let body = "";

        req.on(
          "data",
          chunk => {
            body += chunk;
          }
        );


        req.on(
          "end",
          async () => {

            try {

              const json =
                JSON.parse(
                  body || "{}"
                );

              await chat(
                json,
                res
              );

            } catch (error) {

              console.error(
                error
              );

              send(
                res,
                200,
                "application/json; charset=utf-8",

                JSON.stringify({

                  reply:
                    "Astra bağlantısında geçici bir sorun oluştu.",

                  degraded: true

                })

              );

            }

          }
        );

        return;

      }


      /* SITE */

      staticFile(
        req,
        res
      );

    }
  );


server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "e-NetCoM Astra V4-DIRECT çalışıyor: " +
      "http://0.0.0.0:" +
      PORT
    );

  }
);
