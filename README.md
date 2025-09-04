NOVA Multi-AI (Chat + TTS)

Bring multiple AI “crew” into your Foundry world. NOVA Multi-AI lets you define up to 8 distinct AI identities, each with their own trigger name, personality prompt, knowledge notes, speaking actor, and per-user audio access. Optional ElevenLabs TTS turns replies into voice — routed only to the allowed listeners via SocketLib (so everyone who should hear, will hear).
Works great for ship AIs in sci-fi, familiars or talking items in fantasy, helpful NPCs, or even gods speaking through visions.

Requirements

Foundry VTT v13

SocketLib (hard requirement for multi-client audio)

Chat Portrait (optional, recommended)

Table of Contents

Features

Installation

Quick Start

Configuration

AI Slots (1–8)

Access & Audio Routing

GM Preview Voices

ElevenLabs Setup

How to Use (Players & GMs)

Talking in Public

Private Whispers

Slash Commands

Macro Examples

Tips & Best Practices

Troubleshooting

Credits

Links

License

Features

Up to 8 AIs, each with:

Name / Trigger (e.g., Nova, Robotus, Oracle)

Actor to speak as (for chat sender & Chat Portrait)

Personality Prompt (big, multiline field)

Knowledge Notes (big, multiline field)

Per-user access list (who may hear TTS; ALL allowed)

Per-user TTS routing via SocketLib

Optional rejection line (graceful decline text)

Voice (TTS) settings per AI

GM Tools

Preview Voices toggle — GM can monitor all TTS if desired

Test utilities and diagnostics

Utilities

/novabeep — local routing beep (no TTS service needed)

/novatest — quick ElevenLabs sample line

/novaself — confirms your own client can receive audio

Whisper-aware

Whispering to an AI keeps the conversation private to the participants (sender + intended recipients + GMs with preview if enabled).

Installation

Manifest URL (Foundry → Add-on Modules → Install Module):

https://raw.githubusercontent.com/BdrGM/nova-multiai/main/module.json


Or download a ZIP from GitHub Releases and install manually.

Note: SocketLib is declared as a required dependency. Foundry will install/enable it for you.

Quick Start

Install & enable the module (and SocketLib; Chat Portrait optional).

In Game Settings → Module Settings → NOVA Multi-AI, enable at least one AI slot.

Fill in:

Name/Trigger (e.g., Nova)

Actor to Speak As (the chat sender/portrait)

Personality + Knowledge

Access (use ALL while testing)

(Optional) Enter ElevenLabs API key & a Voice ID for TTS.

In chat, type:
Nova, say hello to the crew.
Everyone with access will see the reply and hear the voice.

Configuration

Open Game Settings → Module Settings → NOVA Multi-AI.

AI Slots (1–8)

Enabled — turn the slot on/off.

Name / Trigger — word used to address this AI (e.g., Nova).

Actor to Speak As — the Foundry Actor name used for messages and portraits.

Personality Prompt — how this AI talks and behaves (multiline).

Knowledge Notes — local lore/ship data/GM guidance (multiline).

Access (Player Names or ALL) — comma-separated Foundry user names (not actor names) who may hear this AI’s voice. Use ALL to allow everyone.

Rejection Line — optional fallback text when the AI refuses a request.

Voice (TTS) — ElevenLabs voice ID (per AI), if TTS is enabled.

Access & Audio Routing

Chat visibility is standard Foundry behavior (public/whisper).

Audio (TTS) routing is enforced by the Access list:
only those users (plus GM Preview Voices, if enabled) receive the audio packets via SocketLib.

GM Preview Voices

Setting: “GM: Preview AI voices”
When enabled, GMs hear AI voices even if they’re not explicitly on that AI’s access list. Use this to monitor audio while keeping player routing strict.

ElevenLabs Setup

API Key: In your ElevenLabs account:

Profile → Personal/Settings → API Keys → Create/Copy Key.

Paste the key into the module setting “ElevenLabs API Key”.

Voice ID:

Voices → select a voice → copy its Voice ID.

Paste into the AI slot’s Voice ID field.

Optional: Adjust stability/clarity/etc. in your ElevenLabs dashboard for that voice.

