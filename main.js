/* NOVA Multi-AI — v13  (GM-only TTS preview; ignore-whisper double reply; player TTS local fallback) */
const MODULE_ID = "nova-multiai";

/* ----------------- SETTINGS ----------------- */
Hooks.once("init", () => {
  game.settings.register(MODULE_ID,"enabled",{name:"Enable AI Responses (Kill Switch)",scope:"world",config:true,type:Boolean,default:true});
  game.settings.register(MODULE_ID,"openaiKey",{name:"OpenAI API Key",scope:"world",config:true,type:String,default:"",secret:true});
  game.settings.register(MODULE_ID,"elevenKey",{name:"ElevenLabs API Key",scope:"world",config:true,type:String,default:"",secret:true});
  game.settings.register(MODULE_ID,"defaultRejection",{name:"Default Rejection Line",scope:"world",config:true,type:String,default:"Access denied."});

  // GM-only: only GMs can see/change world settings
  game.settings.register(MODULE_ID,"gmPreviewTTS",{
    name:"GM: Preview AI voices",
    hint:"When ON, the GM also hears TTS. (GM-only setting.)",
    scope:"world",            // <-- GM-only visibility in Settings UI
    config:true,
    type:Boolean,
    default:false
  });

  for(let i=1;i<=8;i++){
    game.settings.register(MODULE_ID,`ai${i}Enabled`,{name:`AI #${i} — Enabled`,scope:"world",config:true,type:Boolean,default:false});
    game.settings.register(MODULE_ID,`ai${i}Name`,{name:`AI #${i} — Name / Trigger`,scope:"world",config:true,type:String,default:""});
    game.settings.register(MODULE_ID,`ai${i}ActorName`,{name:`AI #${i} — Actor to Speak As`,scope:"world",config:true,type:String,default:""});
    game.settings.register(MODULE_ID,`ai${i}VoiceId`,{name:`AI #${i} — ElevenLabs Voice ID`,scope:"world",config:true,type:String,default:""});
    game.settings.register(MODULE_ID,`ai${i}Prompt`,{name:`AI #${i} — Personality Prompt`,scope:"world",config:true,type:String,default:""});
    game.settings.register(MODULE_ID,`ai${i}Knowledge`,{name:`AI #${i} — Knowledge Notes`,scope:"world",config:true,type:String,default:""});
    game.settings.register(MODULE_ID,`ai${i}AccessList`,{name:`AI #${i} — Access (Player Names or ALL)`,scope:"world",config:true,type:String,default:"ALL"});
    game.settings.register(MODULE_ID,`ai${i}Rejection`,{name:`AI #${i} — Rejection Line`,scope:"world",config:true,type:String,default:""});
  }
});

/* ----------------- UTILS ----------------- */
function readAI(i){
  const g=k=>game.settings.get(MODULE_ID,`ai${i}${k}`);
  return {
    index:i,
    enabled:g("Enabled"),
    name:(g("Name")||"").trim(),
    actorName:(g("ActorName")||"").trim(),
    voiceId:(g("VoiceId")||"").trim(),
    prompt:g("Prompt")||"",
    knowledge:g("Knowledge")||"",
    accessList:(g("AccessList")||"ALL").trim(),
    rejection:(g("Rejection")||"").trim()
  };
}
function getAllAIs(){const a=[];for(let i=1;i<=8;i++) a.push(readAI(i)); return a.filter(x=>x.enabled && x.name); }
function parseAccessNames(s){return (s||"").split(",").map(x=>x.trim()).filter(Boolean);}
function usersFromNames(names){const L=names.map(n=>n.toLowerCase());return game.users.filter(u=>L.includes(u.name.toLowerCase()));}
function aiIsPublic(ai){return ai.accessList.toUpperCase()==="ALL";}
function gmUserIds(){return game.users.filter(u=>u.isGM).map(u=>u.id);}
function nonGMActiveUserIds(){return game.users.filter(u=>u.active && !u.isGM).map(u=>u.id);}
function userHasAccess(ai,user){ if(aiIsPublic(ai)) return true; const allowed=usersFromNames(parseAccessNames(ai.accessList)); return !!allowed.find(u=>u.id===user.id); }
function recipientsForRestrictedAI(ai,includeGM=false){ const allow=usersFromNames(parseAccessNames(ai.accessList)).map(u=>u.id); return Array.from(new Set(includeGM?[...allow,...gmUserIds()]:allow)); }
function findActorByName(n){return game.actors.getName(n)??null;}
function randId(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}

