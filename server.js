import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import fs from "fs";

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

// ==================== SITE ANALYTICS ====================

const ADMIN_PASSWORD = process.env.ADMIN_PANEL_PASSWORD?.trim() || "";
const ADMIN_SECRET = process.env.ADMIN_PANEL_SECRET?.trim() || ADMIN_PASSWORD;
const ANALYTICS_DIR = process.env.ANALYTICS_DATA_DIR?.trim() || "/var/data";
const ANALYTICS_FILE = path.join(ANALYTICS_DIR, "analytics.json");
const ADMIN_COOKIE = "enetcom_admin";
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;
const ANALYTICS_MAX_EVENTS = 50000;

let analyticsEvents = [];
let analyticsWriteTimer = null;

function safeString(value, max = 180) {
  return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, "").slice(0, max);
}

function ensureAnalyticsStore() {
  try {
    fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
    if (fs.existsSync(ANALYTICS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ANALYTICS_FILE, "utf8"));
      if (Array.isArray(parsed)) analyticsEvents = parsed;
    }
  } catch (error) {
    console.warn("Analytics store could not be loaded:", error.message);
  }
}

function scheduleAnalyticsWrite() {
  if (analyticsWriteTimer) return;
  analyticsWriteTimer = setTimeout(() => {
    analyticsWriteTimer = null;
    try {
      fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
      fs.writeFileSync(
        ANALYTICS_FILE,
        JSON.stringify(analyticsEvents),
        "utf8"
      );
    } catch (error) {
      console.warn("Analytics store could not be saved:", error.message);
    }
  }, 500);
}

function pruneAnalytics() {
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 90;
  analyticsEvents = analyticsEvents
    .filter(event => Number(event.ts) >= cutoff)
    .slice(-ANALYTICS_MAX_EVENTS);
}

function makeAdminToken() {
  const issuedAt = Date.now();
  const payload = String(issuedAt);
  const signature = crypto
    .createHmac("sha256", ADMIN_SECRET || "disabled")
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

function isAdminAuthenticated(req) {
  if (!ADMIN_SECRET) return false;
  const header = String(req.headers.cookie || "");
  const match = header.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  if (!match) return false;

  const [issuedAtRaw, signature] = decodeURIComponent(match[1]).split(".");
  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt) || !signature) return false;
  if (Date.now() - issuedAt > ADMIN_SESSION_MS || Date.now() < issuedAt) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(String(issuedAt))
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

function requireAdmin(req, res, next) {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ error: "Yönetici oturumu gerekli." });
  }
  next();
}

function normalizeAnalyticsEvent(body) {
  const type = safeString(body?.type, 40);
  const allowedTypes = new Set([
    "pageview",
    "section_view",
    "click",
    "language",
    "session_heartbeat",
    "session_end",
    "map_click",
    "video_open",
    "download"
  ]);

  if (!allowedTypes.has(type)) return null;

  return {
    type,
    ts: Date.now(),
    sessionId: safeString(body?.sessionId, 80),
    visitorId: safeString(body?.visitorId, 80),
    path: safeString(body?.path || "/", 180),
    referrer: safeString(body?.referrer, 300),
    lang: safeString(body?.lang || "tr", 12),
    device: safeString(body?.device || "unknown", 20),
    section: safeString(body?.section, 120),
    target: safeString(body?.target, 180),
    meta: safeString(body?.meta, 300)
  };
}

function getRangeBounds(range, fromDate, toDate) {
  const now = Date.now();
  if (range === "all") {
    return { start: analyticsEvents.length ? Math.min(...analyticsEvents.map(e => Number(e.ts) || now)) : now, end: now };
  }
  if (range === "custom") {
    const from = /^\d{4}-\d{2}-\d{2}$/.test(String(fromDate || "")) ? Date.parse(`${fromDate}T00:00:00`) : NaN;
    const to = /^\d{4}-\d{2}-\d{2}$/.test(String(toDate || "")) ? Date.parse(`${toDate}T23:59:59.999`) : NaN;
    if (Number.isFinite(from) && Number.isFinite(to) && from <= to) return { start: from, end: to };
  }
  if (range === "24h") return { start: now - 24 * 60 * 60 * 1000, end: now };
  if (range === "7d") return { start: now - 7 * 24 * 60 * 60 * 1000, end: now };
  if (range === "90d") return { start: now - 90 * 24 * 60 * 60 * 1000, end: now };
  if (range === "1y") return { start: now - 365 * 24 * 60 * 60 * 1000, end: now };
  return { start: now - 30 * 24 * 60 * 60 * 1000, end: now };
}

