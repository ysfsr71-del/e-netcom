import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.disable("x-powered-by");
app.use(express.json({limit:"512kb"}));
app.use(express.static(path.join(__dirname, "public")));

const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_MODEL || "gpt-6-astra";
const client = apiKey ? new OpenAI({apiKey}) : null;

const SYSTEM = `
Sen e-NetCoM projesinin "Astra" adlı yapay zekâ asistanısın.

PROJE:
“Doğanın Enerjileri Bizimle: Genç Liderler, Çevresel İletişim ve Medya Ağı (e-NetCoM)”
Erasmus+ KA220-YOU
Proje ID: 2024-1-TR01-KA220-YOU-000245332

ODAK:
- çevresel sürdürülebilirlik ve iklim değişikliği
- genç liderlik ve yeşil beceriler
- çevre ve sürdürülebilirlik okuryazarlığı
- çevre iletişimi ve medya okuryazarlığı
- akran destekli eğitim
- proje yaygınlaştırma ve medya ağı

DAVRANIŞ:
- Türkçe cevap ver.
- Açık, anlaşılır, uygulanabilir bir dil kullan.
- Kullanıcı proje fikri istediğinde hedef, faaliyet, zamanlama, sorumluluk ve ölçülebilir çıktı öner.
- Kullanıcı e-NetCoM hakkında kesin bir bilgi sorarsa, öncelikle bilgi tabanındaki proje belgelerini kullan. Belge ile desteklenmeyen bir ayrıntıyı kesinmiş gibi sunma.
- Bilgi tabanından gelen içerik ile genel web bilgisini birbirine karıştırma; proje belgesi önceliklidir. Belge bilgi vermiyorsa bunu açıkça söyle.
- Bilmediğin bir bilgiyi kesinmiş gibi sunma.
- Haber analizi istenirse haber metnindeki iddiaları ayır; doğrulanmamış bilgileri “doğrulanması gerekir” şeklinde belirt.
- Kullanıcı yalnızca kısa bir cevap istiyorsa gereksiz uzunlukta cevap verme.
`;

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-4).filter(x =>
    x && (x.role === "user" || x.role === "assistant") &&
    typeof x.content === "string" && x.content.length <= 12000
  );
}

app.get("/api/health", (req,res) => {
  res.json({
    live: Boolean(client),
    model,
    service: "e-NetCoM Astra"
  });
});

app.post("/api/chat", async (req,res) => {
  const message = String(req.body?.message || "").trim();
  if (!message) return res.status(400).json({error:"Mesaj boş olamaz."});
  if (message.length > 12000) return res.status(413).json({error:"Mesaj çok uzun."});

  if (!client) {
    return res.status(503).json({
      error:"Gerçek Astra bağlantısı için OPENAI_API_KEY tanımlanması gerekiyor."
    });
  }

  try {
    const history = normalizeHistory(req.body?.history);
    const input = [
      ...history.slice(0, -1),
      {role:"user", content:message}
    ];

    const tools = [];

    if (process.env.OPENAI_VECTOR_STORE_ID?.trim()) {
      tools.push({
        type: "file_search",
        vector_store_ids: [process.env.OPENAI_VECTOR_STORE_ID.trim()],
        max_num_results: 8
      });
    }

    // Web search is enabled separately; it is only added when explicitly requested.
    if (/güncel|bugün|son dakika|haber|web|internet|araştır|kaynak/i.test(message)) {
      tools.push({ type: "web_search_preview" });
    }

    const response = await client.responses.create({
      model,
      instructions: SYSTEM,
      reasoning: { effort: "low" },
      max_output_tokens: 1800,
      tools,
      include: ["file_search_call.results"],
      input
    });

    res.json({
      live:true,
      model,
      reply: response.output_text || "Astra yanıt üretemedi."
    });
  } catch (error) {
    console.error("Astra API error:", error);
    const detail = error?.message || error?.error?.message || "Bilinmeyen API hatası";
    res.status(500).json({
      error: `Astra isteği başarısız: ${detail}`
    });
  }
});


app.listen(port, () => {
  console.log(`e-NetCoM Astra running on http://localhost:${port}`);
  console.log(`Model: ${model}`);
  console.log(`API key configured: ${Boolean(client)}`);
});