/* Unified recipients for TTS: author always hears it */
function recipientsForAI_TTS(ai, authorUser){
  let ids = [];
  if (aiIsPublic(ai)) {
    ids = nonGMActiveUserIds();
  } else {
    ids = usersFromNames(parseAccessNames(ai.accessList)).map(u=>u.id);
  }
  if (authorUser && !ids.includes(authorUser.id)) ids.push(authorUser.id);
  ids = Array.from(new Set(ids)).filter(Boolean);
  console.log("NOVA | recipientsForAI_TTS:", ids.map(id => ({ id, name: game.users.get(id)?.name })));
  return ids;
}

/* ----------------- OPENAI ----------------- */
async function askOpenAI(ai, msg){
  const key = game.settings.get(MODULE_ID,"openaiKey");
  if(!key) return "Not in the database.";
  const system = [
    `You are ${ai.name}.`,
    ai.prompt ? `Personality:\n${ai.prompt}` : "",
    ai.knowledge ? `Knowledge:\n${ai.knowledge}` : ""
  ].filter(Boolean).join("\n\n");
  try{
    const r=await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"gpt-4o-mini",
        temperature:0.4,
        messages:[{role:"system",content:system},{role:"user",content:msg}]
      })
    });
    if(!r.ok) throw new Error(`OpenAI ${r.status}`);
    const j=await r.json();
    return j?.choices?.[0]?.message?.content?.trim() || "Not in the database.";
  }catch(e){ console.error(`${MODULE_ID}|OpenAI`,e); return "Not in the database."; }
}

/* ----------------- ELEVENLABS ----------------- */
function abToBase64(buf){
  const b=new Uint8Array(buf), chunk=0x8000; let s="";
  for(let i=0;i<b.length;i+=chunk) s+=String.fromCharCode.apply(null,b.subarray(i,i+chunk));
  return btoa(s);
}
async function elevenGenerate(voiceId,text){
  const key=game.settings.get(MODULE_ID,"elevenKey");
  if(!key || !voiceId || !text) return null;
  try{
    const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,{
      method:"POST",
      headers:{"xi-api-key":key,"Content-Type":"application/json","Accept":"audio/mpeg"},
      body:JSON.stringify({model_id:"eleven_multilingual_v2",voice_settings:{stability:0.5,similarity_boost:0.6},text})
    });
    if(!r.ok) throw new Error(`XI ${r.status}`);
    const buf=await r.arrayBuffer();
    const b64=abToBase64(buf);
    console.log("NOVA | TTS bytes length:", b64.length);
    return {b64, mime:"audio/mpeg"};
  }catch(e){ console.error(`${MODULE_ID}|XI`,e); return null; }
}

/* ----------------- CHAT TEXT POST ----------------- */
async function postAIReply(ai, htmlText, whisperToUserIds=null){
  const actor=ai.actorName?findActorByName(ai.actorName):null;
  const speaker=actor?ChatMessage.getSpeaker({actor}):ChatMessage.getSpeaker();
  const html=await TextEditor.enrichHTML(htmlText||"",{async:true});
  const data={speaker, flags:{[MODULE_ID]:{aiResponse:true}}, content:html};
  if(Array.isArray(whisperToUserIds)&&whisperToUserIds.length) data.whisper=whisperToUserIds;
  await ChatMessage.create(data);
}