Your API key is stored in world settings, not in the repo.

How to Use (Players & GMs)
Talking in Public

Players can simply address the AI by its trigger in a normal chat message:

Nova, scan the surrounding region and report anomalies.


The reply posts as the configured Actor.

TTS plays for users on the Access list (or ALL).

Private Whispers

Whispering to an AI keeps the chat and voice private:

/w Nova What do you know about the locked door on B-Deck?


The reply is whispered back only to the whisper participants.

Audio is routed only to those participants who also have access (plus GM if Preview Voices is on).

If you whisper to an AI that everyone has access to (e.g., ALL), the whisper still remains private. Audio is delivered only to the whisper participants (and GM preview if enabled). Public access does not override whisper privacy.

Slash Commands

/novabeep — plays a short beep only to the users who would receive this AI’s audio (routing sanity check; no API needed).

/novatest — sends a short line through ElevenLabs for a quick end-to-end test.

/novaself — confirms that your client can receive audio.

Macro Examples
1) “Speak as Nova” Button (public)

A simple macro that makes the selected AI speak a line you type in a prompt.

const aiName = "Nova"; // your AI trigger
const line = await new Promise((resolve) => {
  new Dialog({
    title: `Speak as ${aiName}`,
    content: `<p>What should ${aiName} say?</p><textarea id="l" rows="4" style="width:100%"></textarea>`,
    buttons: {
      ok: { label: "Send", callback: html => resolve(html.find("#l").val()?.trim() || "") },
      cancel: { label: "Cancel", callback: () => resolve(null) }
    },
    default: "ok"
  }).render(true);
});

if (!line) return;
// Post to chat exactly as a user would; the module picks it up by trigger.
ChatMessage.create({ content: `${aiName}, ${line}` });

2) “Whisper to Robotus” (private to GM + you)
const aiName = "Robotus";
const line = await Dialog.prompt({
  title: `Whisper to ${aiName}`,
  content: `<p>Private message:</p><input id="m" type="text" style="width:100%">`,
  label: "Send",
  callback: html => html.find("#m").val()?.trim()
});

if (!line) return;
// Standard Foundry whisper: the module routes reply + audio back privately.
ChatMessage.create({ content: `/w ${aiName} ${line}` });


These macros deliberately use normal chat so they work even if the module API changes. The module sees messages that begin with the AI trigger (or /w Trigger) and handles the rest.

Tips & Best Practices

Actor choice matters. Pick an actor with the right portrait/name so table chat looks great (Chat Portrait enhances this).

Prompts vs. Notes: Put stable “how to act” rules in Personality and session/scene facts in Knowledge.

Access for events: For secret scenes, limit Access to specific players; for shipwide announcements, set ALL.

GM Preview during setup, then turn it off if you want to stay out of player-only voice.

Troubleshooting

Players can’t hear TTS, but GM can

Ensure the players’ Foundry user names appear in the AI’s Access list (or set to ALL).

Ask them to run /novaself once (and make sure their browser has “unlocked” audio by interacting with the page).

Confirm GM Preview Voices isn’t the only reason you hear audio.

No sound for anyone

Verify your ElevenLabs API key and Voice ID.

Run /novabeep — if you hear the beep, routing works and the issue is TTS/API side.

Check browser autoplay permissions (players may need to click the page once).

Whisper leaks to public

By design, the module keeps whispered conversations private (chat + audio).
If a reply goes public, ensure the message actually began as a whisper:

It must be /w Trigger ...

Or a direct reply to a whispered prompt.

Chat portrait/name not showing

Install and enable Chat Portrait.

Make sure Actor to Speak As matches the actual Actor name.

Credits

Author: BdGM

Foundry VTT by Atropos

SocketLib by @manuelVo (critical for multi-client audio delivery)

Chat Portrait by ShoyuVanilla (optional, recommended)

ElevenLabs — optional TTS backend

Links

Repository: https://github.com/BdrGM/nova-multiai

Manifest: https://raw.githubusercontent.com/BdrGM/nova-multiai/main/module.json

Releases: https://github.com/BdrGM/nova-multiai/releases

License

MIT © BdGM
