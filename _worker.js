// Cloudflare Pages Advanced Mode Worker (_worker.js)
// Serves static assets via env.ASSETS and provides /tts neural Italian HD voice synthesis (0 EUR, zero external server).

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const SEC_MS_GEC_VERSION = "2-143.0.3650.75";
const WIN_EPOCH = 11644473600;

const SHA256_INITIAL = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];
const SHA256_STATE = [
  0xfd9fbea2, 0x91243ce7, 0xbe499094, 0xcd2e1e0a,
  0x6c006f49, 0x04bd35ab, 0xfeb0a7e4, 0x03effbd2,
];
const SHA256_SCHEDULE = [
  0xeb24bf9e, 0x1558691f, 0xa0c09ee2, 0x0cfa32ba,
  0xa622ee8c, 0xd1dd9491, 0xc0dd25a0, 0xf9e70ab6,
  0xf0c31573, 0x7058ce4e, 0x7188e606, 0x00e5ab33,
  0xd258b060, 0x72766564,
];
const SHA256_ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];
const SHA256_ADJUSTMENT = 0xc9dc06a7;
const SHA256_BLOCK_CONSTANTS = SHA256_ROUND_CONSTANTS.map((v, i) => (i === 14 ? SHA256_ADJUSTMENT : v));
const SHA256_SIGMA0_ADJUSTMENT = 0x059c0b80;
const SHA256_SIGMA1_ADJUSTMENT = 0x000b92c0;

const CS64_COEFFICIENTS = [
  [0xe82e91b1, 0xb32700d0], [0x44de24c6, 0x88dff51d],
  [0x3beb65bc, 0x29514038], [0xc89c5933, 0xb328cbdf],
  [0x8d1ec211, 0xd405b4d5], [0x314ef5d5, 0x26e55f3c],
  [0xe92491b1, 0x607801c6], [0xf0a5b9d5, 0x82b2c1fb],
  [0x06064cf3, 0xfa51a3da], [0xda79fa60, 0x207cc464],
  [0xbed20560, 0x3c3c74f3], [0x89f9c9f8, 0xd2d14b61],
  [0x35fa38c6, 0xbb04a2c1], [0xcb49e3c6, 0xc5626167],
];
const CS64_FACTOR = 0x82893933;
const CS64_ADJUSTMENT0 = 0xf2f90b1a;
const CS64_ADJUSTMENT1 = 0x0b1a0000;

function rotr(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }
function rol16(v) { v = v >>> 0; return ((v << 16) | (v >>> 16)) >>> 0; }
function sigma0(v) { v = v >>> 0; return (rotr(v, 7) ^ rotr(v, 18) ^ (v >>> 3)) >>> 0; }
function sigma1(v) { v = v >>> 0; return (rotr(v, 17) ^ rotr(v, 19) ^ (v >>> 10)) >>> 0; }
function add32(...vals) { let s = 0; for (let i = 0; i < vals.length; i++) s = (s + (vals[i] >>> 0)) >>> 0; return s; }
function mul32(a, b) { return Math.imul(a >>> 0, b >>> 0) >>> 0; }

function sha256Rounds(state, words, firstRound = 0) {
  let [a, b, c, d, e, f, g, h] = state.map((x) => x >>> 0);
  const constants = firstRound === 14 ? SHA256_BLOCK_CONSTANTS : SHA256_ROUND_CONSTANTS;
  for (let i = firstRound; i < 64; i++) {
    const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
    const ch = (g ^ (e & (f ^ g))) >>> 0;
    const t1 = add32(h, S1, ch, constants[i], words[i]);
    const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
    const maj = ((a & b) | (c & (a | b))) >>> 0;
    const t2 = add32(S0, maj);
    h = g; g = f; f = e; e = add32(d, t1); d = c; c = b; b = a; a = add32(t1, t2);
  }
  return [a, b, c, d, e, f, g, h];
}

function expandSchedule(words, firstWord = 16) {
  for (let i = firstWord; i < 64; i++) {
    words[i] = add32(sigma1(words[i - 2]), words[i - 7], sigma0(words[i - 15]), words[i - 16]);
  }
}

