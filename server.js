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
    {name:"[Content_Types].xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`},
    {name:"_rels/.rels",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
    {name:"xl/workbook.xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets></workbook>`},
    {name:"xl/_rels/workbook.xml.rels",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
    {name:"xl/styles.xml",data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Aptos Display"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FF16372C"/><name val="Aptos"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF173F34"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F6F59"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF5F0"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD7E6DF"/></left><right style="thin"><color rgb="FFD7E6DF"/></right><top style="thin"><color rgb="FFD7E6DF"/></top><bottom style="thin"><color rgb="FFD7E6DF"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`}
  ];
  sheets.forEach((sh,i)=>files.push({name:`xl/worksheets/sheet${i+1}.xml`,data:xlsxSheet(sh[1],sh[0])}));
  return zipStore(files);
}


const RELEASE_NOTES = [
["2026-10-04","Kalite / Raporlama","Excel uygulamalarındaki kurtarma ve uyumluluk uyarılarını tamamen önlemek amacıyla grafik bileşenleri analitik rapordan kaldırıldı; veri tabloları, kurumsal biçimlendirme ve Türkçeleştirilmiş etiketler korunarak daha kararlı XLSX yapısına geçildi."],
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

const RELEASE_NOTES_EN = [
["2026-10-04","Quality / Reporting","Chart components were removed from the analytics workbook to eliminate Excel recovery and compatibility warnings; data tables, institutional formatting and localized labels were retained in a more stable XLSX structure."],
["2026-10-04","Quality / Reporting","Excel chart OOXML compatibility was strengthened to address the workbook recovery warning; chart caches and workbook compatibility information were added."],
["2026-10-04","Reporting","The General Summary title was improved for readability; unnecessary legends were removed and report-facing event labels were localized."],
["2026-10-04","Mobile / Management Panel","Province-map guidance was adapted to device type, with touch guidance on mobile and hover guidance on desktop."],
["2026-10-04","Mobile / Management Panel","The mobile province-interest map was made more compact, the Türkiye map was enlarged and the province list was adjusted to avoid overlap with the back-to-top control."],
["2026-10-04","Quality / Management Panel","SVG province matching was improved with Turkish-character-tolerant matching and better scrolling behaviour."],
["2026-10-04","Reporting","Daily visit, device and language visualizations were introduced during report development and report labels were localized."],
["2026-10-04","Reporting","The Excel report was redesigned with institutional colours, heading styles, column widths, frozen headers, filters, borders and print settings."],
["2026-10-04","Management Panel","The management panel was redesigned with KPI cards, a quick overview, improved traffic area, Türkiye province interaction map, content-performance cards and a renewed login screen."],
["2026-10","SEO","A searchable standalone database SEO page was created, added to the sitemap and linked from the homepage; its content was expanded."],
["2026-10","SEO","The project outputs page content and SEO structure were improved."],
["2026-10","SEO","A standalone international activities SEO page was created with metadata, content, sitemap and homepage links."],
["2026-10","SEO","A standalone trainings SEO page was created with training-network data, sitemap and homepage links."],
["2026-10","SEO","A standalone project SEO page was created and expanded with structured data and richer content."],
["2026-10","SEO","Technical SEO, canonical URL, robots metadata, Open Graph, Twitter metadata and JSON-LD were added to the homepage; the meta description was refined."],
["2026-10","Quality","The mobile database link, international badges, project activity metrics and German WP2 title/subtitle were corrected."],
["2026-10","Analytics","The hashtag campaigns playlist and multilingual view labels were added to YouTube statistics."],
["2026-10","Analytics","Excel language totals, daily reporting and the readability of video titles were improved."],
["2026-09","Project Launch","The first homepage and server versions of the e-NetCoM website were created and the working web foundation was established."],
["2026-09","Site Architecture","Homepage areas for project, news, impact, activities, provinces, international work, outputs, workshop, media, network, database, academy, good practices, partners and contact were developed."],
["2026-09","Management Panel","The first versions of the management interface were created and iteratively developed together with the main site."],
["2026-09","Analytics Infrastructure","An analytics foundation was developed to measure visits, sessions, section views, province-map interactions, video opens and downloads."],
["2026-09","Reporting","Reporting infrastructure was created to display analytics by date range and export them from the management panel."],
["2026-09","Province Network","A Türkiye province map and network structure were developed to make project activities visible and connect them with field content."],
["2026-09","Accessibility","Accessibility options and interface labels related to language switching were improved."],
["2026-09","Homepage","A compact visual hero carousel was added; the map, network panel and project showcase were refined through multiple design iterations."],
["2026-09","Field Visuals","Field content from Tunceli, Vienna, Ankara and the İzmir Youth Climate Media Summit was brought into the hero showcase; duplicate and incorrect visuals were corrected."],
["2026-09","Gallery","The gallery page was integrated into the site structure and updated alongside homepage improvements."],
["2026-09","Analytics","Language and daily reporting calculations were improved; video names were converted into user-readable titles."],
["2026-09","Reporting","Language totals in Excel export were aligned with the management panel."],
["2026-09","YouTube","YouTube statistics in the management panel were improved with the hashtag campaigns playlist and multilingual view labels."],
["2026-09","Infrastructure","Numerous intermediate releases and stabilization improvements were made across the server, homepage and management panel."],
["2026-09","Multilingual","Language switching for dynamic section labels, international meetings and accessibility options was corrected."],
["2026-09","Mobile / UX","Mobile map and network-table layouts were improved."],
["2026-09","Brand","The e-NetCoM favicon was created and aligned with the visual identity."],
["2026-09","SEO Infrastructure","robots.txt and sitemap.xml were created and subsequently updated as new pages were added."]
];

function docxRun(text,opt={}){
  const props=(opt.bold?"<w:b/>":"")+(opt.color?'<w:color w:val="'+opt.color+'"/>':"")+(opt.size?'<w:sz w:val="'+opt.size+'"/>':"");
  return '<w:r>'+(props?'<w:rPr>'+props+'</w:rPr>':"")+'<w:t xml:space="preserve">'+xmlEscape(text)+'</w:t></w:r>';
}
function docxP(text,opt={}){
  const ppr='<w:pPr>'+(opt.style?'<w:pStyle w:val="'+opt.style+'"/>':"")+(opt.align?'<w:jc w:val="'+opt.align+'"/>':"")+(opt.keep?'<w:keepNext/>':"")+(opt.before||opt.after?'<w:spacing w:before="'+(opt.before||0)+'" w:after="'+(opt.after||0)+'"/>':"")+'</w:pPr>';
  return '<w:p>'+ppr+docxRun(text,opt)+'</w:p>';
}
function docxPageBreak(){return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';}
function docxToc(en=false){
 const heading=en?"CONTENTS":"İÇİNDEKİLER";
 const fallback=en?"Contents are updated automatically when the document is opened.":"İçindekiler, belge açıldığında otomatik olarak güncellenir.";
 return '<w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr>'+docxRun(heading,{bold:true,color:"176B52",size:28})+'</w:p>'+
 '<w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>'+xmlEscape(fallback)+'</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>';
}
function releaseLabel(date,lang){
 if(lang==="en"){if(date==="2026-10-04")return "4 OCTOBER 2026";if(date==="2026-10")return "OCTOBER 2026";if(date==="2026-09")return "SEPTEMBER 2026";}
 if(date==="2026-10-04")return "4 EKİM 2026";if(date==="2026-10")return "EKİM 2026";if(date==="2026-09")return "EYLÜL 2026";return date;
}
function buildReleaseNotesDocx(lang="tr"){
 const en=lang==="en", notes=en?RELEASE_NOTES_EN:RELEASE_NOTES;
 const now=new Date();
 const date=now.toLocaleDateString(en?"en-GB":"tr-TR",{day:"2-digit",month:"long",year:"numeric",timeZone:"Europe/Istanbul"});
 const time=now.toLocaleTimeString(en?"en-GB":"tr-TR",{hour:"2-digit",minute:"2-digit",second:"2-digit",timeZone:"Europe/Istanbul"});
 const areas=new Set(notes.map(x=>x[1])).size;
 const months=new Set(notes.map(x=>x[0].slice(0,7))).size;
 const T=en?{
  title:"DEVELOPMENT & RELEASE REPORT",sub:"Project Development History",report:"REPORT INFORMATION",date:"Report date",time:"Report time",zone:"Time zone",zonev:"Türkiye (UTC+3)",status:"Document status",statusv:"Current as of generation time",summary:"EXECUTIVE SUMMARY",summaryText:"This report documents the development history of the e-NetCoM website and management environment from its initial implementation through the current release. It consolidates site architecture, analytics, reporting, multilingual, mobile UX, SEO, media, infrastructure and quality improvements into a single institutional record.",overview:"DEVELOPMENT OVERVIEW",recent:"LATEST UPDATES",chrono:"CHRONOLOGICAL DEVELOPMENT RECORD",areas:"WORK AREAS",about:"DOCUMENT NOTES",aboutText:"This document is generated by the e-NetCoM Management Centre from the maintained release-note dataset. The report date and time reflect the moment the file is generated. Future registered improvements will appear in subsequent exports.",records:"development records",months:"months of development",work:"work areas",period:"REPORTING PERIOD",periodv:"September – October 2026",prepared:"Prepared by",preparedv:"e-NetCoM Management Centre",coverText:"Institutional record of the platform’s development, reporting, analytics, SEO, mobile experience and quality improvements."
 }:{
  title:"GELİŞTİRME VE SÜRÜM RAPORU",sub:"Proje Geliştirme Tarihçesi",report:"RAPOR BİLGİLERİ",date:"Rapor tarihi",time:"Rapor saati",zone:"Saat dilimi",zonev:"Türkiye (UTC+3)",status:"Doküman durumu",statusv:"Oluşturulma anı itibarıyla güncel",summary:"YÖNETİCİ ÖZETİ",summaryText:"Bu rapor, e-NetCoM web sitesi ve yönetim ortamının ilk kurulumundan mevcut sürüme kadar gerçekleştirilen geliştirme çalışmalarını kurumsal bir kayıt halinde sunar. Site mimarisi, analitik, raporlama, çok dillilik, mobil kullanıcı deneyimi, SEO, medya, altyapı ve kalite geliştirmeleri tek dokümanda kronolojik olarak bir araya getirilmiştir.",overview:"GELİŞİM ÖZETİ",recent:"SON GÜNCELLEMELER",chrono:"KRONOLOJİK GELİŞTİRME KAYDI",areas:"ÇALIŞMA ALANLARI",about:"DOKÜMAN HAKKINDA",aboutText:"Bu doküman e-NetCoM Yönetim Merkezi tarafından tutulan sürüm notu veri setinden oluşturulur. Rapor tarihi ve saati dosyanın üretildiği anı gösterir. Kayda eklenen yeni geliştirmeler sonraki rapor çıktılarında yer alır.",records:"geliştirme kaydı",months:"aylık geliştirme süreci",work:"çalışma alanı",period:"RAPOR DÖNEMİ",periodv:"Eylül – Ekim 2026",prepared:"Hazırlayan",preparedv:"e-NetCoM Yönetim Merkezi",coverText:"Platformun geliştirme, raporlama, analitik, SEO, mobil deneyim ve kalite çalışmalarını bir araya getiren kurumsal gelişim kaydı."
 };
 let body="";
 body+=docxP("e-NetCoM",{align:"center",bold:true,color:"176B52",size:54,before:620,after:120});
 body+=docxP("ENVIRONMENTAL COMMUNICATION AND MEDIA NETWORK",{align:"center",bold:true,color:"6B7F77",size:17,after:360});
 body+=docxP(T.title,{align:"center",bold:true,color:"173F34",size:36,after:120});
 body+=docxP(T.sub,{align:"center",color:"4E6B61",size:25,after:260});
 body+=docxP(T.coverText,{align:"center",color:"536B62",size:20,after:420});
 body+=docxP(T.period,{align:"center",bold:true,color:"176B52",size:19,after:50});
 body+=docxP(T.periodv,{align:"center",bold:true,color:"173F34",size:25,after:300});
 body+=docxP(notes.length+" "+T.records+"   •   "+areas+" "+T.work+"   •   "+months+" "+T.months,{align:"center",bold:true,color:"176B52",size:20,after:340});
 body+=docxP((en?"REPORT GENERATED":"RAPOR OLUŞTURMA BİLGİSİ"),{align:"center",bold:true,color:"6B7F77",size:17,after:45});
 body+=docxP(date+" · "+time+" · Türkiye (UTC+3)",{align:"center",color:"4E6B61",size:19,after:300});
 body+=docxP(T.prepared+": "+T.preparedv,{align:"center",bold:true,color:"173F34",size:19,after:80});
 body+=docxP("enetcomproject.com",{align:"center",color:"6B7F77",size:18});
 body+=docxPageBreak();
 body+=docxToc(en)+docxPageBreak();
 body+=docxP(T.report,{style:"Heading1",bold:true,color:"176B52",size:28,after:160});
 for(const [a,b] of [[T.date,date],[T.time,time],[T.zone,T.zonev],[T.status,T.statusv]]) body+=docxP(a+": "+b,{size:20,after:80});
 body+=docxP(T.summary,{style:"Heading1",bold:true,color:"176B52",size:28,before:260,after:120})+docxP(T.summaryText,{size:20,after:150});
 body+=docxP(T.overview,{style:"Heading1",bold:true,color:"176B52",size:28,before:260,after:120});
 body+=docxP(notes.length+" "+T.records+" • "+months+" "+T.months+" • "+areas+" "+T.work,{bold:true,color:"173F34",size:21,after:180});
 body+=docxP(T.recent,{style:"Heading1",bold:true,color:"176B52",size:28,before:260,after:120});
 for(const [,area,note] of notes.slice(0,7)) body+=docxP("• "+area+" — "+note,{size:19,after:85});
 body+=docxPageBreak()+docxP(T.chrono,{style:"Heading1",bold:true,color:"176B52",size:28,after:140});
 let last="";
 for(const [d,area,note] of notes){if(d!==last){body+=docxP(releaseLabel(d,lang),{style:"Heading2",bold:true,color:"176B52",size:24,before:230,after:100,keep:true});last=d;}body+=docxP("• "+area+" — "+note,{size:19,after:85});}
 body+=docxPageBreak()+docxP(T.areas,{style:"Heading1",bold:true,color:"176B52",size:28,after:140});
 const grouped=new Map();for(const [,area,note] of notes){if(!grouped.has(area))grouped.set(area,[]);grouped.get(area).push(note);}
 for(const [area,items] of grouped){body+=docxP(area,{style:"Heading2",bold:true,color:"176B52",size:23,before:210,after:90,keep:true});for(const note of items)body+=docxP("• "+note,{size:19,after:75});}
 body+=docxP(T.about,{style:"Heading1",bold:true,color:"176B52",size:28,before:300,after:120})+docxP(T.aboutText,{size:19});
 const document='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>'+body+'<w:sectPr><w:footerReference w:type="default" r:id="rId1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:footer="600"/></w:sectPr></w:body></w:document>';
 const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="20"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:outlineLvl w:val="0"/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:outlineLvl w:val="1"/></w:style><w:style w:type="paragraph" w:styleId="TOCHeading"><w:name w:val="TOC Heading"/><w:basedOn w:val="Heading1"/><w:qFormat/></w:style></w:styles>';
 const footer='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="6B7F77"/><w:sz w:val="17"/></w:rPr><w:t>e-NetCoM · '+xmlEscape(T.title)+' · </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
 return zipStore([
  {name:"[Content_Types].xml",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/></Types>'},
  {name:"_rels/.rels",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
  {name:"word/_rels/document.xml.rels",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>'},
  {name:"word/document.xml",data:document},{name:"word/styles.xml",data:styles},{name:"word/footer1.xml",data:footer},{name:"word/settings.xml",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:updateFields w:val="true"/></w:settings>'}
 ]);
}
app.get("/api/admin/release-notes.docx",requireAdmin,(req,res)=>{try{const lang=String(req.query.lang||"tr").toLowerCase()==="en"?"en":"tr";const buffer=buildReleaseNotesDocx(lang);res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.wordprocessingml.document");res.setHeader("Content-Disposition",'attachment; filename="'+(lang==="en"?"e-NetCoM_Development_Release_Report_EN.docx":"e-NetCoM_Gelistirme_Surum_Raporu_TR.docx")+'"');res.setHeader("Cache-Control","no-store");res.send(buffer);}catch(err){console.error("Release report DOCX error:",err);res.status(500).json({error:"Word raporu oluşturulamadı."});}});



function reportLabel(type,value){
 const v=String(value||"").trim(),k=v.toLocaleLowerCase("tr-TR");
 const maps={
  device:{desktop:"Masaüstü",mobile:"Mobil",tablet:"Tablet"},
  language:{tr:"Türkçe",en:"İngilizce",de:"Almanca",fr:"Fransızca",es:"İspanyolca",ar:"Arapça"},
  section:{proje:"Proje",haberler:"Haberler",faaliyetler:"Faaliyetler",etki:"Etki",atolye:"Atölye",iller:"İller",ciktilar:"Çıktılar",uluslararasi:"Uluslararası",medya:"Medya",network:"Ağ / Network",veritabani:"Veritabanı",akademi:"Akademi",iyi:"İyi Uygulamalar",ortaklar:"Ortaklar",iletisim:"İletişim"}
 };
 return maps[type]?.[k]||v;
}
function cleanDownloadName(v){
 let x=String(v||"").split("?")[0].split("#")[0].replace(/^\/+/,""),name=x.split("/").pop()||x;
 try{name=decodeURIComponent(name)}catch{}
 name=name.replace(/\.[^.]+$/,"").replace(/^\d+[_-]*/,"").replace(/[_-]+/g," ").replace(/\s+/g," ").trim();
 return name||"İndirilen içerik";
}
function cleanAnalyticsItems(items,type){
 return (items||[]).map(x=>({name:type==="download"?cleanDownloadName(x.name):reportLabel(type,x.name),count:Number(x.count)||0}));
}
function cleanVideoItems(items){
 return (items||[]).filter(x=>{const n=String(x.name||"");return n&&!/^https?:\/\//i.test(n)&&!/[?#](wp=|medya)/i.test(n)&&!/^\/?assets\//i.test(n)}).map(x=>({name:String(x.name).replace(/\s+/g," ").trim(),count:Number(x.count)||0}));
}
function trafficInsight(daily){
 const rows=(daily||[]).filter(x=>Number(x.visits)>0);if(!rows.length)return "Günlük trafik eğilimi için yeterli veri bulunmamaktadır.";
 const peak=rows.reduce((a,b)=>Number(b.visits)>Number(a.visits)?b:a,rows[0]);
 const avg=rows.reduce((a,x)=>a+Number(x.visits||0),0)/rows.length;
 return "Günlük trafikte en yüksek değer "+peak.date+" tarihinde "+peak.visits+" oturumla kaydedilmiştir. Aktif gün ortalaması "+Math.round(avg)+" oturumdur.";
}
function reportPct(n,total){return total?Math.round((Number(n)||0)*1000/total)/10:0;}
function reportDuration(sec){sec=Math.max(0,Number(sec)||0);const m=Math.floor(sec/60),ss=Math.round(sec%60);return m?m+" dk "+ss+" sn":ss+" sn";}
function analyticsBarTable(title,items,total,maxItems=8){
 const rows=(items||[]).slice(0,maxItems); if(!rows.length)return docxP("Veri bulunmuyor.",{color:"6B7F77",size:18,after:120});
 const max=Math.max(1,...rows.map(x=>Number(x.count)||0));
 let xml=docxP(title,{bold:true,color:"176B52",size:22,before:160,after:80});
 xml+='<w:tbl><w:tblPr><w:tblW w:w="100%" w:type="pct"/><w:tblBorders><w:insideH w:val="single" w:sz="4" w:color="DCE9E3"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="3000"/><w:gridCol w:w="5200"/><w:gridCol w:w="1300"/></w:tblGrid>';
 for(const item of rows){const n=Number(item.count)||0,pct=reportPct(n,total),bar=Math.max(4,Math.round(n/max*100));xml+='<w:tr><w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>'+docxP(String(item.name||"—"),{size:18,after:30})+'</w:tc><w:tc><w:tcPr><w:tcW w:w="5200" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:color w:val="176B52"/><w:sz w:val="18"/></w:rPr><w:t>'+xmlEscape("█".repeat(Math.max(1,Math.round(bar/5))))+'</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="1300" w:type="dxa"/></w:tcPr>'+docxP(n+" ("+pct+"%)",{bold:true,size:17,after:30})+'</w:tc></w:tr>';}
 return xml+'</w:tbl>';
}
function analyticsDailyTable(daily){
 const rows=(daily||[]).filter(x=>x.visits||x.pageviews).slice(-14);if(!rows.length)return docxP("Seçilen dönemde günlük trafik verisi bulunmuyor.",{color:"6B7F77",size:18});
 const max=Math.max(1,...rows.map(x=>Number(x.visits)||0));
 let xml=docxP("Günlük Ziyaret Eğilimi · Son 14 Aktif Gün",{bold:true,color:"176B52",size:22,before:160,after:80});
 xml+='<w:tbl><w:tblPr><w:tblW w:w="100%" w:type="pct"/></w:tblPr><w:tblGrid><w:gridCol w:w="2200"/><w:gridCol w:w="5700"/><w:gridCol w:w="1300"/></w:tblGrid>';
 for(const x of rows){const n=Number(x.visits)||0,bar=Math.max(1,Math.round(n/max*20));xml+='<w:tr><w:tc>'+docxP(String(x.date),{size:17,after:20})+'</w:tc><w:tc><w:p><w:r><w:rPr><w:color w:val="176B52"/><w:sz w:val="18"/></w:rPr><w:t>'+xmlEscape("█".repeat(bar))+'</w:t></w:r></w:p></w:tc><w:tc>'+docxP(String(n),{bold:true,size:17,after:20})+'</w:tc></w:tr>';}
 return xml+'</w:tbl>';
}
function topInsight(items,total,label){
 const x=(items||[])[0];if(!x)return "Bu başlıkta yeterli veri bulunmamaktadır.";
 const pct=reportPct(x.count,total);return label+" içinde en yüksek pay "+x.name+" kategorisindedir ("+x.count+", %"+pct+").";
}
function buildAnalyticsEvaluationDocx(range="30d",fromDate="",toDate=""){
 const st=buildAnalyticsStats(range,fromDate,toDate),bounds=getRangeBounds(range,fromDate,toDate);
 const now=new Date(),date=now.toLocaleDateString("tr-TR",{day:"2-digit",month:"long",year:"numeric",timeZone:"Europe/Istanbul"}),time=now.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit",second:"2-digit",timeZone:"Europe/Istanbul"});
 const rangeLabel=range==="custom"?fromDate+" – "+toDate:range==="all"?"Tüm kayıtlar":({"24h":"Son 24 saat","7d":"Son 7 gün","30d":"Son 30 gün","90d":"Son 90 gün","1y":"Son 1 yıl"}[range]||range);
 const visits=st.visits||0,unique=st.uniqueVisitors||0,events=st.totalEvents||0,avg=st.averageSessionSeconds||0;
 const returning=Math.max(0,visits-unique),uniqueRate=reportPct(unique,visits),returnRate=reportPct(returning,visits);
 const devices=cleanAnalyticsItems(st.devices,"device"),languages=cleanAnalyticsItems(st.languages,"language"),sections=cleanAnalyticsItems(st.sections,"section"),downloads=cleanAnalyticsItems(st.downloads,"download"),videos=cleanVideoItems(st.videoOpens),referrers=cleanAnalyticsItems(st.referrers,"referrer");
 const deviceText=topInsight(devices,visits,"Cihaz dağılımı"),langText=topInsight(languages,visits,"Dil dağılımı"),refText=topInsight(referrers,visits,"Trafik kaynakları");
 const topSection=sections[0],topProvince=(st.provinceViews||[])[0],topVideo=videos[0],trafficText=trafficInsight(st.daily);
 let body="";
 body+=docxP("e-NetCoM",{align:"center",bold:true,color:"176B52",size:54,before:620,after:120});
 body+=docxP("ÇEVRESEL İLETİŞİM VE MEDYA AĞI",{align:"center",bold:true,color:"6B7F77",size:17,after:330});
 body+=docxP("ANALİTİK DEĞERLENDİRME RAPORU",{align:"center",bold:true,color:"173F34",size:36,after:120});
 body+=docxP("Web sitesi kullanım verilerinin yönetici odaklı analizi",{align:"center",color:"4E6B61",size:24,after:300});
 body+=docxP("RAPOR DÖNEMİ",{align:"center",bold:true,color:"176B52",size:18,after:45})+docxP(rangeLabel,{align:"center",bold:true,color:"173F34",size:26,after:300});
 body+=docxP(visits+" oturum   •   "+unique+" tekil ziyaretçi   •   "+events+" analitik olayı",{align:"center",bold:true,color:"176B52",size:21,after:320});
 body+=docxP("Oluşturulma: "+date+" · "+time+" · Türkiye (UTC+3)",{align:"center",color:"6B7F77",size:18,after:220});
 body+=docxP("e-NetCoM Yönetim Merkezi · enetcomproject.com",{align:"center",bold:true,color:"173F34",size:18});
 body+=docxPageBreak();
 body+=docxP("YÖNETİCİ ÖZETİ",{style:"Heading1",bold:true,color:"176B52",size:29,after:130});
 body+=docxP("Seçilen dönemde e-NetCoM web sitesi "+visits+" oturum ve "+unique+" tekil ziyaretçi üretmiştir. Tekil ziyaretçilerin oturumlara oranı %"+uniqueRate+" düzeyindedir. Ortalama oturum süresi "+reportDuration(avg)+" olarak ölçülmüş, toplam "+events+" analitik etkileşim kaydedilmiştir. e-Merkez alanında "+st.eCenterInteractions+" etkileşim gerçekleşmiştir.",{size:20,after:170});
 body+=docxP("TEMEL GÖSTERGELER",{style:"Heading1",bold:true,color:"176B52",size:28,after:110});
 for(const x of [["Toplam ziyaret",visits+" oturum"],["Tekil ziyaretçi",String(unique)],["Tekil ziyaretçi üzerindeki ek oturum",returning+" (%"+returnRate+")"],["Ortalama oturum",reportDuration(avg)],["Toplam analitik olayı",String(events)],["e-Merkez etkileşimi",String(st.eCenterInteractions)]]) body+=docxP(x[0]+": "+x[1],{bold:true,color:"173F34",size:20,after:65});
 body+=docxP("ÖNE ÇIKAN BULGULAR",{style:"Heading1",bold:true,color:"176B52",size:28,before:220,after:100});
 body+=docxP("• "+trafficText,{size:19,after:70})+docxP("• "+deviceText,{size:19,after:70})+docxP("• "+langText,{size:19,after:70})+docxP("• "+refText,{size:19,after:70});
 if(topSection)body+=docxP("• En fazla görüntülenen bölüm "+topSection.name+" ("+topSection.count+" görüntüleme).",{size:19,after:70});
 if(topProvince)body+=docxP("• İl haritasında en yüksek etkileşim "+topProvince.name+" ("+topProvince.count+" etkileşim).",{size:19,after:70});
 if(topVideo)body+=docxP("• En çok açılan video "+topVideo.name+" ("+topVideo.count+" açılma).",{size:19,after:70});
 body+=docxPageBreak()+docxP("TRAFİK VE KULLANICI PROFİLİ",{style:"Heading1",bold:true,color:"176B52",size:29,after:100});
 body+=analyticsDailyTable(st.daily);
 body+=docxP("Değerlendirme: "+trafficText,{color:"4E6B61",size:18,after:140});
 body+=analyticsBarTable("Cihaz Dağılımı",devices,visits,6);
 body+=docxP("Değerlendirme: "+deviceText,{color:"4E6B61",size:18,after:140});
 body+=analyticsBarTable("Dil Dağılımı",languages,visits,6);
 body+=docxP("Değerlendirme: "+langText,{color:"4E6B61",size:18,after:140});
 body+=analyticsBarTable("Giriş Kaynakları",referrers,visits,8);
 body+=docxP("Değerlendirme: "+refText,{color:"4E6B61",size:18,after:140});
 body+=docxPageBreak()+docxP("İÇERİK PERFORMANSI",{style:"Heading1",bold:true,color:"176B52",size:29,after:100});
 body+=analyticsBarTable("En Çok Görüntülenen Bölümler",sections,sections.reduce((a,x)=>a+x.count,0),10);
 body+=analyticsBarTable("En Çok Açılan Videolar",videos,videos.reduce((a,x)=>a+x.count,0),10);
 body+=analyticsBarTable("En Çok İndirilen İçerikler",downloads,downloads.reduce((a,x)=>a+x.count,0),10);
 body+=docxPageBreak()+docxP("COĞRAFİ ETKİLEŞİM",{style:"Heading1",bold:true,color:"176B52",size:29,after:100});
 body+=analyticsBarTable("İl Haritası Etkileşimleri",st.provinceViews,(st.provinceViews||[]).reduce((a,x)=>a+x.count,0),15);
 body+=docxP("Bu bölüm, ziyaretçinin fiziksel konumunu değil; e-NetCoM Türkiye haritasında hangi illerle etkileşim kurulduğunu göstermektedir.",{color:"6B7F77",size:18,after:160});
 body+=docxP("GENEL DEĞERLENDİRME",{style:"Heading1",bold:true,color:"176B52",size:29,before:220,after:100});
 let assessment="Seçilen dönem için kullanım verileri, ziyaret hacmi ve içerik etkileşimlerinin birlikte değerlendirilmesine imkân vermektedir. ";
 if(avg>=180)assessment+="Ortalama oturum süresinin üç dakikanın üzerinde olması, kullanıcıların site içinde anlamlı süre geçirdiğine işaret etmektedir. "; else if(avg>0)assessment+="Ortalama oturum süresi "+reportDuration(avg)+" düzeyindedir; içeriklerde daha uzun etkileşimi destekleyecek yönlendirmeler değerlendirilebilir. ";
 if(st.eCenterInteractions>0)assessment+="e-Merkez alanında "+st.eCenterInteractions+" ölçülebilir etkileşim kaydedilmiştir. ";
 assessment+="Bu değerlendirmeler yalnızca e-NetCoM analitik altyapısında seçilen dönem için kaydedilen verilere dayanmaktadır.";
 body+=docxP(assessment,{size:20,after:150});
 body+=docxP("METODOLOJİ NOTU",{style:"Heading1",bold:true,color:"176B52",size:26,before:220,after:100});
 body+=docxP("Oturum sayısı session_start kayıtlarından, tekil ziyaretçi sayısı anonim visitorId değerlerinden, dil ve cihaz dağılımları oturum başlangıçlarından hesaplanır. İl verileri harita etkileşimlerini ifade eder. Rapor, seçilen tarih filtresindeki kayıtları otomatik olarak özetler ve açıklayıcı değerlendirmeler üretir.",{size:18});
 const document='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>'+body+'<w:sectPr><w:footerReference w:type="default" r:id="rId1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:footer="550"/></w:sectPr></w:body></w:document>';
 const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="20"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/><w:outlineLvl w:val="0"/></w:style></w:styles>';
 const footer='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="6B7F77"/><w:sz w:val="17"/></w:rPr><w:t>e-NetCoM · ANALİTİK DEĞERLENDİRME RAPORU · </w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
 return zipStore([{name:"[Content_Types].xml",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'},{name:"_rels/.rels",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},{name:"word/_rels/document.xml.rels",data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},{name:"word/document.xml",data:document},{name:"word/styles.xml",data:styles},{name:"word/footer1.xml",data:footer}]);
}

function reportRangeFromReq(req){return {range:["24h","7d","30d","90d","1y","all","custom"].includes(req.query.range)?req.query.range:"30d",fromDate:String(req.query.from||""),toDate:String(req.query.to||"")};}

function printEsc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function printBars(title,items,total,maxItems=10){
 const rows=(items||[]).slice(0,maxItems),max=Math.max(1,...rows.map(x=>Number(x.count)||0));
 return '<section><h2>'+printEsc(title)+'</h2><div class="bars">'+rows.map(x=>{const n=Number(x.count)||0,w=Math.max(2,Math.round(n/max*100));return '<div class="barrow"><div class="barname">'+printEsc(x.name)+'</div><div class="track"><i style="width:'+w+'%"></i></div><div class="barval">'+n+' <small>%'+reportPct(n,total)+'</small></div></div>';}).join("")+'</div></section>';
}
function printShell(title,subtitle,body){
 return '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>'+printEsc(title)+'</title><style>'+
 '*{box-sizing:border-box}body{margin:0;font-family:Arial,"Segoe UI",sans-serif;color:#203b32;background:#e9efec}.page{width:210mm;min-height:297mm;margin:10mm auto;background:#fff;padding:18mm 17mm 20mm;box-shadow:0 4px 24px #0002;position:relative}.top{height:5mm;background:#173f34;position:absolute;left:0;right:0;top:0}.brand{text-align:center;margin-top:25mm;color:#176b52;font-size:34px;font-weight:800}.network{text-align:center;color:#6b7f77;font-size:10px;letter-spacing:.7px;margin:6px 0 28px}.title{text-align:center;font-size:25px;font-weight:800;color:#173f34}.subtitle{text-align:center;color:#536b62;margin-top:8px}.period{text-align:center;margin:34px 0 18px;color:#176b52;font-weight:700}.stats{background:#eef6f2;border-radius:12px;padding:18px;text-align:center;color:#176b52;font-weight:800;margin:0 auto;max-width:155mm}.meta{text-align:center;color:#71867d;font-size:11px;margin-top:30px}.pagebreak{break-before:page}.content{width:210mm;margin:0 auto;background:#fff;padding:15mm 17mm 20mm}h1{font-size:22px;color:#173f34;margin:0 0 14px}h2{font-size:14px;color:#176b52;background:#eaf4ef;padding:7px 9px;margin:20px 0 10px}p{font-size:11px;line-height:1.65;margin:7px 0}.kpis{display:grid;grid-template-columns:1fr 1fr;gap:8px}.kpi{border:1px solid #dce9e3;border-radius:8px;padding:10px}.kpi b{display:block;color:#176b52;font-size:16px}.barrow{display:grid;grid-template-columns:40mm 1fr 28mm;gap:8px;align-items:center;margin:7px 0;font-size:10px}.track{height:9px;background:#edf3f0;border-radius:5px;overflow:hidden}.track i{display:block;height:100%;background:#176b52;border-radius:5px}.barval{text-align:right;font-weight:700}.barval small{color:#71867d}.note{color:#536b62;border-left:3px solid #176b52;padding:8px 10px;background:#f6faf8}.entry{margin:8px 0;font-size:10.5px;line-height:1.55}.entry b{color:#176b52}.date{font-size:14px;font-weight:800;color:#176b52;background:#eaf4ef;padding:7px;margin-top:18px}@page{size:A4;margin:10mm}@media print{body{background:#fff}.page,.content{margin:0;box-shadow:none;width:auto}.no-print{display:none!important}.page{break-after:page}.content{padding-top:8mm}section{break-inside:avoid}}'+
 '</style></head><body>'+body+'<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),350));</script></body></html>';
}
function buildAnalyticsPrintHtml(range="30d",fromDate="",toDate=""){
 const st=buildAnalyticsStats(range,fromDate,toDate),visits=st.visits||0,unique=st.uniqueVisitors||0,events=st.totalEvents||0,avg=st.averageSessionSeconds||0;
 const devices=cleanAnalyticsItems(st.devices,"device"),languages=cleanAnalyticsItems(st.languages,"language"),sections=cleanAnalyticsItems(st.sections,"section"),downloads=cleanAnalyticsItems(st.downloads,"download"),videos=cleanVideoItems(st.videoOpens),referrers=cleanAnalyticsItems(st.referrers,"referrer"),provinces=st.provinceViews||[];
 const label=range==="custom"?fromDate+" – "+toDate:range==="all"?"Tüm kayıtlar":({"24h":"Son 24 saat","7d":"Son 7 gün","30d":"Son 30 gün","90d":"Son 90 gün","1y":"Son 1 yıl"}[range]||range);
 const now=new Date(),stamp=now.toLocaleDateString("tr-TR",{day:"2-digit",month:"long",year:"numeric",timeZone:"Europe/Istanbul"})+" · "+now.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Istanbul"})+" · Türkiye (UTC+3)";
 let body='<div class="page"><div class="top"></div><div class="brand">e-NetCoM</div><div class="network">ENVIRONMENTAL COMMUNICATION AND MEDIA NETWORK</div><div class="title">ANALİTİK DEĞERLENDİRME RAPORU</div><div class="subtitle">Web sitesi kullanım verilerinin yönetici odaklı analizi</div><div class="period">RAPOR DÖNEMİ<br><span style="color:#173f34;font-size:18px">'+printEsc(label)+'</span></div><div class="stats">'+visits+' oturum &nbsp; • &nbsp; '+unique+' tekil ziyaretçi &nbsp; • &nbsp; '+events+' analitik olayı</div><div class="meta">Oluşturulma: '+printEsc(stamp)+'<br><br><b>e-NetCoM Yönetim Merkezi · enetcomproject.com</b></div></div>';
 body+='<main class="content"><h1>Yönetici Özeti</h1><p>Seçilen dönemde e-NetCoM web sitesinde <b>'+visits+' oturum</b> ve <b>'+unique+' tekil ziyaretçi</b> kaydedilmiştir. Ortalama oturum süresi <b>'+printEsc(reportDuration(avg))+'</b>; toplam analitik etkileşim <b>'+events+'</b> olarak ölçülmüştür.</p><p class="note">'+printEsc(trafficInsight(st.daily))+'</p><h2>Temel Göstergeler</h2><div class="kpis"><div class="kpi">Toplam ziyaret<b>'+visits+'</b></div><div class="kpi">Tekil ziyaretçi<b>'+unique+'</b></div><div class="kpi">Ortalama oturum<b>'+printEsc(reportDuration(avg))+'</b></div><div class="kpi">e-Merkez etkileşimi<b>'+st.eCenterInteractions+'</b></div></div>'+printBars("Cihaz Dağılımı",devices,visits,6)+printBars("Dil Dağılımı",languages,visits,6)+printBars("Giriş Kaynakları",referrers,visits,8)+'</main>';
 body+='<main class="content pagebreak"><h1>İçerik Performansı</h1>'+printBars("En Çok Görüntülenen Bölümler",sections,sections.reduce((a,x)=>a+x.count,0),10)+printBars("En Çok Açılan Videolar",videos,videos.reduce((a,x)=>a+x.count,0),10)+printBars("En Çok İndirilen İçerikler",downloads,downloads.reduce((a,x)=>a+x.count,0),10)+'</main>';
 body+='<main class="content pagebreak"><h1>Coğrafi Etkileşim</h1>'+printBars("İl Haritası Etkileşimleri",provinces,provinces.reduce((a,x)=>a+x.count,0),15)+'<h2>Metodoloji</h2><p class="note">İl verileri ziyaretçinin fiziksel konumunu değil, e-NetCoM Türkiye haritasında açılan il detaylarını ifade eder. Rapor seçilen tarih filtresindeki anonim analitik kayıtlardan otomatik üretilir.</p></main>';
 return printShell("e-NetCoM Analitik Değerlendirme Raporu","",body);
}
function buildReleasePrintHtml(lang="tr"){
 const en=lang==="en",notes=en?RELEASE_NOTES_EN:RELEASE_NOTES,title=en?"DEVELOPMENT & RELEASE REPORT":"GELİŞTİRME VE SÜRÜM RAPORU",sub=en?"Project Development History":"Proje Geliştirme Tarihçesi",period=en?"September – October 2026":"Eylül – Ekim 2026";
 let body='<div class="page"><div class="top"></div><div class="brand">e-NetCoM</div><div class="network">ENVIRONMENTAL COMMUNICATION AND MEDIA NETWORK</div><div class="title">'+title+'</div><div class="subtitle">'+sub+'</div><div class="period">'+(en?"REPORTING PERIOD":"RAPOR DÖNEMİ")+'<br><span style="color:#173f34;font-size:18px">'+period+'</span></div><div class="stats">'+notes.length+' '+(en?"development records":"geliştirme kaydı")+' &nbsp; • &nbsp; '+new Set(notes.map(x=>x[1])).size+' '+(en?"work areas":"çalışma alanı")+'</div></div>';
 body+='<main class="content"><h1>'+(en?"Latest Updates":"Son Güncellemeler")+'</h1>'+notes.slice(0,8).map(([,a,n])=>'<div class="entry"><b>• '+printEsc(a)+' — </b>'+printEsc(n)+'</div>').join("")+'<h1 style="margin-top:28px">'+(en?"Chronological Development Record":"Kronolojik Geliştirme Kaydı")+'</h1>';
 let last="";for(const [d,a,n] of notes){if(d!==last){body+='<div class="date">'+printEsc(releaseLabel(d,en?"en":"tr"))+'</div>';last=d;}body+='<div class="entry"><b>• '+printEsc(a)+' — </b>'+printEsc(n)+'</div>';}body+='</main>';
 return printShell(title,sub,body);
}

app.get("/api/admin/analytics-report.print",requireAdmin,(req,res)=>{const {range,fromDate,toDate}=reportRangeFromReq(req);res.type("html").send(buildAnalyticsPrintHtml(range,fromDate,toDate));});
app.get("/api/admin/release-notes.print",requireAdmin,(req,res)=>{const lang=String(req.query.lang||"tr").toLowerCase()==="en"?"en":"tr";res.type("html").send(buildReleasePrintHtml(lang));});

app.get("/api/admin/analytics-report.docx",requireAdmin,(req,res)=>{try{const range=["24h","7d","30d","90d","1y","all","custom"].includes(req.query.range)?req.query.range:"30d",fromDate=String(req.query.from||""),toDate=String(req.query.to||"");const buffer=buildAnalyticsEvaluationDocx(range,fromDate,toDate),stamp=new Date().toISOString().slice(0,10);res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.wordprocessingml.document");res.setHeader("Content-Disposition",'attachment; filename="e-NetCoM_Analitik_Degerlendirme_Raporu_'+stamp+'.docx"');res.setHeader("Cache-Control","no-store");res.send(buffer);}catch(err){console.error("Analytics evaluation DOCX error:",err);res.status(500).json({error:"Analitik değerlendirme raporu oluşturulamadı."});}});

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