function getRangeStart(range) {
  return getRangeBounds(range).start;
}

function countBy(events, key) {
  const map = new Map();
  for (const event of events) {
    const value = safeString(event[key] || "unknown", 120).trim();
    if (!value || value === "unknown") continue;
    map.set(value, (map.get(value) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = safeString(value, 300).trim();
    if (text) return text;
  }
  return "";
}

function eventTargetName(event) {
  return firstNonEmpty(event.target, event.meta);
}

function getSessionStarts(events) {
  const starts = new Map();
  for (const event of events) {
    if (!event.sessionId) continue;
    const current = starts.get(event.sessionId);
    if (!current || Number(event.ts) < Number(current.ts)) {
      starts.set(event.sessionId, event);
    }
  }
  return [...starts.values()].sort((a, b) => Number(a.ts) - Number(b.ts));
}

function countEventTargets(events, type) {
  const named = events
    .filter(event => event.type === type)
    .map(event => ({ ...event, _name: eventTargetName(event) }))
    .filter(event => event._name);

  const map = new Map();
  for (const event of named) {
    map.set(event._name, (map.get(event._name) || 0) + 1);
  }

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));
}

const TURKEY_PROVINCES = new Set([
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkâri","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yalova","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Kilis","Osmaniye","Düzce"
]);

function isEMerkezEvent(event) {
  const haystack = `${event.section || ""} ${event.target || ""} ${event.meta || ""}`.toLocaleLowerCase("tr-TR");
  return (
    haystack.includes("veritabani") ||
    haystack.includes("veritabanı") ||
    haystack.includes("e-merkez") ||
    haystack.includes("e-merkezi") ||
    haystack.includes("e-centre") ||
    haystack.includes("e-centre") ||
    haystack.includes("database") ||
    haystack.includes("local-db") ||
    haystack.includes("localdb")
  );
}

function buildAnalyticsStats(range = "30d", fromDate = "", toDate = "") {
  const bounds = getRangeBounds(range, fromDate, toDate);
  const start = bounds.start;
  const now = bounds.end;
  const events = analyticsEvents.filter(e => Number(e.ts) >= start && Number(e.ts) <= now);

  const sessions = new Map();
  const visitors = new Set();
  const activeSessions = new Set();
  let durationTotal = 0;
  let durationCount = 0;

  for (const event of events) {
    if (event.visitorId) visitors.add(event.visitorId);
    if (event.sessionId) {
      if (!sessions.has(event.sessionId)) sessions.set(event.sessionId, []);
      sessions.get(event.sessionId).push(event);

      // A visitor is active if there has been any analytics activity in the last 5 minutes.
      if (now - Number(event.ts) <= 5 * 60 * 1000) {
        activeSessions.add(event.sessionId);
      }
    }

    if (event.type === "session_end") {
      const seconds = Number(event.meta);
      if (Number.isFinite(seconds) && seconds >= 0 && seconds <= 86400) {
        durationTotal += seconds;
        durationCount++;
      }
    }
  }

  const sessionStarts = getSessionStarts(events);
  const visits = sessionStarts.length;
  const sections = countBy(events.filter(e => e.type === "section_view"), "section");
  const languageEvents = [];
  const seenLanguageSessions = new Set();
  for (const event of events) {
    if (event.type !== "language" || !event.lang) continue;
    const key = `${event.sessionId || ""}|${event.lang}`;
    if (seenLanguageSessions.has(key)) continue;
    seenLanguageSessions.add(key);
    languageEvents.push(event);
  }
  for (const event of sessionStarts) {
    if (!event.lang) continue;
    const key = `${event.sessionId || ""}|${event.lang}`;
    if (seenLanguageSessions.has(key)) continue;
    seenLanguageSessions.add(key);
    languageEvents.push(event);
  }
  const languages = countBy(languageEvents, "lang");
  const devices = countBy(sessionStarts, "device");
  const referrerEvents = sessionStarts.map(event => {
    const raw = String(event.referrer || "direct").trim();
    if (!raw || raw === "direct") return { ...event, _referrer: "Doğrudan" };
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const currentHost = String(process.env.PUBLIC_HOST || "enetcomproject.com").toLowerCase().replace(/^www\./, "");
      if (host === currentHost || host.endsWith("." + currentHost)) {
        return { ...event, _referrer: "Site içi geçiş" };
      }
      return { ...event, _referrer: host };
    } catch {
      return { ...event, _referrer: raw.slice(0, 120) };
    }
  });
  const referrers = countBy(
    referrerEvents,
    "_referrer"
  );

  // Province clicks: use meta when present, otherwise target. Blank/unknown map events are ignored.
  const provinceViews = countEventTargets(
    events.filter(e => {
      const name = eventTargetName(e);
      return e.type === "map_click" && (e.section === "iller" || TURKEY_PROVINCES.has(name));
    }),
    "map_click"
  );

  // Video and download metrics are based on their explicit event types.
  const videoOpens = countEventTargets(events, "video_open");
  const downloads = countEventTargets(events, "download");

  // e-Merkez interactions are clicks/video opens/downloads inside the database/e-Merkez area.
  const eCenterInteractions = events.filter(e =>
    ["click", "video_open", "download"].includes(e.type) && isEMerkezEvent(e)
  ).length;

  // Daily traffic follows the selected range.
  const dayCount = Math.max(1, Math.floor((now - start) / 86400000) + 1);
  const dayMap = new Map();
  for (let i = dayCount - 1; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    const key = date.toISOString().slice(0, 10);
    dayMap.set(key, { date: key, visits: 0, pageviews: 0 });
  }

  for (const session of sessionStarts) {
    const key = new Date(Number(session.ts)).toISOString().slice(0, 10);
    if (!dayMap.has(key)) continue;
    dayMap.get(key).visits++;
  }

  for (const event of events) {
    if (event.type !== "pageview") continue;
    const key = new Date(Number(event.ts)).toISOString().slice(0, 10);
    if (!dayMap.has(key)) continue;
    dayMap.get(key).pageviews++;
  }

  const eventCounts = countBy(events, "type");

  return {
    generatedAt: new Date().toISOString(),
    range,
    totalEvents: events.length,
    visits,
    uniqueVisitors: visitors.size,
    activeVisitors: activeSessions.size,
    averageSessionSeconds: durationCount
      ? Math.round(durationTotal / durationCount)
      : 0,
    sections,
    languages,
    devices,
    referrers,
    provinceViews,
    videoOpens,
    downloads,
    eCenterInteractions,
    eventCounts,
    daily: [...dayMap.values()]
  };
}