function sha256Init(data7) {
  const words = new Array(64).fill(0);
  words[14] = ((data7[0] << 16) | (data7[1] << 8) | data7[2]) >>> 0;
  words[15] = ((data7[3] << 24) | (data7[4] << 16) | (data7[5] << 8) | data7[6]) >>> 0;
  for (let i = 16; i < 30; i++) {
    let val = SHA256_SCHEDULE[i - 16] >>> 0;
    if (i - 2 >= 14) {
      const s1 = sigma1(words[i - 2]);
      val = add32(val, i === 16 ? ((s1 ^ SHA256_SIGMA1_ADJUSTMENT) >>> 0) : s1);
    }
    if (i - 7 >= 14) val = add32(val, words[i - 7]);
    if (i - 15 >= 14) {
      const s0 = sigma0(words[i - 15]);
      val = add32(val, i === 29 ? ((s0 ^ SHA256_SIGMA0_ADJUSTMENT) >>> 0) : s0);
    }
    words[i] = val;
  }
  words[30] = add32(sigma1(words[28]), words[23], sigma0(words[15]), words[14], (SHA256_ADJUSTMENT - SHA256_ROUND_CONSTANTS[14]) >>> 0);
  expandSchedule(words, 31);
  const working = sha256Rounds(SHA256_STATE, words, 14);
  return SHA256_INITIAL.map((x, idx) => add32(x, working[idx]));
}

function sha256Digest(data) {
  const length = 57 + data.length;
  const rem = data.slice(7);
  const padZeros = (((55 - length) % 64) + 64) % 64;
  const padded = new Uint8Array(rem.length + 1 + padZeros + 8);
  padded.set(rem, 0);
  padded[rem.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setBigUint64(padded.length - 8, BigInt(length) * 8n, false);

  let state = sha256Init(data.slice(0, 7));
  for (let off = 0; off < padded.length; off += 64) {
    const words = new Array(64).fill(0);
    for (let j = 0; j < 16; j++) words[j] = dv.getUint32(off + j * 4, false);
    expandSchedule(words, 16);
    const working = sha256Rounds(state, words, 0);
    state = state.map((x, idx) => add32(x, working[idx]));
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) odv.setUint32(i * 4, state[i], false);
  return out;
}

function wordsLe4Even(data) {
  const pad = (4 - (data.length % 4)) % 4;
  const buf = new Uint8Array(data.length + pad);
  buf.set(data, 0);
  const dv = new DataView(buf.buffer);
  const words = [];
  for (let i = 0; i < buf.length; i += 4) words.push(dv.getUint32(i, true));
  if (words.length % 2 === 1) words.push(0);
  return words;
}

function cs64Digest(data, digest) {
  const ddv = new DataView(digest.buffer, digest.byteOffset, digest.byteLength);
  const keyA = (ddv.getUint32(0, true) | 1) >>> 0;
  const keyB = (ddv.getUint32(4, true) | 1) >>> 0;
  const factors = [mul32(keyA, CS64_FACTOR), mul32(keyB, CS64_FACTOR)];
  const terms = CS64_COEFFICIENTS.map(([c], idx) => mul32(c, factors[idx % 2]));
  const offsets = CS64_COEFFICIENTS.map(([, o]) => o >>> 0);

  const prefixed = new Uint8Array(1 + data.length);
  prefixed.set(data, 1);
  const wList = wordsLe4Even(prefixed);
  for (let idx = 0; idx < wList.length; idx++) {
    const word = wList[idx];
    let term = mul32(word, idx % 2 === 0 ? keyA : keyB);
    let offset = mul32(rol16(word), idx % 2 === 0 ? 0xef0569fb : 0xc31713db);
    if (idx === 0) {
      term = add32(term, mul32(CS64_ADJUSTMENT0, factors[0]));
      offset = add32(offset, CS64_ADJUSTMENT1);
    }
    terms.push(term);
    offsets.push(offset);
  }

  let swapAcc = 0, swapLast = 0, state = 0, acc = 0;
  for (let idx = 0; idx < terms.length; idx += 2) {
    const x = terms[idx], y = terms[idx + 1];
    let t = rol16(add32(offsets[idx], x));
    let q = mul32(t, 0x76f50f34);
    swapAcc = add32(swapAcc, add32(mul32(rol16(q), 0xc3efea97), q));

    t = rol16(add32(offsets[idx + 1], y));
    q = mul32(t, 0x1881ce3c);
    swapLast = add32(mul32(rol16(q), 0x35bd1ec9), q);
    swapAcc = add32(swapAcc, swapLast);

    state = add32(mul32(state, keyA), x);
    state = mul32(rol16(state), 0xcf98b111);
    state = mul32(rol16(state), 0x87085b9f);
    state = mul32(rol16(state), 0x12ceb96d);
    state = mul32(rol16(state), 0x257e1d83);
    acc = add32(acc, state);

    t = add32(mul32(state, keyB), y);
    t = mul32(rol16(t), 0xa27416f5);
    t = mul32(rol16(t), 0xd38396ff);
    state = mul32(rol16(mul32(rol16(t), 0x7c932b89)), 0xbfa49f69);
    acc = add32(acc, state);
  }
  const out = new Uint8Array(8);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, (swapLast ^ state) >>> 0, true);
  odv.setUint32(4, (swapAcc ^ acc) >>> 0, true);
  return out;
}