/* ----------------- CLIENT AUDIO HANDLER ----------------- */
(function registerClientAudio(){
  const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  function unlockOnce(){
    if(window.__novaUnlocked__) return;
    const doIt=()=>{ if(window.__novaUnlocked__) return;
      new Audio(SILENT).play().catch(()=>{}).finally(()=>{
        window.__novaUnlocked__=true;
        console.log("NOVA | audio unlocked");
        window.removeEventListener("mousedown",doIt,true);
        window.removeEventListener("keydown",doIt,true);
      });
    };
    window.addEventListener("mousedown",doIt,true);
    window.addEventListener("keydown",doIt,true);
  }
  Hooks.once("ready", unlockOnce);

  const queue=[]; let playing=false;
  const store={}; // id -> { total, parts:Map, mime }

  function enqueue({b64,mime="audio/mpeg",volume=0.9}){
    try{
      // Respect GM preview (GM hears only if world toggle is ON)
      if(game.user.isGM && !game.settings.get(MODULE_ID,"gmPreviewTTS")){
        console.log("NOVA | GM preview OFF, skip audio on GM");
        return;
      }
      const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
      const url=URL.createObjectURL(new Blob([bytes],{type:mime}));
      queue.push({url,volume});
      console.log("NOVA | enqueued audio, qlen=",queue.length);
      playNext();
    }catch(e){ console.error("NOVA | enqueue error",e); }
  }

  async function playNext(){
    if(playing) return;
    const next=queue.shift(); if(!next) return;
    playing=true;
    try{
      const a=new Audio(next.url);
      a.volume=next.volume;
      a.addEventListener("ended",()=>{URL.revokeObjectURL(next.url);playing=false;playNext();});
      a.addEventListener("error",(e)=>{console.error("NOVA | audio error",e);URL.revokeObjectURL(next.url);playing=false;playNext();});
      await a.play();
      console.log("NOVA | HTML5 audio started");
    }catch(e){ console.error("NOVA | play failed",e); playing=false; playNext(); }
  }

  Hooks.once("ready", ()=>{
    game.socket.on(`module.${MODULE_ID}`, payload=>{
      if(!payload) return;
      const myId = game.user.id;
      const gate = payload.userIds ? payload.userIds.includes(myId) : true;
      if(!gate) return;

      if(payload.type==="tts-direct"){
        const audio = typeof payload.audio === "string"
          ? {b64: payload.audio, mime: payload.mime || "audio/wav"}
          : payload.audio;
        console.log("NOVA | client got tts-direct", {me:game.user.name, bytes:audio?.b64?.length});
        if(audio?.b64) enqueue(audio);
        return;
      }
      if(payload.type==="tts-chunk"){
        const {id,seq,total,mime}=payload;
        if(!store[id]) store[id]={total,parts:new Map(),mime:mime||"audio/mpeg"};
        store[id].parts.set(seq, payload.chunk||"");
        if(seq===0 || seq===total-1) console.log(`NOVA | chunk ${seq+1}/${total} received`);
        return;
      }
      if(payload.type==="tts-done"){
        const {id,mime}=payload;
        const s=store[id]; if(!s){ console.warn("NOVA | done for unknown id",id); return; }
        if(s.parts.size!==s.total){ console.warn("NOVA | incomplete audio", s.parts.size,"/",s.total); return; }
        let b64=""; for(let i=0;i<s.total;i++) b64+=s.parts.get(i)||"";
        delete store[id];
        console.log("NOVA | assembling audio, total bytes:", b64.length);
        enqueue({b64, mime:(mime||s.mime||"audio/mpeg")});
      }
    });
  });

  window.novaEnqueue = enqueue;
})();

