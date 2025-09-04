NOVA Multi-AI (Chat + TTS)

Bring multiple “crew” AIs into your Foundry world.
Define up to 8 distinct AI identities, each with a trigger name, speaking actor, personality prompt, knowledge notes, and per-user audio access.
Optional ElevenLabs TTS turns replies into voice and NOVA routes audio only to the right listeners using SocketLib.

Works great for ship AIs in sci-fi, familiars or patrons/gods in fantasy, or any talking NPC that should feel alive.

<p align="center"> <a href="https://github.com/BdrGM/nova-multiai/releases"><img alt="Latest release" src="https://img.shields.io/github/v/release/BdrGM/nova-multiai?logo=github"></a> <a href="https://foundryvtt.com/"><img alt="Foundry" src="https://img.shields.io/badge/Foundry-v13- orange"></a> <a href="./LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-green"></a> <a href="https://raw.githubusercontent.com/manuelVo/foundryvtt-socketlib/v1.1.3/module.json"><img alt="Requires SocketLib" src="https://img.shields.io/badge/Requires-SocketLib-blue"></a> <a href="https://raw.githubusercontent.com/ShoyuVanilla/FoundryVTT-Chat-Portrait/master/module.json"><img alt="Recommends Chat Portrait" src="https://img.shields.io/badge/Recommends-Chat%20Portrait-lightgrey"></a> </p>
Table of Contents

Features

Requirements

Installation

Quick Start

Configuration

AI Slots (1–8)

Access & Audio Routing

GM Preview Voices

ElevenLabs Setup (optional)

How to Use

Talking in Public

Private Whispers

Slash Commands

Macro Examples

Tips & Best Practices

Troubleshooting

Credits

License

Links

Features

Up to 8 AIs, each with:

Name / Trigger (e.g., Nova, Robotus, Oracle)

Actor to speak as (for chat portrait & name)

Personality Prompt (big text area)

Knowledge Notes (big text area)

Per-user access list (who may hear TTS)

Per-AI ElevenLabs voice (optional)

Rejection line (used if an AI declines a request)

Audio routing via SocketLib

Voice is played only for authorized users

/novabeep, /novatest, /novaself utilities to verify routing & TTS

Whisper-aware

When a user whispers to an AI, the AI replies privately to the same recipients

TTS plays only for recipients who are both in the whisper and allowed by the AI’s access list

Quality of life

GM Preview Voices (optional): GM hears all TTS to monitor/QA

Optional Chat Portrait integration for gorgeous bubbles

Requirements

Foundry VTT v13

SocketLib (hard requirement for multi-client audio)

Optional: Chat Portrait (recommended)

Optional: ElevenLabs account for TTS

Installation

Manifest URL (Foundry → Add-on Modules → Install Module):

https://raw.githubusercontent.com/BdrGM/nova-multiai/main/module.json


Or grab the ZIP from Releases
.

Quick Start

Install & enable SocketLib (required) and Chat Portrait (optional).

Enable NOVA Multi-AI.

Open Game Settings → Module Settings → NOVA Multi-AI.

Turn on an AI Slot, set:

Name/Trigger (e.g., Nova)

Actor to speak as

Personality Prompt and Knowledge Notes

Access (comma-separated Foundry user names or ALL)

(Optional) ElevenLabs Voice ID

(Optional) Paste your ElevenLabs API Key.

Type in chat: Nova, hello there.
If TTS is configured, only authorized listeners will hear the voice.

Configuration
AI Slots (1–8)
Setting	What it does
Enabled	Toggle slot on/off
Name / Trigger	Word that activates this AI (e.g., Nova)
Actor to Speak As	Chat name & portrait source
Personality Prompt	How the AI behaves, tone, limits
Knowledge Notes	World/ship/quest notes to keep it in lore
Access (Player Names or ALL)	Comma-separated Foundry user names who may hear TTS; or ALL
Voice ID	ElevenLabs voice for this AI
Rejection Line	Fallback text if the AI declines a prompt

Tip: Prompts and notes are large fields—treat them like you would an NPC dossier or ship’s manual.

Access & Audio Routing