ensureAnalyticsStore();

app.post("/api/analytics/event", (req, res) => {
  const event = normalizeAnalyticsEvent(req.body);
  if (!event) return res.status(400).json({ error: "Geçersiz analytics olayı." });
  if (!event.sessionId || !event.visitorId) {
    return res.status(400).json({ error: "Oturum bilgisi eksik." });
  }

  analyticsEvents.push(event);
  pruneAnalytics();
  scheduleAnalyticsWrite();
  res.status(204).end();
});

app.post("/api/admin/login", (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({
      error: "ADMIN_PANEL_PASSWORD Render Environment bölümünde tanımlanmalı."
    });
  }

  const password = String(req.body?.password || "");
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Şifre hatalı." });
  }

  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=${encodeURIComponent(makeAdminToken())}; Path=/; Max-Age=${ADMIN_SESSION_MS / 1000}; HttpOnly; Secure; SameSite=Lax`
  );
  res.json({ ok: true });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
  );
  res.json({ ok: true });
});


function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n, 0); return b; }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0, 0); return b; }

function zipStore(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, "utf8");
    const crc = crc32(data);
    const local = Buffer.concat([
      Buffer.from([0x50,0x4b,0x03,0x04]), u16(20), u16(0), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data
    ]);
    parts.push(local);
    central.push(Buffer.concat([
      Buffer.from([0x50,0x4b,0x01,0x02]), u16(20), u16(20), u16(0), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name
    ]));
    offset += local.length;
  }

  const centralBuf = Buffer.concat(central);
  const body = Buffer.concat(parts);
  const end = Buffer.concat([
    Buffer.from([0x50,0x4b,0x05,0x06]), Buffer.alloc(2), Buffer.alloc(2),
    u16(files.length), u16(files.length), u32(centralBuf.length), u32(body.length), u16(0)
  ]);
  return Buffer.concat([body, centralBuf, end]);
}

function xlsxSheet(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
  safeRows.forEach((row, r) => {
    xml += `<row r="${r + 1}">`;
    (Array.isArray(row) ? row : [row]).forEach((value, c) => {
      const col = (() => { let n=c+1, out=""; while(n){ const rem=(n-1)%26; out=String.fromCharCode(65+rem)+out; n=Math.floor((n-1)/26);} return out; })();
      xml += `<c r="${col}${r + 1}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    });
    xml += '</row>';
  });
  xml += '</sheetData></worksheet>';
  return xml;
}