/* ----------------- TTS SENDER (CHUNKS) ----------------- */
const CHUNK_SIZE = 48000;
function sendTTSBase64To(userIds,audio){
  if(!audio?.b64){ console.warn("NOVA | sendTTS: empty audio"); return; }

  const me = game.user.id;
  const others = (userIds||[]).filter(id => id && id !== me);

  console.log("NOVA | sending audio", {
    to: userIds,
    chunks: Math.ceil(audio.b64.length/CHUNK_SIZE),
    bytes: audio.b64.length
  });

  // Local fallback for sender (guaranteed playback)
  if (userIds?.includes(me)) {
    console.log("NOVA | local enqueue (sender included in recipients)");
    if (window.novaEnqueue) window.novaEnqueue(audio);
  }

  // Socket chunks to everyone else
  const total=Math.ceil(audio.b64.length/CHUNK_SIZE);
  if (others.length && total>0){
    const id = randId();
    for(let i=0;i<total;i++){
      const chunk=audio.b64.slice(i*CHUNK_SIZE, i*CHUNK_SIZE+CHUNK_SIZE);
      game.socket.emit(`module.${MODULE_ID}`,{type:"tts-chunk",id,seq:i,total,chunk,userIds:others,mime:audio.mime});
    }
    game.socket.emit(`module.${MODULE_ID}`,{type:"tts-done",id,mime:audio.mime,userIds:others});
  }
}

