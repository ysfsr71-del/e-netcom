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

// ==================== YOUTUBE API ====================

const youtubeApiKey = process.env.YOUTUBE_API_KEY?.trim() || null;
const youtubeChannelHandle =
  (process.env.YOUTUBE_CHANNEL_HANDLE || '@e-NeTCoMProje').trim();

let youtubeStatsCache = {
  data: null,
  expiresAt: 0
};

async function youtubeGet(resource, params = {}) {
  if (!youtubeApiKey) {
    throw new Error("YOUTUBE_API_KEY tanımlı değil.");
  }

  const query = new URLSearchParams({
    ...params,
    key: youtubeApiKey
  });

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/${resource}?${query}`
  );

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const reason =
      body?.error?.errors?.[0]?.reason ||
      body?.error?.message ||
      `HTTP ${response.status}`;

    throw new Error(`YouTube API: ${reason}`);
  }

  return body;
}

async function getChannel() {
  const data = await youtubeGet("channels", {
    part: "id,statistics",
    forHandle: youtubeChannelHandle
  });

  const channel = data.items?.[0];

  if (!channel) {
    throw new Error(
      `YouTube kanalı bulunamadı: ${youtubeChannelHandle}`
    );
  }

  return channel;
}

async function getChannelPlaylists(channelId) {
  const playlists = [];
  let pageToken = "";

  do {
    const params = {
      part: "snippet",
      channelId,
      maxResults: "50"
    };

    if (pageToken) params.pageToken = pageToken;

    const data = await youtubeGet("playlists", params);

    playlists.push(...(data.items || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return playlists;
}

function findPlaylist(playlists, words) {
  return playlists.find(playlist => {
    const title =
      String(playlist.snippet?.title || "").toLowerCase();

    return words.every(word =>
      title.includes(word.toLowerCase())
    );
  });
}

async function getPlaylistViews(playlistId) {
  if (!playlistId) return 0;

  const videoIds = [];
  let pageToken = "";

  do {
    const params = {
      part: "contentDetails",
      playlistId,
      maxResults: "50"
    };

    if (pageToken) params.pageToken = pageToken;

    const data = await youtubeGet("playlistItems", params);

    for (const item of data.items || []) {
      const videoId = item.contentDetails?.videoId;

      if (videoId) {
        videoIds.push(videoId);
      }
    }

    pageToken = data.nextPageToken || "";
  } while (pageToken);

  const uniqueIds = [...new Set(videoIds)];

  let totalViews = 0;

  for (let i = 0; i < uniqueIds.length; i += 50) {
    const ids = uniqueIds.slice(i, i + 50).join(",");

    const data = await youtubeGet("videos", {
      part: "statistics",
      id: ids
    });

    for (const video of data.items || []) {
      totalViews += Number(
        video.statistics?.viewCount || 0
      );
    }
  }

  return totalViews;
}

app.get("/api/youtube-stats", async (req, res) => {
  res.set("Cache-Control", "no-store");

  if (!youtubeApiKey) {
    return res.status(503).json({
      error: "YOUTUBE_API_KEY tanımlı değil."
    });
  }

  const now = Date.now();

  // 30 dakikalık önbellek
  if (
    youtubeStatsCache.data &&
    youtubeStatsCache.expiresAt > now
  ) {
    return res.json(youtubeStatsCache.data);
  }

  try {
    const channel = await getChannel();

    const playlists =
      await getChannelPlaylists(channel.id);

    const oneMinutePlaylist = findPlaylist(
      playlists,
      ["1 dakikada"]
    );

    const publicSpotsPlaylist = findPlaylist(
      playlists,
      ["kamu spot"]
    );

   const interactivePlaylists = playlists.filter(playlist => {
  const title = String(
    playlist.snippet?.title || ""
  ).toLowerCase();

  return [
    "iklim krizi ve medya",
    "iklim krizi ile mücadele projeleri",
    "çevresel yurttaşlık",
    "sürdürülebilir gıda",
    "sürdürülebilir tüketim",
    "atık yönetimi ve geri dönüşüm",
    "enerji ve kaynak verimliliği"
  ].some(name => title.includes(name));
});

const [
  oneMinute,
  publicSpots,
  interactiveViews
] = await Promise.all([
  getPlaylistViews(oneMinutePlaylist?.id),
  getPlaylistViews(publicSpotsPlaylist?.id),

  Promise.all(
    interactivePlaylists.map(
      playlist => getPlaylistViews(playlist.id)
    )
  ).then(values =>
    values.reduce(
      (total, value) => total + value,
      0
    )
  )
]);

const interactive = interactiveViews;

    const result = {
      totalViews: Number(
        channel.statistics?.viewCount || 0
      ),

      oneMinute,
      interactive,
      publicSpots,

      updatedAt: new Date().toISOString()
    };

    youtubeStatsCache = {
      data: result,
      expiresAt: now + 30 * 60 * 1000
    };

    res.json(result);

  } catch (error) {

    console.error(
      "YouTube stats error:",
      error
    );

    res.status(502).json({
      error:
        `YouTube istatistikleri alınamadı: ${error.message}`
    });
  }
});

// ==================== YOUTUBE API SON ====================

app.listen(port, () => {
  console.log(`e-NetCoM Astra running on http://localhost:${port}`);
  console.log(`Model: ${model}`);
  console.log(`API key configured: ${Boolean(client)}`);
});