function countAll(events, key) {
  const map = new Map();
  for (const event of events) {
    const value = safeString(event[key] || "", 300).trim();
    if (!value) continue;
    map.set(value, (map.get(value) || 0) + 1);
  }
  return [...map.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0], "tr"));
}

function countTargetsAll(events, type) {
  const map = new Map();
  for (const event of events) {
    if (event.type !== type) continue;
    const name = eventTargetName(event);
    if (!name) continue;
    map.set(name, (map.get(name) || 0) + 1);
  }
  return [...map.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0], "tr"));
}

function buildReportWorkbook(range, fromDate, toDate) {
  const bounds = getRangeBounds(range, fromDate, toDate);
  const start = bounds.start, end = bounds.end;
  const events = analyticsEvents.filter(e => Number(e.ts) >= start && Number(e.ts) <= end);
  const sessions = getSessionStarts(events);
  const visitors = new Set(events.map(e => e.visitorId).filter(Boolean));
  let durationTotal = 0, durationCount = 0;
  for (const e of events) {
    if (e.type === "session_end") {
      const sec = Number(e.meta);
      if (Number.isFinite(sec) && sec >= 0 && sec <= 86400) { durationTotal += sec; durationCount++; }
    }
  }

  const sectionCounts = countAll(events.filter(e => e.type === "section_view"), "section");
  const languageEvents = [];
  const seenLang = new Set();
  for (const e of events) {
    if (e.type === "language" && e.lang) {
      const k=`${e.sessionId}|${e.lang}`; if(!seenLang.has(k)){seenLang.add(k);languageEvents.push(e);}
    }
  }
  for (const e of sessions) { if(e.lang){const k=`${e.sessionId}|${e.lang}`;if(!seenLang.has(k)){seenLang.add(k);languageEvents.push(e);}} }
  const languageCounts = countAll(languageEvents, "lang");
  const deviceCounts = countAll(sessions, "device");
  const refCounts = new Map();
  for (const e of sessions) {
    const raw=String(e.referrer||"direct").trim();
    let name="Doğrudan";
    if(raw && raw!=="direct"){
      try{
        const u=new URL(raw); const host=u.hostname.toLowerCase().replace(/^www\./,"");
        const current=String(process.env.PUBLIC_HOST||"enetcomproject.com").toLowerCase().replace(/^www\./,"");
        name=(host===current||host.endsWith("."+current))?"Site içi geçiş":host;
      }catch{name=raw.slice(0,120);}
    }
    refCounts.set(name,(refCounts.get(name)||0)+1);
  }
  const referrerCounts=[...refCounts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"tr"));
  const provinceCounts = countTargetsAll(events.filter(e=>e.type==="map_click" && (e.section==="iller" || TURKEY_PROVINCES.has(eventTargetName(e)))), "map_click");
  const videoCounts = countTargetsAll(events, "video_open");
  const downloadCounts = countTargetsAll(events, "download");
  const eCenter = events.filter(e=>["click","video_open","download"].includes(e.type)&&isEMerkezEvent(e)).length;

  const dayMap=new Map();
  const dayCount=Math.max(1,Math.floor((end-start)/86400000)+1);
  for(let i=dayCount-1;i>=0;i--){const d=new Date(end-i*86400000),k=d.toISOString().slice(0,10);dayMap.set(k,{date:k,visits:0,pageviews:0});}
  for(const e of sessions){const k=new Date(Number(e.ts)).toISOString().slice(0,10);if(dayMap.has(k))dayMap.get(k).visits++;}
  for(const e of events){if(e.type!=="pageview")continue;const k=new Date(Number(e.ts)).toISOString().slice(0,10);if(dayMap.has(k))dayMap.get(k).pageviews++;}

  const labelRange = range==="custom" ? `${fromDate} – ${toDate}` : range==="all" ? "Tüm kayıtlar" : ({"24h":"Son 24 saat","7d":"Son 7 gün","30d":"Son 30 gün","90d":"Son 90 gün","1y":"Son 1 yıl"}[range]||range);
  const summary=[
    ["e-NetCoM ANALİTİK RAPORU"],
    ["Rapor dönemi",labelRange],
    ["Başlangıç",new Date(start).toLocaleString("tr-TR")],
    ["Bitiş",new Date(end).toLocaleString("tr-TR")],
    ["Toplam ziyaret (oturum)",sessions.length],
    ["Tekil ziyaretçi",visitors.size],
    ["Ortalama oturum (sn)",durationCount?Math.round(durationTotal/durationCount):0],
    ["Toplam analytics olayı",events.length],
    ["e-Merkez etkileşimi",eCenter]
  ];
  const daily=[["Tarih","Ziyaret (oturum)","Sayfa görüntüleme"],...dayMap.values()].map(x=>Array.isArray(x)?x:[x.date,x.visits,x.pageviews]);
  const twoCol=(title,items)=>[[title,"Sayım"],...items.map(([n,c])=>[n,c])];
  const sheets=[
    ["Genel Özet",summary],
    ["Günlük Trafik",daily],
    ["Bölümler",twoCol("Bölüm",sectionCounts)],
    ["81 İl",twoCol("İl",provinceCounts)],
    ["Videolar",twoCol("Video",videoCounts)],
    ["İndirilenler",twoCol("İçerik",downloadCounts)],
    ["Diller",twoCol("Dil",languageCounts)],
    ["Cihazlar",twoCol("Cihaz",deviceCounts)],
    ["Giriş Kaynakları",twoCol("Kaynak",referrerCounts)],
    ["Olay Türleri",twoCol("Olay",countAll(events,"type"))]
  ];

  const workbookSheets=sheets.map((_,i)=>`<sheet name="${xmlEscape(sheets[i][0])}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("");
  const files=[
    {name:"[Content_Types].xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`},
    {name:"_rels/.rels",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
    {name:"xl/workbook.xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets></workbook>`},
    {name:"xl/_rels/workbook.xml.rels",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}</Relationships>`}
  ];
  sheets.forEach((sh,i)=>files.push({name:`xl/worksheets/sheet${i+1}.xml`,data:xlsxSheet(sh[1])}));
  return zipStore(files);
}


app.get("/api/admin/report.xlsx", requireAdmin, (req, res) => {
  const range = ["24h","7d","30d","90d","1y","all","custom"].includes(req.query.range) ? req.query.range : "30d";
  const fromDate = String(req.query.from || "");
  const toDate = String(req.query.to || "");
  const workbook = buildReportWorkbook(range, fromDate, toDate);
  const stamp = new Date().toISOString().slice(0,10);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="e-NetCoM_Analitik_Raporu_${stamp}.xlsx"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(workbook);
});

app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  const range = ["24h", "7d", "30d", "90d", "1y", "all", "custom"].includes(req.query.range)
    ? req.query.range
    : "30d";
  const fromDate = String(req.query.from || "");
  const toDate = String(req.query.to || "");

  let youtube = null;
  try {
    if (youtubeApiKey) {
      const now = Date.now();
      if (youtubeStatsCache.data && youtubeStatsCache.expiresAt > now) {
        youtube = youtubeStatsCache.data;
      } else {
        const channel = await getChannel();
        const playlists = await getChannelPlaylists(channel.id);
        const oneMinutePlaylist = findPlaylist(playlists, ["1 dakikada"]);
        const publicSpotsPlaylist = findPlaylist(playlists, ["kamu spot"]);
        const interactivePlaylists = playlists.filter(playlist => {
          const title = String(playlist.snippet?.title || "").toLowerCase();
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

        const [oneMinute, publicSpots, interactiveViews] = await Promise.all([
          getPlaylistViews(oneMinutePlaylist?.id),
          getPlaylistViews(publicSpotsPlaylist?.id),
          Promise.all(
            interactivePlaylists.map(p => getPlaylistViews(p.id))
          ).then(values => values.reduce((total, value) => total + value, 0))
        ]);

        youtube = {
          totalViews: Number(channel.statistics?.viewCount || 0),
          oneMinute,
          interactive: interactiveViews,
          publicSpots,
          updatedAt: new Date().toISOString()
        };

        youtubeStatsCache = {
          data: youtube,
          expiresAt: now + 30 * 60 * 1000
        };
      }
    }
  } catch (error) {
    console.warn("Admin YouTube stats error:", error.message);
  }

  res.json({
    ...buildAnalyticsStats(range, fromDate, toDate),
    youtube,
    storageFile: ANALYTICS_FILE
  });
});

app.get("/yonetim", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "yonetim.html"));
});

// ==================== SITE ANALYTICS SON ====================

app.listen(port, () => {
  console.log(`e-NetCoM Astra running on http://localhost:${port}`);
  console.log(`Model: ${model}`);
  console.log(`API key configured: ${Boolean(client)}`);
});
