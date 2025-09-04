/* NOVA Multi-AI — v0.1.6 (broadcast + robust chunks + hide player option)
   - TTS now reliably plays for ALL recipients when AI is public.
   - Chunk assembly is race-proof (no "done before chunks" drop).
   - /w <AIName> <text> whispers to that AI; reply + audio go ONLY to the whisperer.
   - Hides "UI Language" setting from players (visible to GMs only).
*/

const MODULE_ID = "nova-multiai";
console.log(`[${MODULE_ID}] loaded`);

/* ---------------- L10N ---------------- */
const L10N = {
  en: {
    counter_characters: "Maximum suggested characters: {n}",
    combined_label: "Combined (Personality + Knowledge): {n} characters",
    focus_hint:
      "Hint: very long prompts/notes can make the model lose focus. Keep things focused and relevant.",

    hint_personality:
      "Personality: instructions for how this AI speaks and behaves. Keep it concise and actionable—role, tone, boundaries (e.g., only ship knowledge; defer when unsure), and any hard rules. Tip: ask ChatGPT to draft a concise persona you can paste here.",
    hint_knowledge:
      "Knowledge Notes: factual campaign notes this AI can cite—places, NPCs, dates, ship data. Use short bullet-like statements and proper nouns. Avoid prose or meta-instructions; keep notes current and focused.",

    settings_enabled_name: "Enable AI Responses (Kill Switch)",
    settings_openai_name: "OpenAI API Key",
    settings_eleven_name: "ElevenLabs API Key",
    settings_gmpreview_name: "GM: Preview AI voices",
    settings_gmpreview_hint: "When ON, the GM also hears TTS. (GM-only setting.)",

    ui_language: "UI Language",
    ui_language_hint: "Change labels and help text for this module.",
    ui_language_auto: "Auto (use Foundry)",

    slider_label: "AI Answer Length Limit",
    slider_hint:
      "Global cap on a single AI reply. Suggested range: 200–1,200 characters. Default 600 for a concise answer.",

    field_enabled: "Enabled",
    field_nameTrigger: "Name / Trigger",
    field_actorSpeakAs: "Actor to Speak As",
    field_voiceId: "ElevenLabs Voice ID",
    field_personality: "Personality",
    field_knowledge: "Knowledge Notes",
    field_access: "Access (Player Names or ALL)"
  },

  fr: {
    counter_characters: "Nombre maximal suggéré de caractères : {n}",
    combined_label: "Total (Personnalité + Connaissances) : {n} caractères",
    focus_hint:
      "Astuce : des textes très longs peuvent faire perdre le fil au modèle. Restez concis et pertinent.",

    hint_personality:
      "Personnalité : consignes sur la voix et le comportement de l’IA. Soyez concis et actionnable—rôle, ton, limites (ex. uniquement les connaissances du vaisseau ; s’abstenir en cas de doute) et règles strictes. Astuce : demandez à ChatGPT de rédiger une persona concise.",
    hint_knowledge:
      "Notes de connaissances : faits que l’IA peut citer—lieux, PNJ, dates, données du vaisseau. Utilisez des puces courtes et des noms propres. Évitez la prose et les méta-consignes ; maintenez à jour.",

    settings_enabled_name: "Activer les réponses de l’IA (coupure générale)",
    settings_openai_name: "Clé API OpenAI",
    settings_eleven_name: "Clé API ElevenLabs",
    settings_gmpreview_name: "MJ : pré-écouter les voix de l’IA",
    settings_gmpreview_hint:
      "Si activé, le MJ entend aussi la synthèse vocale. (Paramètre MJ uniquement.)",

    ui_language: "Langue de l’interface",
    ui_language_hint: "Changer les libellés et aides de ce module.",
    ui_language_auto: "Auto (langue de Foundry)",

    slider_label: "Limite de longueur des réponses",
    slider_hint:
      "Limite globale par réponse. Plage conseillée : 200–1 200 caractères. Valeur par défaut : 600.",

    field_enabled: "Activé",
    field_nameTrigger: "Nom / Déclencheur",
    field_actorSpeakAs: "Acteur (parler en tant que)",
    field_voiceId: "ID de voix ElevenLabs",
    field_personnalité: "Personnalité",
    field_knowledge: "Notes de connaissances",
    field_access: "Accès (noms des joueurs ou ALL)"
  },

  de: {
    counter_characters: "Empfohlene maximale Zeichen: {n}",
    combined_label: "Gesamt (Persönlichkeit + Wissen): {n} Zeichen",
    focus_hint:
      "Hinweis: Sehr lange Eingaben können das Modell unkonzentriert machen. Prägnant und relevant bleiben.",

    hint_personality:
      "Persönlichkeit: Anweisungen für Stimme und Verhalten der KI. Kurz und umsetzbar—Rolle, Ton, Grenzen (z. B. nur Schiffswissen; bei Unsicherheit zurückhalten) und feste Regeln. Tipp: Lass dir von ChatGPT eine knappe Persona entwerfen.",
    hint_knowledge:
      "Wissensnotizen: Fakten, die die KI zitieren darf—Orte, NSCs, Daten. Kurze Stichpunkte und Eigennamen verwenden. Keine Prosa oder Meta-Regeln; aktuell halten.",

    settings_enabled_name: "KI-Antworten aktivieren (Hauptschalter)",
    settings_openai_name: "OpenAI API-Schlüssel",
    settings_eleven_name: "ElevenLabs API-Schlüssel",
    settings_gmpreview_name: "SL: KI-Stimmen vorhören",
    settings_gmpreview_hint:
      "Wenn AN, hört der SL die TTS-Ausgabe mit. (Nur für SL.)",

    ui_language: "UI-Sprache",
    ui_language_hint: "Beschriftungen und Hilfetexte dieses Moduls umstellen.",
    ui_language_auto: "Auto (Foundry verwenden)",

    slider_label: "Antwortlängen-Limit der KI",
    slider_hint:
      "Globales Limit pro Antwort. Empfohlen: 200–1 200 Zeichen. Standard 600.",

    field_enabled: "Aktiviert",
    field_nameTrigger: "Name / Auslöser",
    field_actorSpeakAs: "Als Schauspieler sprechen",
    field_voiceId: "ElevenLabs Voice-ID",
    field_personality: "Persönlichkeit",
    field_knowledge: "Wissensnotizen",
    field_access: "Zugriff (Spielernamen oder ALL)"
  },

  es: {
    counter_characters: "Máximo sugerido de caracteres: {n}",
    combined_label: "Total (Personalidad + Conocimientos): {n} caracteres",
    focus_hint:
      "Sugerencia: textos muy largos pueden dispersar al modelo. Mantén el foco y la relevancia.",

    hint_personality:
      "Personalidad: instrucciones sobre cómo habla y actúa la IA. Sé conciso y accionable—rol, tono, límites (p. ej., solo conocimiento de la nave; abstenerse si hay duda) y reglas estrictas. Consejo: pídele a ChatGPT una persona concisa.",
    hint_knowledge:
      "Notas de conocimiento: hechos que la IA puede citar—lugares, PNJ, fechas, datos de la nave. Usa viñetas cortas y nombres propios. Evita la prosa y las meta-instrucciones; mantenlas actualizadas.",

    settings_enabled_name: "Habilitar respuestas de IA (interruptor general)",
    settings_openai_name: "Clave API de OpenAI",
    settings_eleven_name: "Clave API de ElevenLabs",
    settings_gmpreview_name: "DJ: previsualizar voces de IA",
    settings_gmpreview_hint:
      "Si está activado, el DJ también escucha la TTS. (Solo DJ.)",

    ui_language: "Idioma de la interfaz",
    ui_language_hint: "Cambia etiquetas y ayudas de este módulo.",
    ui_language_auto: "Auto (usar Foundry)",

    slider_label: "Límite de longitud de respuesta",
    slider_hint:
      "Límite global por respuesta. Rango sugerido: 200–1.200 caracteres. Valor por defecto: 600.",

    field_enabled: "Activado",
    field_nameTrigger: "Nombre / Disparador",
    field_actorSpeakAs: "Hablar como Actor",
    field_voiceId: "ID de voz de ElevenLabs",
    field_personality: "Personalidad",
    field_knowledge: "Notas de conocimiento",
    field_access: "Acceso (nombres de jugadores o ALL)"
  },

  ja: {
    counter_characters: "推奨最大文字数: {n}",
    combined_label: "合計（人格 + ナレッジ）: {n} 文字",
    focus_hint: "ヒント：長すぎる文章はモデルの集中を失わせます。要点を簡潔に。",

    hint_personality:
      "人格：このAIの話し方や振る舞いの指示。簡潔で実行可能に—役割、口調、制約（例：艦の知識のみ・不確実なら控える）、厳守事項。ヒント：ChatGPTに短いペルソナ案を作らせて貼り付け。",
    hint_knowledge:
      "ナレッジ：AIが引用できる事実のメモ—場所、NPC、日付、艦のデータ。短い箇条書きと固有名詞を使用。散文やメタ指示は避け、最新に保つ。",

    settings_enabled_name: "AI応答を有効化（緊急停止）",
    settings_openai_name: "OpenAI APIキー",
    settings_eleven_name: "ElevenLabs APIキー",
    settings_gmpreview_name: "GM：AI音声をプレビュー",
    settings_gmpreview_hint: "ON の場合、GM もTTSを聞きます。（GM限定）",

    ui_language: "UI 言語",
    ui_language_hint: "このモジュールのラベルとヘルプを切り替えます。",
    ui_language_auto: "自動（Foundryに合わせる）",

    slider_label: "AIの回答文字数上限",
    slider_hint:
      "1回答の上限。推奨範囲：200～1,200 文字。既定値 600（簡潔）。",

    field_enabled: "有効",
    field_nameTrigger: "名前 / トリガー",
    field_actorSpeakAs: "話すアクター",
    field_voiceId: "ElevenLabs Voice ID",
    field_personality: "人格",
    field_knowledge: "ナレッジ",
    field_access: "アクセス（プレイヤー名 または ALL）"
  }
};