function toHexUpper(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function generateSecMsGecV2(unixSeconds) {
  let ticks = Math.floor(unixSeconds !== undefined ? unixSeconds : Date.now() / 1000);
  ticks += WIN_EPOCH;
  ticks -= ticks % 300;
  const ticksStr = (BigInt(ticks) * 10000000n).toString() + TRUSTED_CLIENT_TOKEN;
  const enc = new TextEncoder().encode(ticksStr);
  const digest = sha256Digest(enc);
  const cs64 = cs64Digest(enc, digest);
  return `${toHexUpper(cs64)}-${toHexUpper(digest)}`;
}

function edgeDateToString() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${days[d.getUTCDay()]} ${months[d.getUTCMonth()]} ${pad(d.getUTCDate())} ${d.getUTCFullYear()} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} GMT+0000 (Coordinated Universal Time)`
  );
}

function isFemaleVoice(rawVoice) {
  const v = String(rawVoice || "").toLowerCase();
  return v.includes("elsa") || v.includes("isabella") || v.includes("fabiola") || v.includes("palmira") || v.includes("imelda") || v.includes("irma") || v.includes("female");
}

function normalizeEdgeVoice(rawVoice) {
  const v = String(rawVoice || "").toLowerCase();
  if (v.includes("elsa")) return "Microsoft Server Speech Text to Speech Voice (it-IT, ElsaNeural)";
  if (isFemaleVoice(v)) return "Microsoft Server Speech Text to Speech Voice (it-IT, IsabellaNeural)";
  return "Microsoft Server Speech Text to Speech Voice (it-IT, GiuseppeMultilingualNeural)";
}

function randomHex(byteLen) {
  const b = new Uint8Array(byteLen);
  crypto.getRandomValues(b);
  return toHexUpper(b);
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function mergeUint8Arrays(chunks) {
  let total = 0;
  for (const c of chunks) total += c.length;
  const merged = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    merged.set(c, off);
    off += c.length;
  }
  return merged;
}

async function synthesizeEdgeMp3(text, voice, rate, pitch) {
  const connId = randomHex(16).toLowerCase();
  const muid = randomHex(16);
  const gec = generateSecMsGecV2();
  const httpsUrl =
    `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
    `?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
    `&ConnectionId=${connId}` +
    `&Sec-MS-GEC=${gec}` +
    `&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

  const resp = await fetch(httpsUrl, {
    headers: {
      Upgrade: "websocket",
      Pragma: "no-cache",
      "Cache-Control": "no-cache",
      Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
      Cookie: `muid=${muid};`,
    },
  });

  const ws = resp.webSocket;
  if (!ws) throw new Error(`WS upgrade failed: ${resp.status}`);

  const chunks = [];
  const donePromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { ws.close(); } catch (_) {}
      chunks.length ? resolve() : reject(new Error("Edge WS timeout"));
    }, 3800);

    ws.addEventListener("message", (ev) => {
      if (typeof ev.data === "string") {
        if (ev.data.includes("Path:turn.end")) {
          clearTimeout(timer);
          try { ws.close(); } catch (_) {}
          resolve();
        }
      } else if (ev.data instanceof ArrayBuffer || ArrayBuffer.isView(ev.data)) {
        const u8 = ev.data instanceof ArrayBuffer
          ? new Uint8Array(ev.data)
          : new Uint8Array(ev.data.buffer, ev.data.byteOffset, ev.data.byteLength);
        if (u8.length > 2) {
          const hdrLen = (u8[0] << 8) | u8[1];
          if (2 + hdrLen < u8.length) {
            const hdr = new TextDecoder().decode(u8.subarray(2, 2 + hdrLen));
            if (hdr.includes("Path:audio")) {
              chunks.push(u8.subarray(2 + hdrLen));
            }
          }
        }
      }
    });
    ws.addEventListener("error", (err) => {
      clearTimeout(timer);
      chunks.length ? resolve() : reject(err);
    });
    ws.addEventListener("close", () => {
      clearTimeout(timer);
      chunks.length ? resolve() : reject(new Error("Edge WS closed without audio"));
    });
  });

  // Attach listeners BEFORE accept() + send() so zero frames are missed
  ws.accept();

  const nowStr = edgeDateToString();
  ws.send(
    `X-Timestamp:${nowStr}\r\n` +
      `Content-Type:application/json; charset=utf-8\r\n` +
      `Path:speech.config\r\n\r\n` +
      `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"true","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`
  );

  const ssml =
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
    `<voice name='${escapeXml(voice)}'>` +
    `<prosody pitch='${escapeXml(pitch)}' rate='${escapeXml(rate)}' volume='+0%'>` +
    `${escapeXml(text)}` +
    `</prosody></voice></speak>`;

  ws.send(
    `X-RequestId:${connId}\r\n` +
      `Content-Type:application/ssml+xml\r\n` +
      `X-Timestamp:${nowStr}Z\r\n` +
      `Path:ssml\r\n\r\n` +
      ssml
  );

  await donePromise;
  if (!chunks.length) throw new Error("Empty Edge audio");
  return mergeUint8Arrays(chunks);
}