TTS is routed via SocketLib to exactly the users listed in the AI’s Access setting.

If ALL, everyone hears it (except GMs if they’ve opted to ignore).

Whispers narrow the audience further (see below).

GM Preview Voices

GM: Preview AI voices
When enabled, the GM hears all AI TTS even if not on the access list.
Handy for testing, streaming, or safety.

ElevenLabs Setup (optional)

Log into ElevenLabs → Profile → API Keys → Create new key → Copy.

In Foundry, paste API Key in NOVA settings.

On ElevenLabs → Voices → pick a voice → copy its Voice ID.

Paste the Voice ID into each AI slot you want voiced.

Your API key is stored in world settings, not in this repo.

How to Use
Talking in Public

Just address the AI by its trigger name:

Nova, calculate jump fuel for 2 parsecs.


The reply appears in chat as the configured actor, and TTS plays only for users in the AI’s Access list.

Private Whispers

Whisper to an AI like you would whisper to a player or GM:

/w Nova plot a quiet route to 61 Cygni.


NOVA detects it was whispered and replies back privately to the same recipients.

Audio is sent only to recipients who are both:

in the whisper target list and

authorized by the AI’s Access list.

Slash Commands
Command	Purpose
/novabeep	Plays a short beep for the same users who would receive TTS (routing test)
/novatest	Sends a short ElevenLabs line to confirm TTS works
/novaself	Confirms that your client can hear its routed audio
Macro Examples
1) “Talk to Nova” (public)

Creates an input box, then talks to Nova publicly.

new Dialog({
  title: "Talk to Nova",
  content: `<p>What do you say to Nova?</p><input type="text" id="line" style="width:100%">`,
  buttons: {
    go: {
      label: "Send",
      callback: (html) => {
        const line = html.find("#line").val()?.trim();
        if (!line) return;
        ChatMessage.create({ content: `Nova, ${line}` });
      }
    }
  }
}).render(true);

2) “Whisper Nova” (private to you)

Same, but whispers so only you get the reply & voice (assuming you’re authorized).

const userName = game.user.name;
new Dialog({
  title: "Whisper Nova",
  content: `<p>Whisper to Nova</p><input type="text" id="line" style="width:100%">`,
  buttons: {
    go: {
      label: "Send",
      callback: (html) => {
        const line = html.find("#line").val()?.trim();
        if (!line) return;
        ChatMessage.create({
          content: `/w Nova ${line}`,
          whisper: [game.user.id] // ensures the message is actually whispered
        });
      }
    }
  }
}).render(true);


Want a “God Voice” or “Ship AI” macro? Duplicate these and change the trigger (Nova) to another AI’s name.

Tips & Best Practices

Keep prompts focused. Use Personality Prompt for behavior/tone; use Knowledge Notes for world facts.

Name Access by Foundry user names, not player character names.

Use GM Preview when staging scenes; turn it off for live play if you don’t want to hear everything.

Per-AI voices make different AIs feel distinct (robotic, warm, ethereal, etc.).

Stream ready: Whisper for secret intel; public for announcements.

Troubleshooting

No one hears TTS

Verify SocketLib is enabled.

Check AI Access (user names or ALL).

Run /novabeep to confirm routing works even without TTS.

Make sure browsers have unlocked audio (click once / any sound).

GM hears TTS but players don’t

Players may not be in the AI’s Access list.

Players can run /novaself to test their client.

Private whisper didn’t stay private

Ensure you actually sent a /w to the AI.

The AI’s reply is whispered to the same recipients, and TTS is sent only to those recipients with access.

Portrait/name missing

Install Chat Portrait (recommended) and choose a proper Actor to Speak As.

Credits

Author: BdGM

Foundry VTT by Atropos

SocketLib by Manuel Vo (required)

Chat Portrait by ShoyuVanilla (recommended)

ElevenLabs for TTS (optional)

License

MIT © BdGM

Links

Repo: https://github.com/BdrGM/nova-multiai

Manifest: https://raw.githubusercontent.com/BdrGM/nova-multiai/main/module.json

Releases: https://github.com/BdrGM/nova-multiai/releases