function getFoundryLang() {
  const raw =
    (game?.i18n?.lang || game?.settings?.get?.("core", "language") || "en").toLowerCase();
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("fr")) return "fr";
  if (raw.startsWith("de")) return "de";
  if (raw.startsWith("es")) return "es";
  if (raw.startsWith("ja")) return "ja";
  return "en";
}
function getUILang() {
  const sel = game.settings.get(MODULE_ID, "uiLanguage");
  if (sel === "auto") return getFoundryLang();
  return sel || "en";
}
function t(key, repl = {}) {
  const lang = getUILang();
  const tbl = L10N[lang] || L10N.en;
  const base = tbl[key] ?? L10N.en[key] ?? key;
  return Object.entries(repl).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), base);
}

/* --------------- SETTINGS --------------- */
Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "enabled", {
    name: "Enable AI Responses (Kill Switch)",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "openaiKey", {
    name: "OpenAI API Key",
    scope: "world",
    config: true,
    type: String,
    default: "",
    secret: true
  });

  game.settings.register(MODULE_ID, "elevenKey", {
    name: "ElevenLabs API Key",
    scope: "world",
    config: true,
    type: String,
    default: "",
    secret: true
  });

  game.settings.register(MODULE_ID, "gmPreviewTTS", {
    name: "GM: Preview AI voices",
    hint: "",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // client setting (hidden for non-GM later in renderSettingsConfig)
  game.settings.register(MODULE_ID, "uiLanguage", {
    name: "UI Language",
    hint: "",
    scope: "client",
    config: true,
    type: String,
    default: "auto",
    choices: {
      auto: "Auto (use Foundry)",
      en: "English",
      fr: "Français",
      de: "Deutsch",
      es: "Español",
      ja: "日本語"
    },
    onChange: () => Hooks.callAll("novaRelocalize")
  });

  game.settings.register(MODULE_ID, "answerCharLimit", {
    name: "AI Answer Length Limit",
    hint: "",
    scope: "world",
    config: true,
    type: Number,
    default: 600,
    range: { min: 200, max: 1200, step: 50 }
  });

  for (let i = 1; i <= 8; i++) {
    game.settings.register(MODULE_ID, `ai${i}Enabled`, {
      name: `AI #${i} — Enabled`,
      scope: "world",
      config: true,
      type: Boolean,
      default: i === 1
    });
    game.settings.register(MODULE_ID, `ai${i}Name`, {
      name: `AI #${i} — Name / Trigger`,
      scope: "world",
      config: true,
      type: String,
      default: i === 1 ? "Nova" : ""
    });
    game.settings.register(MODULE_ID, `ai${i}ActorName`, {
      name: `AI #${i} — Actor to Speak As`,
      scope: "world",
      config: true,
      type: String,
      default: i === 1 ? "NOVA" : ""
    });
    game.settings.register(MODULE_ID, `ai${i}VoiceId`, {
      name: `AI #${i} — ElevenLabs Voice ID`,
      scope: "world",
      config: true,
      type: String,
      default: ""
    });
    game.settings.register(MODULE_ID, `ai${i}Prompt`, {
      name: `AI #${i} — Personality`,
      scope: "world",
      config: true,
      type: String,
      default: ""
    });
    game.settings.register(MODULE_ID, `ai${i}Knowledge`, {
      name: `AI #${i} — Knowledge Notes`,
      scope: "world",
      config: true,
      type: String,
      default: ""
    });
    game.settings.register(MODULE_ID, `ai${i}AccessList`, {
      name: `AI #${i} — Access (Player Names or ALL)`,
      scope: "world",
      config: true,
      type: String,
      default: "ALL"
    });
  }
});

