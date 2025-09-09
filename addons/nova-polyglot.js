// nova-polyglot.js — NOVA Multi-AI + Polyglot: big fields, glyph tagging, fantasy TTS
(() => {
  const MOD = "nova-multiai";

  // --------------------------- small utils
  const isGM = () => game.user?.isGM === true;
  const P = () => game.polyglot || globalThis.Polyglot;
  const polyglotOn = () => !!(game.modules?.get("polyglot")?.active && P());
  const safe = (fn, d) => { try { return fn(); } catch { return d; } };
  const strip = (html) => String(html ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const norm  = (s) => (s ?? "").toString().toLowerCase().trim();

  // =========================== TTS “arm” buffer (simple, reliable)
  let _armedLine = null;
  let _armedUntil = 0;
  function armFantasy(line, ttlMs = 6000) {
    _armedLine = String(line ?? "").trim() || null;
    _armedUntil = _armedLine ? (performance.now() + ttlMs) : 0;
  }
  function useAndConsumeArmed(text) {
    const now = performance.now();
    if (_armedLine && now <= _armedUntil) {
      const out = _armedLine;
      _armedLine = null; _armedUntil = 0;
      return out;
    }
    _armedLine = null; _armedUntil = 0;
    return text;
  }
  function clearArmed() { _armedLine = null; _armedUntil = 0; }

  // =========================== discover AI slots from settings
  function discoverSlots() {
    const map = new Map(); // n -> {slot, nameKey, actorKey, voiceKey}
    for (const [fullKey, s] of game.settings.settings) {
      if (!fullKey.startsWith(`${MOD}.`)) continue;
      const label = s?.name ?? "";
      const getN = (re) => (label.match(re) ? Number(label.match(re)[1]) : null);
      const nName  = getN(/^AI\s*#\s*(\d+)\s*—\s*Name\s*\/\s*Trigger$/i);
      const nActor = getN(/^AI\s*#\s*(\d+)\s*—\s*Actor\s*to\s*Speak\s*As$/i);
      const nVoice = getN(/^AI\s*#\s*(\d+)\s*—\s*ElevenLabs Voice ID$/i);
      const set = (n, k) => { if (n == null) return; const o = map.get(n) || {slot:n}; o[k] = fullKey.split(".")[1]; map.set(n,o); };
      set(nName, "nameKey");
      set(nActor, "actorKey");
      set(nVoice, "voiceKey");
    }
    return Array.from(map.values()).sort((a,b)=>a.slot-b.slot);
  }

  // per-slot hidden setting that stores Polyglot key
  function ensureHidden(slot) {
    const key = `polyglotLang_slot_${slot}`;
    if (!game.settings.settings.has(`${MOD}.${key}`)) {
      game.settings.register(MOD, key, {
        name: `AI #${slot} — Language (Polyglot)`,
        hint: "GM-only Polyglot language key for this AI.",
        scope: "world", config: false, restricted: true, type: String, default: ""
      });
    }
    return key;
  }

  // build lookup of AI name/actor/slot -> polyglot key
  function buildLookup() {
    const lk = new Map();
    for (const { slot, nameKey, actorKey } of discoverSlots()) {
      const lang = game.settings.get(MOD, ensureHidden(slot)) || "";
      if (!lang) continue;
      lk.set(`slot:${slot}`, lang);
      const aiName = nameKey ? game.settings.get(MOD, nameKey) : "";
      if (aiName) lk.set(`name:${norm(aiName)}`, lang);
      const actorName = actorKey ? game.settings.get(MOD, actorKey) : "";
      if (actorName) {
        lk.set(`name:${norm(actorName)}`, lang);
        const actor = game.actors?.getName(actorName);
        if (actor?.id) lk.set(`id:${actor.id}`, lang);
      }
    }
    return lk;
  }

  function deriveLangForMsg(dataOrMsg) {
    const lookup = buildLookup();
    const slot = safe(()=>dataOrMsg.flags?.[MOD]?.slot, null);
    const aiName = safe(()=>dataOrMsg.flags?.[MOD]?.aiName, null);
    const actorId = dataOrMsg?.speaker?.actor ?? "";
    const alias = dataOrMsg?.speaker?.alias ?? dataOrMsg?.alias ?? "";
    return (slot!=null && lookup.get(`slot:${slot}`))
        || (aiName && lookup.get(`name:${norm(aiName)}`))
        || (actorId && lookup.get(`id:${actorId}`))
        || (alias && lookup.get(`name:${norm(alias)}`))
        || "";
  }

  // =========================== UI: big fields + language dropdowns
  function getPolyglotLanguages() {
    if (!polyglotOn()) return [];
    const prov = P()?.languageProvider;
    const raw = safe(()=>prov.languages, null) ?? safe(()=>P().languages, null) ?? {};
    const out = [];
    const push = (k,v)=> out.push({key:String(k), label:String(v ?? k)});
    if (raw instanceof Map) for (const [k,v] of raw) push(k, (typeof v === "string" ? v : v?.label) ?? k);
    else if (Array.isArray(raw)) for (const v of raw) push(v?.id ?? v?.key ?? v, v?.label ?? v?.name ?? v?.key ?? v);
    else if (raw && typeof raw === "object") for (const [k,v] of Object.entries(raw)) push(k, (typeof v === "string" ? v : v?.label) ?? k);
    return out.sort((a,b)=>a.label.localeCompare(b.label));
  }

  function upgradeBigField($row) {
    const $ = window.jQuery;
    const $field = $row.find(".form-fields input, .form-fields textarea").first();
    if (!$field.length) return;
    if ($field.is("input")) {
      const name = $field.attr("name"); const val = $field.val();
      const $ta = $(`<textarea rows="10" class="nova-bigfield"></textarea>`).attr("name", name).val(val);
      $field.replaceWith($ta);
    } else {
      $field.attr("rows", 10).addClass("nova-bigfield");
    }
    $row.find(".nova-bigfield").css({ minHeight:"200px", height:"260px", resize:"vertical" });
  }

  function injectDropdownsAndBigFields(rootEl) {
    if (!isGM()) return;
    const $ = window.jQuery; const $root = rootEl instanceof $ ? rootEl : $(rootEl);

    // enlarge Personality / Knowledge for all slots
    for (const {slot} of discoverSlots()) {
      const rxPers = new RegExp(`^\\s*AI\\s*#\\s*${slot}\\s*—\\s*Personality\\s*$`,"i");
      const rxKnow = new RegExp(`^\\s*AI\\s*#\\s*${slot}\\s*—\\s*Knowledge\\s*Notes\\s*$`,"i");
      const $pers = $root.find(".form-group").filter(function(){return rxPers.test($(this).find("label").text().trim());}).first();
      if ($pers.length) upgradeBigField($pers);
      const $know = $root.find(".form-group").filter(function(){return rxKnow.test($(this).find("label").text().trim());}).first();
      if ($know.length) upgradeBigField($know);
    }

    if (!polyglotOn()) return;

    const langs = getPolyglotLanguages();
    const options = [`<option value="">— None / Default —</option>`]
      .concat(langs.map(({key,label})=>`<option value="${key}">${label}</option>`)).join("");

    for (const {slot, voiceKey} of discoverSlots()) {
      const settingKey = ensureHidden(slot);
      const current = game.settings.get(MOD, settingKey);

      // --------- NEW: locale-agnostic anchor under the ElevenLabs Voice ID field
      let $anchor = null;
      if (voiceKey) {
        const sel = `[name="${MOD}.${voiceKey}"]`;
        $anchor = $root.find(sel).closest(".form-group");
      }

      // Fallbacks (English-only labels) if somehow voiceKey anchor isn’t found
      if (!$anchor || !$anchor.length) {
        const rxAccess = new RegExp(`^\\s*AI\\s*#\\s*${slot}\\s*—\\s*Access`, "i");
        const rxIgnore = new RegExp(`^\\s*AI\\s*#\\s*${slot}\\s*—\\s*GM:\\s*Ignore`, "i");
        $anchor = $root.find(".form-group").filter(function(){return rxAccess.test($(this).find("label").text().trim());}).first();
        if (!$anchor.length) $anchor = $root.find(".form-group").filter(function(){return rxIgnore.test($(this).find("label").text().trim());}).first();
      }
      if (!$anchor || !$anchor.length) continue;

      const rowId = `nova-polyglot-row-${slot}`;
      const rxLangRowLocaleAgnostic = new RegExp(`^\\s*AI\\s*#\\s*${slot}.*\\(Polyglot\\)`, "i");

      if ($root.find(`#${rowId}`).length) {
        // Hide any other “Polyglot” row for this slot that is NOT ours
        $root.find(".form-group").filter(function(){
          const $fg = $(this);
          const label = $fg.find("label").text().trim();
          if (!rxLangRowLocaleAgnostic.test(label)) return false;
          return $fg.find(`select[data-nova-polyglot-slot="${slot}"]`).length === 0;
        }).hide();
        continue;
      }

      const $row = $(`
        <div class="form-group" id="${rowId}">
          <label>AI #${slot} — Language (Polyglot) <small style="opacity:.7">[GM only]</small></label>
          <div class="form-fields"><select data-nova-polyglot-slot="${slot}">${options}</select></div>
          <p class="notes">Polyglot glyphs/comprehension for this AI; ElevenLabs speaks the fantasy line only.</p>
        </div>
      `);
      $row.find("select").val(current ?? "");
      $row.find("select").on("change", async ev => {
        const v = ev.currentTarget.value || "";
        await game.settings.set(MOD, settingKey, v);
        if (!v) clearArmed();
      });
      $anchor.after($row);

      // Hide any other locale variant of the “Polyglot” row for this slot
      $root.find(".form-group").filter(function(){
        const $fg = $(this);
        const label = $fg.find("label").text().trim();
        if (!rxLangRowLocaleAgnostic.test(label)) return false;
        return $fg.find(`select[data-nova-polyglot-slot="${slot}"]`).length === 0;
      }).hide();
    }
  }

  Hooks.on("renderSettingsConfig", (_app, html) => {
    setTimeout(()=>injectDropdownsAndBigFields(html),0);
    const root = html[0] ?? html;
    const mo = new MutationObserver(()=>{ try { injectDropdownsAndBigFields(html); } catch {} });
    mo.observe(root, { childList:true, subtree:true });
    try { (window.jQuery ? window.jQuery(html) : null)?.data?.("novaMO", mo); } catch {}
  });
  Hooks.on("closeSettingsConfig", (_app, html) => {
    try { (window.jQuery ? window.jQuery(html) : null)?.data?.("novaMO")?.disconnect(); } catch {}
  });
  Hooks.once("ready", () => { for (const {slot} of discoverSlots()) ensureHidden(slot); });

  // =========================== Conlang generator (compact, flavorful)
  function xmur3(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=(h<<13)|(h>>>19);}return function(){h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);return (h^=h>>>16)>>>0;};}
  function sfc32(a,b,c,d){return function(){a>>>0;b>>>0;c>>>0;d>>>0;var t=(a+b)|0;t=(t+d)|0;d=(d+1)|0;a=b^b>>>9;b=c+(c<<3)|0;c=(c<<21|c>>>11);c=(c+t)|0;return (t>>>0)/4294967296;};}
  function rngFromSeed(s){const h=xmur3(s);return sfc32(h(),h(),h(),h());}
  const LEX = { "hello":"shalan","hi":"shalan","hey":"shalan","yes":"ai","no":"ne","not":"ne","i":"za","me":"za","my":"zam","you":"tir","your":"tirm","we":"or","our":"orm","they":"tal","their":"talm","is":"na","are":"na","be":"na","and":"ka","of":"en","to":"da","for":"vor","with":"sha","from":"de","that":"ta","this":"ti","please":"vara","thanks":"sare","thank":"sare","can":"ra","will":"vor","must":"gor","the":"" };
  const FLAVORS = {
    draconic:{on:["","k","kr","kh","g","gr","gh","q","qr","zr","vr","tr","dr","sk","skr"],nu:["a","o","u","aa","au","oa","uu"],co:["","k","g","x","q","rk","rg","r","ss","zz","gh","rx"]},
    dwarvish:{on:["","d","t","k","g","kh","gr","dr","kr","br","vr","zr"],nu:["a","o","u","oi","ou","au"],co:["","m","n","r","rd","rk","rg","rm","rn","gh","kh"]},
    elvish:{on:["","l","n","s","sh","th","rh","vr","zr","hl","ny"],nu:["a","e","i","ia","ie","ae","ei","oa"],co:["","l","n","r","s","th","sh","len","ril","iel"]},
    gnomish:{on:["","t","p","k","b","d","g","f","v","sch","tch","sn","sm"],nu:["i","e","a","oi","ee","ai"],co:["","k","t","x","sh","ch","zz","nk","kt"]},
    halfling:{on:["","b","p","t","d","l","n","r","h","m","w","y","bl","pl","tr","wh"],nu:["a","e","i","o","u","ee","ie","ai","oi"],co:["","l","n","r","m","y","ny","ly","rin","lin"]},
    orcish:{on:["","g","k","kr","gr","br","dr","sk","sn","sm","gh","qh"],nu:["a","u","o","au","uu","oa"],co:["","g","k","kg","rg","rz","gz","gash","zug","gr"]},
    goblin:{on:["","g","k","t","b","d","z","sn","sk","gr","kr","gl","kl"],nu:["a","i","o","u","ee","ai","oi"],co:["","g","k","t","x","zz","zg","gik","tak","gk"]},
    giant:{on:["","g","k","gr","kr","br","dr","th","st","m","n","vr"],nu:["o","a","u","oa","ou","uu","au"],co:["","m","n","r","rg","rd","g","k","th","rm"]},
    undercommon:{on:["","s","z","zh","x","q","sk","zk","gz","vx","nx","dr","vr"],nu:["i","u","o","io","iu","ou","ui","aa"],co:["","x","z","zz","xz","zh","nq","ksh","zhar"]},
    sylvan:{on:["","l","n","s","t","f","th","sh","gl","fl","ly","ny"],nu:["ia","ea","ei","ie","ai","a","e","i","oa"],co:["","l","n","r","th","sh","lle","len","riel"]},
    celestial:{on:["","l","n","h","v","el","al","il","ar","or","ser","vel"],nu:["a","e","i","ia","ae","ei","ui","oa","aë"],co:["","el","iel","ael","ion","is","ah","iel"]},
    "primordial-aquan":{on:["","gl","sl","hl","wh","v","fl"],nu:["o","u","oo","ou","ua","oa","uu"],co:["","l","n","r","sh","th","ul","un"]},
    "primordial-auran":{on:["","h","s","th","f","wh","v","l","hl"],nu:["a","e","i","ai","ei","ia","ae"],co:["","h","th","s","l","r","ha","sa"]},
    "primordial-ignan":{on:["","k","q","x","z","s","sh","sk","kr"],nu:["a","ia","ei","ui","aa","au"],co:["","x","z","zz","k","q","rax","zash"]},
    "primordial-terran":{on:["","gr","kr","dr","br","st","th","m","n"],nu:["o","u","a","oa","uu","ou"],co:["","m","n","nd","rk","rg","th","kh","rum"]},
    abyssal:{on:["","g","gr","gh","k","kr","kh","q","x","z","zh","sk","scr","zr","vr","dr"],nu:["a","u","o","aa","ua","au","uo","uu"],co:["","gz","x","zx","zz","gh","gr","gth","rth","kth","zsh","xul","zoth"]},
    infernal:{on:["","v","z","zh","th","ph","vr","zr","kr","dr","pr","sr"],nu:["a","e","i","o","u","ae","ei","ie","io","ua"],co:["","s","th","x","z","r","n","rix","thus","zar","vash"]},
    default:{on:["","b","d","g","k","q","kh","zh","sh","th","vr","zr","gr","kl","kr","dr","tr","ph","sk","sm","sn","gh","rh","hr"],nu:["a","e","i","o","u","ae","ai","ia","oa","uu","ou","ei"],co:["","n","r","s","sh","th","x","k","g","l","m","nd","rk","gh","kh","z","nz","rz","rm","rg"]}
  };
  function flavorForKey(k=""){k=k.toLowerCase();
    const pairs=[
      ["abyssal",["abyssal","daemonic","demonic","demon","abyss"]],
      ["infernal",["infernal","hell","baator","devil","diabolic"]],
      ["draconic",["draconic","dragon","wyrm"]],
      ["dwarvish",["dwarv","dwarven","khuzdul"]],
      ["elvish",["elv","seldarine"]],
      ["sylvan",["sylvan","fey"]],
      ["celestial",["celest","angel"]],

      ["orcish",["orc"]],
      ["goblin",["goblin"]],
      ["giant",["giant","jotun"]],
      ["undercommon",["undercommon","drow"]],
      ["gnomish",["gnom"]],
      ["halfling",["halfling","hin"]],
      ["primordial-aquan",["aquan"]],
      ["primordial-auran",["auran"]],
      ["primordial-ignan",["ignan"]],
      ["primordial-terran",["terran"]],
    ];
    for (const [f,keys] of pairs) if (keys.some(s=>k.includes(s))) return f;
    for (const f of Object.keys(FLAVORS)) if (f!=="default" && k.includes(f)) return f;
    return "default";
  }
  function choose(r, a){return a[Math.floor(r()*a.length)]||"";}
  function makeWord(len, rng, flavor) {
    const f = FLAVORS[flavor] || FLAVORS.default;
    const syls = Math.max(1, Math.min(3, Math.round(len/4) + (rng()>0.7?1:0)));
    let w = "";
    for (let i=0;i<syls;i++) w += choose(rng,f.on)+choose(rng,f.nu)+choose(rng,f.co);
    if (w.length>5 && rng()>0.6) { const cut = 2 + Math.floor(rng()*(w.length-4)); w = w.slice(0,cut)+"'"+w.slice( cut); }
    return w;
  }
  function synth(text, langKey) {
    const flavor = flavorForKey(langKey);
    const rng = rngFromSeed(`${flavor}::${text}`);
    const parts = strip(text).split(/(\b)/);
    const out=[];
    for (const p of parts) {
      if (!/^[A-Za-z0-9]+$/.test(p)) { out.push(p); continue; }
      const l = p.toLowerCase();
      let rep = LEX.hasOwnProperty(l) ? LEX[l] : makeWord(l.length, rng, flavor);
      if (/^[A-Z][a-z]+$/.test(p)) rep = rep.charAt(0).toUpperCase()+rep.slice(1);
      else if (/^[A-Z]+$/.test(p)) rep = rep.toUpperCase();
      out.push(rep);
    }
    let line = out.join("").replace(/\s{2,}/g," ").trim();
    return line || "…";
  }

  // =========================== Polyglot + message hooks
  function forceIC(obj) {
    const STYLE = CONST?.CHAT_MESSAGE_STYLES?.IC;
    if (typeof STYLE === "number") obj.style = STYLE;
    else if (typeof CONST?.CHAT_MESSAGE_TYPES?.IC === "number") obj.type = CONST.CHAT_MESSAGE_TYPES.IC;
  }

  Hooks.on("preCreateChatMessage", (_doc, data) => {
    const lang = deriveLangForMsg(data) || "";
    if (!lang) { clearArmed(); return; }

    if (polyglotOn()) {
      data.flags ??= {};
      data.flags.polyglot ??= {};
      data.flags.polyglot.language = lang;
    }
    forceIC(data);

    const fantasy = synth(strip(data.content ?? ""), lang);
    armFantasy(fantasy);

    data.flags ??= {}; data.flags[MOD] ??= {};
    data.flags[MOD].polyglotLanguage = lang;
    data.flags[MOD].tts = { fantasyKey: lang, fantasyLine: fantasy };
  });

  Hooks.on("createChatMessage", (msg) => {
    const lang = deriveLangForMsg(msg) || "";
    if (!lang) return;
    if (!isGM() && !msg.isAuthor) return;
    if (polyglotOn() && msg.getFlag("polyglot","language") !== lang) {
      msg.update({ "flags.polyglot.language": lang }).catch(()=>{});
    }
  });

  // =========================== XI wrappers — speak(), elevenGenerate(), fetch()
  function wrapGameElevenlabsSpeak() {
    const api = game?.elevenlabs;
    const speak = api?.speak;
    if (!speak || speak.__novaWrapped) return false;
    api.speak = async function(text, opts={}) {
      try { return await speak.call(this, useAndConsumeArmed(String(text ?? "")), opts); }
      catch { return await speak.call(this, text, opts); }
    };
    api.speak.__novaWrapped = true; return true;
  }
  function wrapWindowElevenGenerate() {
    const fn = globalThis.elevenGenerate;
    if (typeof fn !== "function" || fn.__novaWrapped) return false;
    globalThis.elevenGenerate = async function(voiceId, text) {
      try { return await fn.call(this, voiceId, useAndConsumeArmed(String(text ?? ""))); }
      catch { return await fn.call(this, voiceId, text); }
    };
    globalThis.elevenGenerate.__novaWrapped = true; return true;
  }
  function wrapElevenlabsFetch() {
    const orig = globalThis.fetch;
    if (typeof orig !== "function" || orig.__novaXIWrapped) return false;
    globalThis.fetch = async function(input, init) {
      try {
        const url = typeof input === "string" ? input : input?.url;
        const isXI = url && /https:\/\/api\.elevenlabs\.io\/v1\/text-to-speech\//i.test(url);
        if (isXI && init?.method?.toUpperCase() === "POST" && init.body != null) {
          let body = init.body;
          if (body instanceof Blob) body = await body.text();
          else if (body instanceof ArrayBuffer) body = new TextDecoder().decode(body);
          else if (typeof body !== "string") body = String(body ?? "");
          try {
            const payload = JSON.parse(body);
            const line = useAndConsumeArmed(String(payload.text ?? ""));
            if (line && line !== payload.text) {
              payload.text = line;
              init = { ...init, body: JSON.stringify(payload) };
            }
          } catch {/* non-JSON, ignore */}
        }
      } catch {/* ignore */}
      return orig.call(this, input, init);
    };
    globalThis.fetch.__novaXIWrapped = true; return true;
  }

  // =========================== Suppress non-GM permission error toasts
  function suppressPermissionToasts() {
    const n = ui?.notifications;
    if (!n || n.__novaPatched) return;
    const originalError = n.error?.bind(n);
    n.error = function(message, ...args) {
      try {
        const s = String(message ?? "");
        if (/lacks permission to update ChatMessage/i.test(s)
         || /do not have sufficient permissions/i.test(s)) {
          console.debug("[NOVA Polyglot] Suppressed permission toast:", s);
          return;
        }
      } catch {}
      return originalError ? originalError(message, ...args) : undefined;
    };
    n.__novaPatched = true;
  }

  Hooks.once("ready", () => {
    for (const {slot} of discoverSlots()) ensureHidden(slot);

    let tries = 0;
    const t = setInterval(() => {
      const a = wrapGameElevenlabsSpeak();
      const b = wrapWindowElevenGenerate();
      const c = wrapElevenlabsFetch();
      if ((a||b||c) || (++tries>30)) {
        if (a||b||c) console.log("[NOVA Polyglot] TTS interceptor active");
        clearInterval(t);
      }
    }, 250);

    suppressPermissionToasts();
  });

})();