function splitBytesSafe(str, maxBytes = 200) {
  const words = str.split(/\s+/).filter(Boolean);
  const parts = [];
  let cur = "";
  const enc = new TextEncoder();
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (enc.encode(cand).length <= maxBytes) {
      cur = cand;
    } else {
      if (cur) parts.push(cur);
      cur = w;
    }
  }
  if (cur) parts.push(cur);
  return parts.length ? parts : [str.slice(0, 180)];
}

function base64ToUint8Array(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function synthesizeFallbackNeuralMp3(text, female) {
  if (!female) {
    // Voce maschile italiana Neurale calda e naturale (it_male_m18)
    const segs = splitBytesSafe(text, 200);
    const audioParts = [];
    for (const seg of segs) {
      const r = await fetch("https://tiktok-tts.weilnet.workers.dev/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: seg, voice: "it_male_m18" }),
      });
      if (!r.ok) throw new Error(`Fallback male HTTP ${r.status}`);
      const j = await r.json();
      if (!j || !j.data) throw new Error("Fallback male empty data");
      audioParts.push(base64ToUint8Array(j.data));
    }
    return mergeUint8Arrays(audioParts);
  } else {
    // Voce femminile italiana pulita
    const segs = splitBytesSafe(text, 180);
    const audioParts = [];
    for (const seg of segs) {
      const gUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=it&q=${encodeURIComponent(seg)}`;
      const r = await fetch(gUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!r.ok) throw new Error(`Fallback female HTTP ${r.status}`);
      audioParts.push(new Uint8Array(await r.arrayBuffer()));
    }
    return mergeUint8Arrays(audioParts);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/tts") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
          },
        });
      }
      const text = (url.searchParams.get("text") || "").trim().slice(0, 650);
      if (!text) return new Response("Missing text", { status: 400 });

      const rawVoice = url.searchParams.get("voice") || "it-IT-GiuseppeMultilingualNeural";
      const female = isFemaleVoice(rawVoice);
      const edgeVoice = normalizeEdgeVoice(rawVoice);
      const rate = url.searchParams.get("rate") || "-1%";
      const pitch = url.searchParams.get("pitch") || "+0Hz";

      try {
        const mp3 = await synthesizeEdgeMp3(text, edgeVoice, rate, pitch);
        return new Response(mp3, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "X-TTS-Engine": "edge-neural-hd",
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (_) {
        try {
          const mp3Fallback = await synthesizeFallbackNeuralMp3(text, female);
          return new Response(mp3Fallback, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "X-TTS-Engine": female ? "neural-it-female" : "neural-it-male",
              "Cache-Control": "public, max-age=86400",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err2) {
          return new Response(String(err2 && err2.message ? err2.message : err2), {
            status: 502,
            headers: { "Access-Control-Allow-Origin": "*" },
          });
        }
      }
    }
    return env.ASSETS.fetch(request);
  },
};