/* --------------- HELPERS --------------- */
function readAI(i) {
  const g = (k) => game.settings.get(MODULE_ID, `ai${i}${k}`);
  return {
    index: i,
    enabled: g("Enabled"),
    name: (g("Name") || "").trim(),
    actorName: (g("ActorName") || "").trim(),
    voiceId: (g("VoiceId") || "").trim(),
    prompt: g("Prompt") || "",
    knowledge: g("Knowledge") || "",
    accessList: (g("AccessList") || "ALL").trim()
  };
}
function getAllAIs() {
  const out = [];
  for (let i = 1; i <= 8; i++) out.push(readAI(i));
  return out.filter((a) => a.enabled && a.name);
}

function gmUserIds() {
  return game.users.filter((u) => u.isGM).map((u) => u.id);
}
function everyoneUserIds() {
  return game.users.map((u) => u.id);
}

/* ---------- robust audience resolver ---------- */
function resolveAccessUserIds(accessList, { includeGMs = false } = {}) {
  if (!accessList || accessList.trim().toUpperCase() === "ALL") {
    const ids = everyoneUserIds();
    return includeGMs ? Array.from(new Set([...ids, ...gmUserIds()])) : ids;
  }

  const tokens = accessList
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const found = new Set();

  for (const tk of tokens) {
    const byId = game.users.get(tk);
    if (byId) {
      found.add(byId.id);
      continue;
    }
    const byName = game.users.find((u) => u.name?.toLowerCase() === tk.toLowerCase());
    if (byName) {
      found.add(byName.id);
      continue;
    }
    const actor = game.actors.getName(tk);
    if (actor) {
      const perm = actor.ownership ?? actor.data?.permission ?? {};
      const lvl = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OBSERVER ?? 2;
      for (const [uid, p] of Object.entries(perm)) if (Number(p) >= lvl) found.add(uid);
      continue;
    }
  }

  if (includeGMs) for (const id of gmUserIds()) found.add(id);
  return Array.from(found);
}