/* ----------------- CHAT PIPE ----------------- */
Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Ready on`, game.user.name, "| GM?", game.user.isGM);

  if(!game.settings.get(MODULE_ID,"enabled")){
    ui.notifications?.warn("NOVA Multi-AI: Kill switch is OFF."); return;
  }

  async function handlePublic(raw,userId){
    const user=game.users.get(userId)||game.user;

    // ignore whispers so we don’t double-answer
    if (/^\/w\s+(?:"[^"]+"|\S+)\s+/i.test(raw)) return;

    const lower=(raw||"").toLowerCase();
    const found=[];
    for(const ai of getAllAIs()){
      const idx=lower.indexOf(ai.name.toLowerCase());
      if(idx>=0) found.push({ai,idx});
    }
    if(!found.length) return;
    found.sort((a,b)=>a.idx-b.idx);

    for(const {ai} of found){
      const text=await askOpenAI(ai, raw);
      if (aiIsPublic(ai)) {
        await postAIReply(ai,text,null);
        const audio=await elevenGenerate(ai.voiceId,text);
        if(audio){
          const targets = recipientsForAI_TTS(ai, user);
          sendTTSBase64To(targets, audio);
        }
      } else if(userHasAccess(ai,user)){
        const textTo = recipientsForRestrictedAI(ai,true); // author + GMs
        await postAIReply(ai,text,textTo);
        const audio=await elevenGenerate(ai.voiceId,text);
        if(audio){
          const targets = recipientsForAI_TTS(ai, user);
          sendTTSBase64To(targets, audio);
        }
      }
    }
  }

  async function handleWhisper(target,body,userId){
    const map={}; for(const ai of getAllAIs()) map[ai.name.toLowerCase()]=ai;
    const ai = map[(target||"").toLowerCase()]; if(!ai) return;
    const user=game.users.get(userId)||game.user;

    const echoTo = Array.from(new Set([user.id, ...gmUserIds()]));
    await ChatMessage.create({speaker:ChatMessage.getSpeaker({user}),whisper:echoTo,content:body});

    if(userHasAccess(ai,user)){
      const text=await askOpenAI(ai, body);
      const textTo = aiIsPublic(ai) ? [user.id, ...gmUserIds()] : recipientsForRestrictedAI(ai,true);
      await postAIReply(ai,text,textTo);
      const audio=await elevenGenerate(ai.voiceId,text);
      if(audio){
        const targets = recipientsForAI_TTS(ai, user);
        sendTTSBase64To(targets, audio);
      }
    }
  }

  Hooks.on("chatMessage",(log,message,chatData)=>{
    const raw=(message||"").trim(); if(!raw) return true;

    if(raw.toLowerCase()==="/novabeep"){
      const b64="UklGRlgAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAIAAAAAP//////////AP///wAA////AAD///7/////AAAA////AP////////8AAP///wAA//////////////////////////8A";
      const url=`data:audio/wav;base64,${b64}`;
      new Audio(url).play().then(()=>console.log("NOVA | /novabeep played")).catch(e=>console.error("NOVA | /novabeep failed",e));
      return false;
    }

    if (raw.toLowerCase() === "/novaself") {
      const b64="UklGRlgAAABXQVZFZm10 IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAIAAAAAP//////////AP///wAA////AAD///7/////AAAA////AP////////8AAP///wAA//////////////////////////8A".replace(/\s+/g,"");
      const mime="audio/wav"; const dataUrl=`data:${mime};base64,${b64}`;
      try { const a=new Audio(dataUrl); a.volume=1.0; a.play().then(()=>console.log("NOVA | /novaself local HTML5 played")).catch(e=>console.warn("NOVA | /novaself local HTML5 failed:",e)); } catch(e){ console.warn("NOVA | /novaself local HTML5 threw:",e); }
      if (window.novaEnqueue) window.novaEnqueue({ b64, mime });
      const to=[game.user.id]; console.log("NOVA | /novaself emit to",to);
      game.socket.emit(`module.${MODULE_ID}`,{type:"tts-direct",audio:{mime,b64},userIds:to});
      return false;
    }

    if(raw.toLowerCase()==="/novatest"){
      if(!game.user.isGM) return false;
      const to=nonGMActiveUserIds();
      const b64="UklGRlgAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAIAAAAAP//////////AP///wAA////AAD///7/////AAAA////AP////////8AAP///wAA//////////////////////////8A";
      console.log("NOVA | /novatest emit to players:", to);
      game.socket.emit(`module.${MODULE_ID}`,{type:"tts-direct",audio:{mime:"audio/wav",b64},userIds:to});
      ChatMessage.create({content:"NOVA | test beep sent to all players."});
      return false;
    }

    if(chatData?.flags?.[MODULE_ID]?.aiResponse) return true;
    handlePublic(raw, chatData.user);
    return true;
  });

  Hooks.on("chatMessage",(log,message,chatData)=>{
    const raw=(message||"").trim(); if(!raw) return true;
    const m=raw.match(/^\/w\s+(?:"([^"]+)"|(\S+))\s+([\s\S]+)$/i);
    if(!m) return true;
    const target=(m[1]||m[2]||"").trim();
    const body=(m[3]||"").trim();
    if(!target||!body) return true;
    handleWhisper(target,body,chatData.user);
    return false;
  });
});

/* ---------- NOVA: force big textareas for Prompt & Knowledge in Settings ---------- */
Hooks.once("ready", () => {

  // Replace the two single-line inputs with resizable textareas
  const upgradeToTextAreas = (rootEl) => {
    const selector = [
      'input[name^="nova-multiai.ai"][name$="Prompt"]',
      'input[name^="nova-multiai.ai"][name$="Knowledge"]'
    ].join(",");

    (rootEl.querySelectorAll ? rootEl.querySelectorAll(selector) : [])
      .forEach((inp) => {
        if (!inp || inp.tagName === "TEXTAREA") return;

        const ta = document.createElement("textarea");
        ta.name = inp.name;
        ta.value = inp.value ?? "";
        ta.rows = 8;
        ta.style.width = "100%";
        ta.style.minHeight = "140px";
        ta.style.resize = "vertical";

        // Swap in the textarea
        inp.replaceWith(ta);

        // Make the row stretch so the textarea gets room
        const row = ta.closest(".form-group");
        if (row) {
          row.style.alignItems = "stretch";
          const label = row.querySelector("label");
          if (label) label.style.paddingTop = "6px";
          const notes = row.querySelector(".notes");
          if (notes) notes.style.marginTop = "6px";
        }
      });
  };

  // 1) When the Settings sheet first renders
  Hooks.on("renderSettingsConfig", (_app, html) => {
    if (html && html[0]) upgradeToTextAreas(html[0]);
  });

  // 2) And watch for any later re-renders by themes/systems
  const observer = new MutationObserver(() => upgradeToTextAreas(document));
  observer.observe(document.body, { childList: true, subtree: true });
});
