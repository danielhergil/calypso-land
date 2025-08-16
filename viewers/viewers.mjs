#!/usr/bin/env node
// viewers_from_channel.mjs — ESM (Node 18+)
// Uso: node viewers_from_channel.mjs <CHANNEL_ID>
// Devuelve viewers solo si el canal está EN DIRECTO ahora mismo.
// Evita falsos positivos (vídeos destacados/recientes).

import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

const YT_WATCH = (id) => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
const YT_LIVE_CHANNEL = (uc) => `https://www.youtube.com/channel/${encodeURIComponent(uc)}/live`;

async function fetchText(url, opts = {}) {
  const r = await fetch(url, {
    redirect: opts.redirect ?? "follow",
    headers: {
      "User-Agent": UA,
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...(opts.headers || {}),
    },
  });
  if (!r.ok && !(r.status >= 300 && r.status < 400)) {
    throw new Error(`HTTP ${r.status} al solicitar ${url}`);
  }
  return { r, text: r.status >= 300 ? "" : await r.text() };
}

function extractJsonFromHtml(html, varName) {
  // varName = {...};
  const re1 = new RegExp(`${varName}\\s*=\\s*(\\{[\\s\\S]*?\\});`, "m");
  const m1 = html.match(re1);
  if (m1) { try { return JSON.parse(m1[1]); } catch {} }
  // "varName": {...}
  const re2 = new RegExp(`"${varName}"\\s*:\\s*(\\{[\\s\\S]*?\\})\\s*(,|\\})`, "m");
  const m2 = html.match(re2);
  if (m2) { try { return JSON.parse(m2[1]); } catch {} }
  return null;
}

function extractNumberFromText(s) {
  if (!s) return null;
  const normalized = s.replace(/\u00A0/g, " ");
  const match = normalized.match(/(\d{1,3}([.,\s]\d{3})*|\d+)/);
  if (!match) return null;
  const digits = match[0].replace(/[.,\s]/g, "");
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

function deepPickConcurrentViewers(obj) {
  try {
    const found = [];
    const walk = (o) => {
      if (!o || typeof o !== "object") return;

      if (o.viewCount?.runs && Array.isArray(o.viewCount.runs)) {
        const text = o.viewCount.runs.map((r) => r.text).join(" ");
        const n = extractNumberFromText(text);
        if (n !== null) found.push(n);
      }
      if (o.viewCount?.simpleText && typeof o.viewCount.simpleText === "string") {
        const n = extractNumberFromText(o.viewCount.simpleText);
        if (n !== null) found.push(n);
      }
      if (o.runs && Array.isArray(o.runs)) {
        const joined = o.runs.map((r) => r.text).filter(Boolean).join(" ");
        if (/(watching now|espectadores|mirando ahora|viendo ahora)/i.test(joined)) {
          const n = extractNumberFromText(joined);
          if (n !== null) found.push(n);
        }
      }
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === "string" && /(watching now|espectadores|mirando ahora|viendo ahora)/i.test(v)) {
          const n = extractNumberFromText(v);
          if (n !== null) found.push(n);
        } else if (v && typeof v === "object") {
          walk(v);
        }
      }
    };
    walk(obj);
    return found.find((n) => Number.isFinite(n) && n >= 0) ?? null;
  } catch { return null; }
}

/** Verifica en la página del vídeo si realmente está EN DIRECTO ahora */
function isLiveNowFromHtml(html) {
  // Indicadores fuertes:
  // 1) JSON player microformat → ...liveBroadcastDetails.isLiveNow === true
  const player = extractJsonFromHtml(html, "ytInitialPlayerResponse");
  const isLiveNow =
    player?.microformat?.playerMicroformatRenderer?.liveBroadcastDetails?.isLiveNow === true;

  // 2) A veces aparece "isLiveNow": true suelto en otros bloques
  const regexIsLive = /"isLiveNow"\s*:\s*true/;
  const hasIsLiveFlag = regexIsLive.test(html);

  // 3) Presencia de textos "watching now"/"espectadores" en contadores del vivo
  const hasWatchingNow = /(watching now|espectadores|mirando ahora|viendo ahora)/i.test(html);

  return Boolean(isLiveNow || hasIsLiveFlag || hasWatchingNow);
}

/** Resuelve videoId SOLO si el canal está en vivo; si no, devuelve null */
async function resolveLiveVideoIdStrict(channelId) {
  // Intento 1: redirección explícita
  const { r, text } = await fetchText(YT_LIVE_CHANNEL(channelId), { redirect: "manual" });

  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get("location");
    if (loc) {
      const m = String(loc).match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (m) return m[1];
      const mAbs = String(loc).match(/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (mAbs) return mAbs[1];
    }
  }

  // Intento 2: sin redirección, nos aseguramos de NO devolver un vídeo cualquiera.
  // Volvemos a pedir siguiendo redirecciones (por si YouTube sirvió HTML directo).
  let html = text;
  if (!html) {
    const second = await fetchText(YT_LIVE_CHANNEL(channelId), { redirect: "follow" });
    html = second.text;
  }
  if (!html) return null;

  // Busca un videoId candidato en el HTML...
  const mVid = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
  if (!mVid) return null;

  const candidate = mVid[1];

  // Verifica en la página del vídeo que REALMENTE esté en vivo
  const { text: watchHtml } = await fetchText(YT_WATCH(candidate));
  if (isLiveNowFromHtml(watchHtml)) return candidate;

  // Si no pasa la verificación, asumimos que NO hay directo ahora
  return null;
}

export async function getConcurrentViewersFromChannel(channelId) {
  const videoId = await resolveLiveVideoIdStrict(channelId);
  if (!videoId) {
    return { channelId, videoId: null, liveViewers: null, note: "El canal no está en directo" };
  }

  // Si está en vivo, extraemos viewers
  const { text: html } = await fetchText(YT_WATCH(videoId));
  const initialData = extractJsonFromHtml(html, "ytInitialData");
  const playerResp = extractJsonFromHtml(html, "ytInitialPlayerResponse");

  let liveViewers = initialData ? deepPickConcurrentViewers(initialData) : null;
  if (liveViewers === null && playerResp) {
    const fallback = deepPickConcurrentViewers(playerResp);
    if (fallback !== null) liveViewers = fallback;
  }
  if (liveViewers === null) {
    const m = html.match(/(\d[\d.,\s]*)\s*(watching now|espectadores|mirando ahora|viendo ahora)/i);
    if (m) liveViewers = extractNumberFromText(m[1]);
  }

  return { channelId, videoId, liveViewers };
}

// --- CLI ---
const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === thisFile) {
  const channelId = process.argv[2];
  if (!channelId || !channelId.startsWith("UC")) {
    console.error("Uso: node viewers_from_channel.mjs <CHANNEL_ID_UC…>");
    process.exit(1);
  }
  getConcurrentViewersFromChannel(channelId)
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      if (!res.videoId) process.exitCode = 3; // no estaba en directo
    })
    .catch((e) => {
      console.error("Error:", e.message);
      process.exit(2);
    });
}