function aiIsPublic(ai) {
  return ai.accessList.toUpperCase() === "ALL";
}
function userHasAccess(ai, user) {
  if (user?.isGM) return true;
  if (aiIsPublic(ai)) return true;
  return resolveAccessUserIds(ai.accessList).includes(user.id);
}
function recipientsForAI(ai, includeGMs = true) {
  return aiIsPublic(ai)
    ? everyoneUserIds()
    : resolveAccessUserIds(ai.accessList, { includeGMs });
}

function findActorByName(n) {
  return game.actors.getName(n) ?? null;
}
function randId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* --------------- OpenAI + XI --------------- */
function truncateToLimit(text, limit) {
  if (!limit || text.length <= limit) return text;
  let cut = text.slice(0, Math.max(0, limit - 1));
  const m = cut.match(/[\s\n\r]\S*$/);
  if (m && m.index) cut = cut.slice(0, m.index);
  return cut.trimEnd() + "…";
}
async function askOpenAI(ai, msg) {
  const key = game.settings.get(MODULE_ID, "openaiKey");
  const limit = Number(game.settings.get(MODULE_ID, "answerCharLimit")) || 600;
  if (!key) return "Not in the database.";
  const system = [
    `You are ${ai.name}.`,
    ai.prompt ? `Personality:\n${ai.prompt}` : "",
    ai.knowledge ? `Knowledge:\n${ai.knowledge}` : "",
    `IMPORTANT: Keep your reply concise and under ~${limit} characters. Prefer short sentences and bullets.`
  ]
    .filter(Boolean)
    .join("\n\n");
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [{ role: "system", content: system }, { role: "user", content: msg }]
      })
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}`);
    const j = await r.json();
    let text = j?.choices?.[0]?.message?.content?.trim() || "Not in the database.";
    return truncateToLimit(text, limit);
  } catch (e) {
    console.error(`${MODULE_ID}|OpenAI`, e);
    return "Not in the database.";
  }
}

function abToBase64(buf) {
  const b = new Uint8Array(buf),
    chunk = 0x8000;
  let s = "";
  for (let i = 0; i < b.length; i += chunk)
    s += String.fromCharCode.apply(null, b.subarray(i, i + chunk));
  return btoa(s);
}
async function elevenGenerate(voiceId, text) {
  const key = game.settings.get(MODULE_ID, "elevenKey");
  if (!key || !voiceId || !text) return null;
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.6 },
        text
      })
    });
    if (!r.ok) throw new Error(`XI ${r.status}`);
    const buf = await r.arrayBuffer();
    return { b64: abToBase64(buf), mime: "audio/mpeg" };
  } catch (e) {
    console.error(`${MODULE_ID}|XI`, e);
    return null;
  }
}

/* --------------- Client Audio Queue + Socket (race-proof) --------------- */
(function registerClientAudio() {
  const queue = [];
  let playing = false;
  const store = {}; // id -> {total, parts(Map), mime, done}

  function enqueue({ b64, mime = "audio/mpeg", volume = 0.9 }) {
    try {
      if (game.user.isGM && !game.settings.get(MODULE_ID, "gmPreviewTTS")) return;
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
      queue.push({ url, volume });
      playNext();
    } catch (e) {
      console.error("NOVA | enqueue error", e);
    }
  }

  async function playNext() {
    if (playing) return;
    const next = queue.shift();
    if (!next) return;
    playing = true;
    try {
      const a = new Audio(next.url);
      a.volume = next.volume;
      a.addEventListener("ended", () => {
        URL.revokeObjectURL(next.url);
        playing = false;
        playNext();
      });
      a.addEventListener("error", () => {
        URL.revokeObjectURL(next.url);
        playing = false;
        playNext();
      });
      await a.play();
    } catch (e) {
      if (!window.__novaUnlocked__) {
        queue.unshift(next);
        playing = false;
        return;
      }
      playing = false;
      playNext();
    }
  }

  function installUnlockOnce() {
    const SILENT =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    const doIt = () => {
      if (window.__novaUnlocked__) return;
      new Audio(SILENT)
        .play()
        .catch(() => {})
        .finally(() => {
          window.__novaUnlocked__ = true;
          window.removeEventListener("mousedown", doIt, true);
          window.removeEventListener("keydown", doIt, true);
          playNext();
        });
    };
    window.addEventListener("mousedown", doIt, true);
    window.addEventListener("keydown", doIt, true);
  }
  Hooks.once("ready", installUnlockOnce);

  function tryAssemble(id) {
    const s = store[id];
    if (!s) return;
    if (s.done && s.parts.size === s.total) {
      let b64 = "";
      for (let i = 0; i < s.total; i++) b64 += s.parts.get(i) || "";
      delete store[id];
      enqueue({ b64, mime: s.mime || "audio/mpeg" });
    } else if (!s.timer) {
      // backoff in case 'done' raced ahead of late chunks
      s.timer = setTimeout(() => {
        delete s.timer;
        tryAssemble(id);
      }, 250);
    }
  }

  Hooks.once("ready", () => {
    game.socket.on(`module.${MODULE_ID}`, (payload) => {
      if (!payload) return;
      const me = game.user.id;
      if (payload.userIds && !payload.userIds.includes(me)) return;

      if (payload.type === "tts-direct") {
        const audio =
          typeof payload.audio === "string"
            ? { b64: payload.audio, mime: payload.mime || "audio/wav" }
            : payload.audio;
        if (audio?.b64) enqueue(audio);
        return;
      }

      if (payload.type === "tts-chunk") {
        const { id, seq, total, mime } = payload;
        if (!store[id]) store[id] = { total, parts: new Map(), mime: mime || "audio/mpeg", done: false };
        store[id].parts.set(seq, payload.chunk || "");
        tryAssemble(id);
        return;
      }

      if (payload.type === "tts-done") {
        const { id, mime } = payload;
        if (!store[id]) store[id] = { total: 0, parts: new Map(), mime: mime || "audio/mpeg", done: true };
        else store[id].done = true;
        tryAssemble(id);
      }
    });
  });

  window.novaEnqueue = enqueue;
})();

/* --------------- TTS send (chunked) --------------- */
const CHUNK_SIZE = 12000; // conservative to avoid socket caps
function sendTTSBase64To(userIds, audio) {
  if (!audio?.b64) return;
  const me = game.user.id;
  const audience = Array.isArray(userIds) ? userIds.filter(Boolean) : [];

  // Always include the sender in the audience for local playback.
  if (!audience.includes(me)) audience.push(me);

  const others = audience.filter((id) => id !== me);
  const total = Math.ceil(audio.b64.length / CHUNK_SIZE);

  // Local (initiator) playback immediately.
  if (window.novaEnqueue) window.novaEnqueue(audio);

  // Broadcast to everyone else, chunked.
  if (others.length && total > 0) {
    const id = randId();
    for (let i = 0; i < total; i++) {
      const chunk = audio.b64.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE);
      game.socket.emit(`module.${MODULE_ID}`, {
        type: "tts-chunk",
        id,
        seq: i,
        total,
        chunk,
        userIds: others,
        mime: audio.mime
      });
    }
    game.socket.emit(`module.${MODULE_ID}`, {
      type: "tts-done",
      id,
      mime: audio.mime,
      userIds: others
    });
  }
}

/* --------------- Chat glue --------------- */
async function postAIReply(ai, htmlText, whisperToUserIds = null) {
  const actor = ai.actorName ? findActorByName(ai.actorName) : null;
  const speaker = actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker();
  const html = await TextEditor.enrichHTML(htmlText || "", { async: true });
  const data = { speaker, flags: { [MODULE_ID]: { aiResponse: true } }, content: html };
  if (Array.isArray(whisperToUserIds) && whisperToUserIds.length) data.whisper = whisperToUserIds;
  await ChatMessage.create(data);
}

Hooks.once("ready", () => {
  if (!game.settings.get(MODULE_ID, "enabled")) return;

  async function handlePublic(raw, userId) {
    const user = game.users.get(userId) || game.user;
    if (/^\/w\s+(?:"[^"]+"|\S+)\s+/i.test(raw)) return;

    const lower = (raw || "").toLowerCase();
    const found = [];
    for (const ai of getAllAIs()) {
      const idx = lower.indexOf(ai.name.toLowerCase());
      if (idx >= 0) found.push({ ai, idx });
    }
    if (!found.length) return;
    found.sort((a, b) => a.idx - b.idx);

    for (const { ai } of found) {
      const text = await askOpenAI(ai, raw);
      if (aiIsPublic(ai)) {
        await postAIReply(ai, text, null);
        const audio = await elevenGenerate(ai.voiceId, text);
        if (audio) sendTTSBase64To(everyoneUserIds(), audio); // ALL -> everyone hears
      } else if (userHasAccess(ai, user)) {
        const aud = recipientsForAI(ai, true); // include GMs
        await postAIReply(ai, text, aud);
        const audio = await elevenGenerate(ai.voiceId, text);
        if (audio) sendTTSBase64To(aud, audio);
      }
    }
  }

  async function handleWhisper(target, body, userId) {
    const map = {};
    for (const ai of getAllAIs()) map[ai.name.toLowerCase()] = ai;
    const ai = map[(target || "").toLowerCase()];
    if (!ai) return;
    const user = game.users.get(userId) || game.user;
    if (!userHasAccess(ai, user)) return;

    // >>> FIX: whispers to an AI are PRIVATE to the sender (not to all with access)
    const audience = [user.id, ...gmUserIds()]; // sender + GMs

    // If you prefer the GM to also see/hear whispered AI replies, uncomment:
    // audience.push(...gmUserIds().filter(id => !audience.includes(id)));

    // Show the player's question to the whisper audience (private)
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ user }),
      whisper: audience,
      content: body
    });

    const text = await askOpenAI(ai, body);
    await postAIReply(ai, text, audience);

    const audio = await elevenGenerate(ai.voiceId, text);
    if (audio) sendTTSBase64To(audience, audio);
  }

  Hooks.on("chatMessage", (log, message, chatData) => {
    const raw = (message || "").trim();
    if (!raw) return true;

    if (/^\/novatest\b/i.test(raw)) {
      (async () => {
        const say = raw.replace(/^\/novatest\b\s*/i, "").trim() || "This is a NOVA voice test.";
        const voiceId = pickFirstVoiceId();
        if (!voiceId) {
          ui.notifications?.warn?.("No ElevenLabs Voice ID is configured on any AI.");
          return;
        }
        const audio = await elevenGenerate(voiceId, say);
        if (audio) sendTTSBase64To(everyoneUserIds(), audio);
      })();
      return false;
    }

    if (/^\/novaself\b/i.test(raw)) {
      (async () => {
        const say = raw.replace(/^\/novaself\b\s*/i, "").trim();
        if (!say) {
          ui.notifications?.warn?.("Usage: /novaself <text>");
          return;
        }
        const voiceId = pickFirstVoiceId();
        if (!voiceId) {
          ui.notifications?.warn?.("No ElevenLabs Voice ID is configured on any AI.");
          return;
        }
        const audio = await elevenGenerate(voiceId, say);
        if (audio) sendTTSBase64To(everyoneUserIds(), audio);
      })();
      return false;
    }

    if (raw.toLowerCase() === "/novabeep") {
      const b64 =
        "UklGRlgAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAIAAAAAP//////////AP///wAA////AAD///7/////AAAA////AP////////8AAP///wAA//////////////////////////8A";
      new Audio(`data:audio/wav;base64,${b64}`).play().catch(() => {});
      return false;
    }

    if (chatData?.flags?.[MODULE_ID]?.aiResponse) return true;
    handlePublic(raw, chatData.user);
    return true;
  });

  Hooks.on("chatMessage", (log, message, chatData) => {
    const raw = (message || "").trim();
    if (!raw) return true;
    const m = raw.match(/^\/w\s+(?:"([^"]+)"|(\S+))\s+([\s\S]+)$/i);
    if (!m) return true;
    handleWhisper((m[1] || m[2] || "").trim(), (m[3] || "").trim(), chatData.user);
    return false;
  });
});

/* ===================================================================
   UI injection (+ hide player-only bits)
   =================================================================== */
(() => {
  const MOD = MODULE_ID;

  function aiRowFor(scope, name) {
    const sel = `[name="${MOD}.${name}"]`;
    const el = scope.querySelector?.(sel) || document.querySelector(sel);
    return el?.closest?.(".form-group, .setting, .setting-row") || null;
  }
  function aiRows(scope, i) {
    const keys = [
      `ai${i}Enabled`,
      `ai${i}Name`,
      `ai${i}ActorName`,
      `ai${i}VoiceId`,
      `ai${i}Prompt`,
      `ai${i}Knowledge`,
      `ai${i}AccessList`
    ];
    return keys.map((k) => aiRowFor(scope, k)).filter(Boolean);
  }

  function ensureHeader(scope, i) {
    const rows = aiRows(scope, i);
    if (!rows.length) return;
    const first = rows[0];
    const parent = first.parentElement;

    if (parent.querySelector(`.nova-ai-header[data-i="${i}"]`)) return;

    const header = document.createElement("div");
    header.className = "nova-ai-header";
    header.dataset.i = String(i);
    Object.assign(header.style, {
      margin: "12px 0 4px",
      padding: "6px 8px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "6px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      userSelect: "none"
    });

    const chev = document.createElement("span");
    chev.textContent = "▾";
    chev.style.opacity = ".85";

    const title = document.createElement("span");
    title.style.fontWeight = "600";
    title.textContent = `AI #${i}`;

    header.append(chev, title);
    parent.insertBefore(header, first);

    const nameInput =
      scope.querySelector?.(`[name="${MOD}.ai${i}Name"]`) ||
      document.querySelector(`[name="${MOD}.ai${i}Name"]`);
    const setTitle = () => {
      const n = (nameInput?.value || "").trim();
      title.textContent = n ? `AI #${i} — ${n}` : `AI #${i}`;
    };
    if (nameInput) {
      nameInput.addEventListener("input", setTitle);
      nameInput.addEventListener("change", setTitle);
    }
    setTitle();

    const LS_KEY = `nova-ai-collapsed-${i}`;
    const apply = (collapsed) => {
      chev.textContent = collapsed ? "▸" : "▾";
      rows.forEach((r) => (r.style.display = collapsed ? "none" : ""));
      localStorage.setItem(LS_KEY, collapsed ? "1" : "0");
    };
    apply(localStorage.getItem(LS_KEY) === "1");
    header.addEventListener("click", () =>
      apply(rows[0].style.display !== "none")
    );
  }

  function ensureLabelHint(row, text) {
    if (!row) return;
    const label = row.querySelector("label");
    if (!label) return;
    let hint = label.querySelector(".nova-label-hint");
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "nova-label-hint";
      Object.assign(hint.style, {
        marginTop: "6px",
        fontSize: "11.5px",
        lineHeight: "1.25",
        opacity: ".78",
        display: "block"
      });
      label.appendChild(hint);
    }
    hint.textContent = text;
  }

  function ensureTextarea(el) {
    if (!el) return null;
    if (el.tagName.toLowerCase() === "textarea") return el;
    const tArea = document.createElement("textarea");
    tArea.name = el.name;
    tArea.value = el.value ?? "";
    tArea.className = el.className || "";
    el.replaceWith(tArea);
    return tArea;
  }
  function styleTextarea(t) {
    t.classList.add("nova-up");
    Object.assign(t.style, {
      width: "100%",
      minHeight: "260px",
      resize: "both",
      boxSizing: "border-box",
      display: "block"
    });
    t.rows = 14;
  }

  function getCounterFor(ta) {
    const key = ta.name;
    const container =
      ta.parentElement ||
      ta.closest(".form-fields") ||
      ta.closest(".form-group,.setting") ||
      ta;
    let ctr = container.querySelector(`.nova-ctr[data-for="${CSS.escape(key)}"]`);
    if (!ctr) {
      ctr = document.createElement("div");
      ctr.className = "nova-ctr";
      ctr.dataset.for = key;
      Object.assign(ctr.style, {
        marginTop: "6px",
        fontSize: "12px",
        opacity: ".85",
        display: "block",
        flexBasis: "100%"
      });
      ta.insertAdjacentElement("afterend", ctr);
    }
    return ctr;
  }
  function updateCounter(ctr, n) {
    if (!ctr) return;
    ctr.textContent = t("counter_characters", { n: Number(n).toLocaleString() });
  }

  function getCombinedUnder(anchor, i) {
    const container =
      anchor.parentElement ||
      anchor.closest(".form-fields") ||
      anchor.closest(".form-group,.setting") ||
      anchor;

    let combined = container.querySelector(`.nova-combined[data-i="${i}"]`);
    if (!combined) {
      combined = document.createElement("div");
      combined.className = "nova-combined";
      combined.dataset.i = String(i);
      Object.assign(combined.style, {
        marginTop: "8px",
        fontSize: "12px",
        opacity: ".85",
        display: "block",
        flexBasis: "100%"
      });
      anchor.insertAdjacentElement("afterend", combined);
    }

    let hint = combined.nextElementSibling;
    if (!hint || !hint.classList || !hint.classList.contains("nova-hint")) {
      hint = document.createElement("div");
      hint.className = "nova-hint";
      Object.assign(hint.style, {
        marginTop: "4px",
        fontSize: "11px",
        opacity: ".7",
        display: "block"
      });
      combined.insertAdjacentElement("afterend", hint);
    }
    hint.textContent = t("focus_hint");
    return combined;
  }
  function updateCombined(combined, n) {
    if (!combined) return;
    combined.textContent = t("combined_label", {
      n: Number(n).toLocaleString()
    });
  }

  function setNotes(row, text) {
    if (!row) return;
    const label = row.querySelector("label");
    row.querySelectorAll("p.notes, .notes").forEach((el, idx) => {
      if (idx > 0) el.remove();
    });
    let p = row.querySelector("p.notes, .notes");
    if (!p) {
      p = document.createElement("p");
      p.className = "notes";
      Object.assign(p.style, {
        margin: "6px 0 0 0",
        fontSize: "12px",
        lineHeight: "1.3",
        opacity: ".85"
      });
      if (label) {
        label.insertAdjacentElement("afterend", p);
      } else {
        row.appendChild(p);
      }
    }
    p.textContent = text;
  }

  function localizeRegisteredRows(scope) {
    const isGM = game.user?.isGM;

    const rowEnabled = aiRowFor(scope, "enabled");
    if (rowEnabled?.querySelector("label"))
      rowEnabled
        .querySelector("label")
        .childNodes.forEach((n, i) => {
          if (i === 0 && n.nodeType === 3) n.textContent = t("settings_enabled_name");
        });

    const rowOpenAI = aiRowFor(scope, "openaiKey");
    if (rowOpenAI?.querySelector("label"))
      rowOpenAI
        .querySelector("label")
        .childNodes.forEach((n, i) => {
          if (i === 0 && n.nodeType === 3) n.textContent = t("settings_openai_name");
        });

    const rowXI = aiRowFor(scope, "elevenKey");
    if (rowXI?.querySelector("label"))
      rowXI
        .querySelector("label")
        .childNodes.forEach((n, i) => {
          if (i === 0 && n.nodeType === 3) n.textContent = t("settings_eleven_name");
        });

    const rowGM = aiRowFor(scope, "gmPreviewTTS");
    if (rowGM) {
      if (!isGM) rowGM.style.display = "none"; // hide from players
      const label = rowGM.querySelector("label");
      if (label)
        label.childNodes.forEach((n, i) => {
          if (i === 0 && n.nodeType === 3) n.textContent = t("settings_gmpreview_name");
        });
      label?.querySelector(".nova-label-hint")?.remove();
      setNotes(rowGM, t("settings_gmpreview_hint"));
    }

    const rowLang = aiRowFor(scope, "uiLanguage");
    if (rowLang) {
      if (!isGM) {
        rowLang.style.display = "none"; // HIDE UI LANGUAGE FROM PLAYERS
      } else {
        const label = rowLang.querySelector("label");
        if (label)
          label.childNodes.forEach((n, i) => {
            if (i === 0 && n.nodeType === 3) n.textContent = t("ui_language");
          });
        label?.querySelector(".nova-label-hint")?.remove();
        setNotes(rowLang, t("ui_language_hint"));

        const select = rowLang.querySelector(`select[name="${MODULE_ID}.uiLanguage"]`);
        if (select) {
          const optAuto = select.querySelector('option[value="auto"]');
          if (optAuto) optAuto.textContent = t("ui_language_auto");
        }
      }
    }

    const rowSlider = aiRowFor(scope, "answerCharLimit");
    if (rowSlider) {
      const label = rowSlider.querySelector("label");
      if (label)
        label.childNodes.forEach((n, i) => {
          if (i === 0 && n.nodeType === 3) n.textContent = t("slider_label");
        });
      label?.querySelector(".nova-label-hint")?.remove();
      setNotes(rowSlider, t("slider_hint"));
    }

    for (let i = 1; i <= 8; i++) {
      const setLabel = (key, locKey) => {
        const row = aiRowFor(scope, key);
        if (!row) return;
        const label = row.querySelector("label");
        if (!label) return;
        label.childNodes.forEach((n, idx) => {
          if (idx === 0 && n.nodeType === 3) n.textContent = `AI #${i} — ${t(locKey)}`;
        });
      };
      setLabel(`ai${i}Enabled`, "field_enabled");
      setLabel(`ai${i}Name`, "field_nameTrigger");
      setLabel(`ai${i}ActorName`, "field_actorSpeakAs");
      setLabel(`ai${i}VoiceId`, "field_voiceId");
      setLabel(`ai${i}Prompt`, "field_personality");
      setLabel(`ai${i}Knowledge`, "field_knowledge");
      setLabel(`ai${i}AccessList`, "field_access");
    }
  }

  function upgradePair(scope, i) {
    const keyP = `ai${i}Prompt`;
    const keyK = `ai${i}Knowledge`;

    const selP = `textarea[name="${MOD}.${keyP}"], input[name="${MOD}.${keyP}"]`;
    const selK = `textarea[name="${MOD}.${keyK}"], input[name="${MOD}.${keyK}"]`;

    const elP = scope.querySelector?.(selP) || document.querySelector(selP);
    const elK = scope.querySelector?.(selK) || document.querySelector(selK);
    if (!elP && !elK) return;

    const taP = ensureTextarea(elP);
    const taK = ensureTextarea(elK);
    if (taP) styleTextarea(taP);
    if (taK) styleTextarea(taK);

    ensureLabelHint(aiRowFor(scope, keyP), t("hint_personality"));
    ensureLabelHint(aiRowFor(scope, keyK), t("hint_knowledge"));

    const ctrP = taP ? getCounterFor(taP) : null;
    const ctrK = taK ? getCounterFor(taK) : null;

    const combined = getCombinedUnder(taK || taP, i);

    function refresh() {
      if (ctrP) updateCounter(ctrP, taP.value.length);
      if (ctrK) updateCounter(ctrK, taK.value.length);
      const total = (taP ? taP.value.length : 0) + (taK ? taK.value.length : 0);
      updateCombined(combined, total);
    }

    refresh();
    if (taP) taP.addEventListener("input", refresh);
    if (taK) taK.addEventListener("input", refresh);
  }

  Hooks.on("renderSettingsConfig", (app, html) => {
    const scope = html[0];
    try {
      for (let i = 1; i <= 8; i++) {
        ensureHeader(scope, i);
        upgradePair(scope, i);
      }
      localizeRegisteredRows(scope);
    } catch (e) {
      console.error("NOVA | UI inject error", e);
    }
  });

  Hooks.on("novaRelocalize", () => {
    const dlg = document.querySelector(".app.window-app .window-content");
    if (dlg) localizeRegisteredRows(dlg);
  });
})();

/* ---------- tiny helpers used above ---------- */
function pickFirstVoiceId() {
  for (let i = 1; i <= 8; i++) {
    try {
      const v = game.settings.get(MODULE_ID, `ai${i}VoiceId`);
      if (v && v.trim()) return v.trim();
    } catch {}
  }
  return "";
}
