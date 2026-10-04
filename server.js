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

    // Stable playlist ID: new campaign videos added to this playlist
    // are included automatically without a code change.
    const hashtagCampaignsPlaylistId = "PLzoT3-KDh6lbt_LVZOZvhzQzqi7M8-X87";

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
  hashtagCampaigns,
  interactiveViews
] = await Promise.all([
  getPlaylistViews(oneMinutePlaylist?.id),
  getPlaylistViews(publicSpotsPlaylist?.id),
  getPlaylistViews(hashtagCampaignsPlaylistId),

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
      hashtagCampaigns,

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
  // Language distribution is based strictly on the language at session start.
  // Language-change events are intentionally excluded so totals match visit counts.
  const languages = countBy(sessionStarts, "lang");
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
  const dayMap = new Map();
  const firstDay = new Date(start);
  firstDay.setUTCHours(0, 0, 0, 0);
  const lastDay = new Date(now);
  lastDay.setUTCHours(0, 0, 0, 0);
  for (let date = new Date(firstDay); date <= lastDay; date.setUTCDate(date.getUTCDate() + 1)) {
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

function xlsxSheet(rows, sheetName="") {
  const safeRows = Array.isArray(rows) ? rows : [];
  const maxCols=Math.max(1,...safeRows.map(r=>Array.isArray(r)?r.length:1));
  const colLetter=c=>{let n=c,out="";while(n){const rem=(n-1)%26;out=String.fromCharCode(65+rem)+out;n=Math.floor((n-1)/26);}return out;};
  const isSummary=sheetName==="Genel Özet";
  const widths=Array.from({length:maxCols},(_,i)=>{
    let max=10;
    for(const row of safeRows){const v=String((Array.isArray(row)?row:[row])[i]??"");max=Math.max(max,Math.min(v.length+2,i===0?42:28));}
    if(isSummary&&i===0)return Math.max(32,Math.min(max,46)); if(isSummary&&i===1)return Math.max(24,Math.min(max,30)); return Math.min(max,i===0?46:30);
  });
  let xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
  xml+='<sheetViews><sheetView workbookViewId="0"><pane ySplit="'+(isSummary?1:1)+'" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
  xml+='<cols>'+widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join("")+'</cols><sheetData>';
  safeRows.forEach((row, r) => {
    const vals=Array.isArray(row)?row:[row];
    const height=(isSummary&&r===0)?28:(r===0?24:20);
    xml += `<row r="${r + 1}" ht="${height}" customHeight="1">`;
    vals.forEach((value, ci) => {
      const ref=colLetter(ci+1)+(r+1);
      let style=0;
      if(isSummary&&r===0) style=1;
      else if(!isSummary&&r===0) style=2;
      else if(isSummary&&ci===0) style=3;
      else if(typeof value==="number") style=4;
      else style=5;
      if(typeof value==="number" && Number.isFinite(value)) xml+=`<c r="${ref}" s="${style}"><v>${value}</v></c>`;
      else xml += `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    });
    xml += '</row>';
  });
  xml += '</sheetData>';
  if(isSummary) xml+='<mergeCells count="1"><mergeCell ref="A1:B1"/></mergeCells>';
  if(!isSummary && safeRows.length>1) xml+=`<autoFilter ref="A1:${colLetter(maxCols)}${safeRows.length}"/>`;
  if(isSummary) xml+='<drawing r:id="rId1"/>';
  xml+='<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
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

function xlsxChartXml(type,title,categories,values,seriesName,showLegend=true,categoryCache=[],valueCache=[]){
  const tx=xmlEscape(seriesName), ttl=xmlEscape(title);
  const cat=xmlEscape(categories), val=xmlEscape(values);
  const strCache=`<c:strCache><c:ptCount val="${categoryCache.length}"/>${categoryCache.map((v,i)=>`<c:pt idx="${i}"><c:v>${xmlEscape(v)}</c:v></c:pt>`).join("")}</c:strCache>`;
  const numCache=`<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${valueCache.length}"/>${valueCache.map((v,i)=>`<c:pt idx="${i}"><c:v>${Number(v)||0}</c:v></c:pt>`).join("")}</c:numCache>`;
  const chartBody=type==="line"
    ? `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>${tx}</c:v></c:tx><c:marker><c:symbol val="none"/></c:marker><c:cat><c:strRef><c:f>${cat}</c:f>${strCache}</c:strRef></c:cat><c:val><c:numRef><c:f>${val}</c:f>${numCache}</c:numRef></c:val><c:smooth val="0"/></c:ser><c:axId val="48650112"/><c:axId val="48672768"/></c:lineChart>`
    : `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>${tx}</c:v></c:tx><c:cat><c:strRef><c:f>${cat}</c:f></c:strRef></c:cat><c:val><c:numRef><c:f>${val}</c:f></c:numRef></c:val></c:ser><c:dLbls><c:showVal val="1"/><c:showLegendKey val="0"/><c:showCatName val="0"/><c:showSerName val="0"/></c:dLbls><c:axId val="48650112"/><c:axId val="48672768"/></c:barChart>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:date1904 val="0"/><c:lang val="tr-TR"/><c:roundedCorners val="0"/><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="tr-TR" sz="1300" b="1"/><a:t>${ttl}</a:t></a:r></a:p></c:rich></c:tx><c:layout/><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>${chartBody}<c:catAx><c:axId val="48650112"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:tickLblPos val="nextTo"/><c:crossAx val="48672768"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/></c:catAx><c:valAx><c:axId val="48672768"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines/><c:numFmt formatCode="0" sourceLinked="0"/><c:tickLblPos val="nextTo"/><c:crossAx val="48650112"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx></c:plotArea>${showLegend?'<c:legend><c:legendPos val="b"/><c:layout/><c:overlay val="0"/></c:legend>':""}<c:plotVisOnly val="1"/><c:dispBlanksAs val="zero"/></c:chart></c:chartSpace>`;
}
function xlsxDrawingXml(){
  const anchor=(id,name,chartId,fromCol,fromRow,toCol,toRow)=>`<xdr:twoCellAnchor><xdr:from><xdr:col>${fromCol}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${fromRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${toCol}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${toRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${id}" name="${name}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId${chartId}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${anchor(1,"Günlük Trafik",1,3,1,11,17)}${anchor(2,"Cihaz Dağılımı",2,3,18,7,32)}${anchor(3,"Dil Dağılımı",3,8,18,12,32)}</xdr:wsDr>`;
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
  // Keep the exported language sheet consistent with the dashboard:
  // one language per session, using the language recorded at session start.
  const langNames={tr:"Türkçe",en:"İngilizce",de:"Almanca"};
  const deviceNames={desktop:"Masaüstü",mobile:"Mobil",tablet:"Tablet"};
  const eventNames={pageview:"Sayfa görüntüleme",section_view:"Bölüm görüntüleme",session_start:"Oturum başlangıcı",session_end:"Oturum sonu",session_heartbeat:"Aktif oturum sinyali",map_click:"İl haritası etkileşimi",video_open:"Video açma",download:"İndirme",click:"Tıklama",language:"Dil değişimi"};
  const translateCounts=(items,names)=>items.map(([name,count])=>[names[String(name).toLowerCase()]||name,count]);
  const languageCounts = translateCounts(countAll(sessions, "lang"),langNames);
  const deviceCounts = translateCounts(countAll(sessions, "device"),deviceNames);
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
    ["Olay Türleri",twoCol("Olay",translateCounts(countAll(events,"type"),eventNames))]
  ];

  const workbookSheets=sheets.map((_,i)=>`<sheet name="${xmlEscape(sheets[i][0])}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("");
  const files=[
    {name:"[Content_Types].xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/><Override PartName="/xl/charts/chart2.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/><Override PartName="/xl/charts/chart3.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`},
    {name:"_rels/.rels",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
    {name:"xl/workbook.xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets></workbook>`},
    {name:"xl/_rels/workbook.xml.rels",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
    {name:"xl/styles.xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Aptos Display"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FF16372C"/><name val="Aptos"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF173F34"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F6F59"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF5F0"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD7E6DF"/></left><right style="thin"><color rgb="FFD7E6DF"/></right><top style="thin"><color rgb="FFD7E6DF"/></top><bottom style="thin"><color rgb="FFD7E6DF"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`}
  ];
  const dailyEnd=Math.max(2,daily.length), deviceEnd=Math.max(2,deviceCounts.length+1), langEnd=Math.max(2,languageCounts.length+1);
  files.push(
    {name:"xl/worksheets/_rels/sheet1.xml.rels",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>'},
    {name:"xl/drawings/drawing1.xml",data:xlsxDrawingXml()},
    {name:"xl/drawings/_rels/drawing1.xml.rels",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart3.xml"/></Relationships>'},
    {name:"xl/charts/chart1.xml",data:xlsxChartXml("line","Günlük Ziyaret Trafiği",`'Günlük Trafik'!$A$2:$A${dailyEnd}`,`'Günlük Trafik'!$B$2:$B${dailyEnd}`,"Ziyaret")},
    {name:"xl/charts/chart2.xml",data:xlsxChartXml("bar","Cihaz Dağılımı",`'Cihazlar'!$A$2:$A${deviceEnd}`,`'Cihazlar'!$B$2:$B${deviceEnd}`,"Oturum")},
    {name:"xl/charts/chart3.xml",data:xlsxChartXml("bar","Dil Dağılımı",`'Diller'!$A$2:$A${langEnd}`,`'Diller'!$B$2:$B${langEnd}`,"Oturum")}
  );
  sheets.forEach((sh,i)=>files.push({name:`xl/worksheets/sheet${i+1}.xml`,data:xlsxSheet(sh[1],sh[0])}));
  return zipStore(files);
}


const RELEASE_NOTES = [
["2026-10-04","Kalite / Raporlama","Excel açılışındaki kurtarma uyarısını önlemek amacıyla grafik OOXML yapısı Excel uyumluluğu için güçlendirildi; grafik veri önbellekleri, dil ve çalışma kitabı uyumluluk bilgileri eklendi."],
["2026-10-04","Raporlama","Excel Genel Özet başlığı birleştirilerek okunabilirliği artırıldı; cihaz ve dil grafiklerinde gereksiz lejant kaldırıldı, veri etiketleri eklendi ve language olay türü Dil değişimi olarak Türkçeleştirildi."],
["2026-10-04","Mobil / Yönetim Paneli","İl haritası kullanım yönlendirmesi cihaz türüne uyarlandı; mobilde dokunma, masaüstünde üzerine gelme ifadesi gösterilecek şekilde yönetim paneli harita QA çalışması tamamlandı."],
["2026-10-04","Mobil / Yönetim Paneli","İl bazlı ilgi haritasının mobil yüksekliği azaltıldı, Türkiye haritası görünümü büyütüldü ve il listesinin sağ tarafı yukarı çık düğmesiyle çakışmayacak şekilde düzenlendi."],
["2026-10-04","Kalite / Yönetim Paneli","Türkiye il etkileşim haritasının SVG il eşleştirmesi düzeltildi; Türkçe karakter farklılıklarına dayanıklı eşleştirme ve il listesi kaydırma davranışı iyileştirildi."],
["2026-10-04","Raporlama","Excel analitik raporuna günlük ziyaret, cihaz ve dil grafikleri eklendi; dil, cihaz ve olay türü etiketleri Türkçeleştirildi."],
["2026-10-04","Raporlama","Excel raporu kurumsal renkler, başlık stilleri, sütun genişlikleri, sabit başlık satırları, filtreler, kenarlıklar ve baskı ayarlarıyla yeniden biçimlendirildi."],
["2026-10-04","Yönetim Paneli","Yönetim paneli KPI kartları, hızlı görünüm, geliştirilmiş trafik alanı, Türkiye il etkileşim haritası, içerik performans kartları ve yenilenmiş giriş ekranıyla yeniden tasarlandı."],
["2026-10","SEO","Veritabanı için aranabilir bağımsız SEO sayfası oluşturuldu, sitemap ve ana sayfa bağlantıları eklendi; sayfa içeriği güçlendirildi."],
["2026-10","SEO","Proje çıktıları sayfasının içerik ve SEO yapısı geliştirildi."],
["2026-10","SEO","Uluslararası faaliyetler için bağımsız SEO sayfası oluşturuldu; metadata, içerik, sitemap ve ana sayfa bağlantıları tamamlandı."],
["2026-10","SEO","Eğitimler için bağımsız SEO sayfası oluşturuldu; eğitim ağı verileri, sitemap ve ana sayfa bağlantıları işlendi."],
["2026-10","SEO","Proje için bağımsız SEO sayfası oluşturuldu; yapılandırılmış veri ve içerik kapsamı genişletildi."],
["2026-10","SEO","Ana sayfaya teknik SEO altyapısı, canonical, robots, Open Graph, Twitter metadata ve JSON-LD eklendi; meta açıklaması iyileştirildi."],
["2026-10","Kalite","Mobil veritabanı bağlantısı, uluslararası rozetler, proje faaliyet metrikleri ve Almanca WP2 başlık/alt başlıkları düzeltildi."],
["2026-10","Analitik","YouTube istatistiklerine hashtag kampanyaları oynatma listesi ve çok dilli görüntülenme etiketleri eklendi."],
["2026-10","Analitik","Excel dil toplamları, günlük raporlama ve video başlıklarının okunabilirliği iyileştirildi."],
["2026-09","Proje Başlangıcı","e-NetCoM web sitesinin ilk ana sayfa ve sunucu sürümleri oluşturuldu; proje için çalışan temel web altyapısı kuruldu."],
["2026-09","Site Mimarisi","Ana sayfanın proje, haberler, etki, faaliyetler, iller, uluslararası çalışmalar, çıktılar, atölye, medya, ağ, veritabanı, akademi, iyi uygulamalar, ortaklar ve iletişim alanları geliştirildi."],
["2026-09","Yönetim Paneli","Yönetim ekranının ilk sürümleri oluşturuldu ve ana siteyle birlikte çok sayıda iterasyonla geliştirildi."],
["2026-09","Analitik Altyapısı","Ziyaret, oturum, bölüm görüntüleme, il haritası etkileşimi, video açma ve indirme gibi kullanıcı etkileşimlerini ölçen analitik altyapı geliştirildi."],
["2026-09","Raporlama","Yönetim panelinde tarih aralığına göre analitik verilerin görüntülenmesi ve Excel olarak dışa aktarılması için raporlama altyapısı oluşturuldu."],
["2026-09","İl Ağı","Türkiye illeri ve proje faaliyetlerini görünür kılan il haritası ve ağ yapısı geliştirildi; saha içerikleriyle ilişkilendirildi."],
["2026-09","Erişilebilirlik","Dil değişimine bağlı erişilebilirlik seçenekleri ve kullanıcı arayüzü etiketleri iyileştirildi."],
["2026-09","Ana Sayfa","Hero alanına kompakt görsel carousel eklendi; harita, ağ paneli ve proje vitrini birden fazla tasarım turunda geliştirildi."],
["2026-09","Saha Görselleri","Tunceli, Viyana, Ankara ve İzmir Gençlik İklim Medya Zirvesi saha içerikleri hero vitrinine taşındı; yinelenen ve hatalı görseller düzeltildi."],
["2026-09","Galeri","Galeri sayfası site yapısına dahil edildi ve ana sayfa geliştirmeleriyle birlikte güncellendi."],
["2026-09","Analitik","Dil ve günlük raporlama hesapları iyileştirildi; video adları kullanıcı tarafından okunabilir başlıklara dönüştürüldü."],
["2026-09","Raporlama","Excel dışa aktarımındaki dil toplamları yönetim paneliyle tutarlı hale getirildi."],
["2026-09","YouTube","Yönetim panelindeki YouTube istatistikleri geliştirildi; hashtag kampanyaları oynatma listesi ve çok dilli görüntülenme etiketleri eklendi."],
["2026-09","Altyapı","Sunucu, ana sayfa ve yönetim panelinde çok sayıda ara sürüm ve stabilizasyon çalışması yapılarak site bugünkü temel yapısına taşındı."],
["2026-09","Çok Dillilik","Dinamik bölüm etiketleri, uluslararası buluşmalar ve erişilebilirlik seçeneklerinin dil değişimleri düzeltildi."],
["2026-09","Mobil / UX","Mobil harita ve ağ tablosu yerleşimi geliştirildi."],
["2026-09","Marka","e-NetCoM faviconu oluşturuldu ve logo ile uyumlu hale getirildi."],
["2026-09","SEO Altyapısı","robots.txt ve sitemap.xml oluşturuldu ve sonraki sayfalarla güncellendi."]
];
function docxParagraph(text,style="normal"){
 const t=xmlEscape(text);
 const p=style==="title"?'<w:pPr><w:jc w:val="center"/><w:spacing w:before="1450" w:after="180"/></w:pPr>':style==="subtitle"?'<w:pPr><w:jc w:val="center"/><w:spacing w:after="150"/></w:pPr>':style==="h1"?'<w:pPr><w:keepNext/><w:spacing w:before="260" w:after="110"/><w:shd w:val="clear" w:color="auto" w:fill="EAF5F0"/></w:pPr>':'<w:pPr><w:spacing w:after="95" w:line="290" w:lineRule="auto"/></w:pPr>';
 const r=style==="title"?'<w:rPr><w:b/><w:color w:val="176B52"/><w:sz w:val="42"/></w:rPr>':style==="subtitle"?'<w:rPr><w:color w:val="4E6B61"/><w:sz w:val="24"/></w:rPr>':style==="h1"?'<w:rPr><w:b/><w:color w:val="176B52"/><w:sz w:val="27"/></w:rPr>':'<w:rPr><w:color w:val="24352F"/><w:sz w:val="20"/></w:rPr>';
 return '<w:p>'+p+'<w:r>'+r+'<w:t xml:space="preserve">'+t+'</w:t></w:r></w:p>';
}
function buildReleaseNotesDocx(){
 const updated=new Date().toLocaleDateString("tr-TR",{day:"2-digit",month:"long",year:"numeric"});
 let body=docxParagraph("e-NetCoM","title")+docxParagraph("GELİŞTİRME VE SÜRÜM NOTLARI","subtitle")+docxParagraph("Proje Geliştirme Tarihçesi","subtitle")+docxParagraph("Environmental Communication and Media Network","normal")+docxParagraph("Son güncelleme: "+updated,"normal");
 body+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
 body+=docxParagraph("SON GÜNCELLEMELER","h1");
 for(const [,area,note] of RELEASE_NOTES.slice(0,5))body+=docxParagraph("● "+area+" — "+note);
 const periods=new Set(RELEASE_NOTES.map(x=>x[0].slice(0,7))).size;const areas=new Set(RELEASE_NOTES.map(x=>x[1])).size;body+=docxParagraph("SÜRÜM ÖZETİ","h1")+docxParagraph(RELEASE_NOTES.length+" geliştirme kaydı • "+periods+" aylık geliştirme süreci • "+areas+" çalışma alanı");
 body+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
 let last="";
 for(const [date,area,note] of RELEASE_NOTES){if(date!==last){const label=date==="2026-10-04"?"4 EKİM 2026":date==="2026-10"?"EKİM 2026":date==="2026-09"?"EYLÜL 2026":date;body+=docxParagraph(label,"h1");last=date;}body+=docxParagraph("● "+area+" — "+note);}
 body+=docxParagraph("DOKÜMAN HAKKINDA","h1")+docxParagraph("Bu belge e-NetCoM Yönetim Merkezi tarafından oluşturulur. Yeni geliştirmeler sürüm notlarına eklendikçe sonraki Word çıktılarında otomatik olarak yer alır.");
 const document='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>';
 return zipStore([{name:"[Content_Types].xml",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'},{name:"_rels/.rels",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},{name:"word/document.xml",data:document}]);
}
app.get("/api/admin/release-notes.docx",requireAdmin,(req,res)=>{try{const buffer=buildReleaseNotesDocx();res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.wordprocessingml.document");res.setHeader("Content-Disposition",'attachment; filename="e-NetCoM_Surum_Notlari.docx"');res.send(buffer);}catch(err){console.error("Release notes DOCX error:",err);res.status(500).json({error:"Sürüm notları Word dosyası oluşturulamadı."});}});
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
