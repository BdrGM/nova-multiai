
# NOVA Multi-AI (Chat + TTS)

Bring multiple “crew” AIs into your Foundry world. Define up to **8 distinct AI identities**, each with a trigger name, speaking actor, **personality prompt**, **knowledge notes**, and **per-user audio access**. Optional **ElevenLabs TTS** turns replies into voice and **NOVA routes audio only to the right listeners** via SocketLib.

Perfect for **ship AIs** (sci‑fi), **familiars** or **patrons/gods** (fantasy), or any **talking NPC** that should feel alive.

![Header](assets/header.png)

[![Release](https://img.shields.io/github/v/release/BdrGM/nova-multiai?logo=github)](https://github.com/BdrGM/nova-multiai/releases)
![Foundry v13](https://img.shields.io/badge/Foundry-v13-orange)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Requires: SocketLib](https://img.shields.io/badge/Requires-SocketLib-blue)](https://raw.githubusercontent.com/manuelVo/foundryvtt-socketlib/v1.1.3/module.json)
[![Recommends: Chat Portrait](https://img.shields.io/badge/Recommends-Chat%20Portrait-lightgrey)](https://raw.githubusercontent.com/ShoyuVanilla/FoundryVTT-Chat-Portrait/master/module.json)

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
  - [AI Slots](#ai-slots)
  - [Access & Audio Routing](#access--audio-routing)
  - [GM Preview Voices](#gm-preview-voices)
  - [ElevenLabs Setup (optional)](#elevenlabs-setup-optional)
- [How to Use](#how-to-use)
  - [Talking in Public](#talking-in-public)
  - [Private Whispers](#private-whispers)
  - [Slash Commands](#slash-commands)
- [Macro Examples](#macro-examples)
- [Tips & Best Practices](#tips--best-practices)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)
- [License](#license)
- [Links](#links)

---

## Features

- **Up to 8 AIs**, each with:
  - **Name / Trigger** (e.g., `Nova`, `Robotus`, `Oracle`)
  - **Actor to speak as** (chat name & portrait integration)
  - **Personality Prompt** (large field)
  - **Knowledge Notes** (large field)
  - **Per-user Access list** (who may hear TTS) or `ALL`
  - **Per-AI ElevenLabs Voice ID** (optional)
  - **Rejection Line** when the AI refuses

- **Audio routing via SocketLib**
  - TTS is **played only** for authorized listeners
  - Test utilities: **/novabeep**, **/novatest**, **/novaself**

- **Whisper-aware**
  - If a user **whispers to an AI**, the AI **replies privately** to the same recipients
  - TTS only plays for recipients who are both in the whisper **and** allowed by the AI

- **GM Quality-of-life**
  - **GM Preview Voices**: GM can monitor all TTS if desired
  - Optional **Chat Portrait** support for beautiful chat bubbles

---

## Requirements

- **Foundry VTT v13**
- **SocketLib** (required for multi-client audio)
- _Optional:_ **Chat Portrait**
- _Optional:_ **ElevenLabs** account for TTS

---

## Installation

**Manifest URL** (Foundry → _Add-on Modules_ → _Install Module_):

```
https://raw.githubusercontent.com/BdrGM/nova-multiai/main/module.json
```

Or download the ZIP from [Releases](https://github.com/BdrGM/nova-multiai/releases).

---

## Quick Start

1. Enable **SocketLib** (required) and **Chat Portrait** (optional).
2. Enable **NOVA Multi-AI**.
3. Open **Game Settings → Module Settings → NOVA Multi-AI**.
4. Toggle on an **AI Slot** and set:
   - **Name/Trigger**, **Actor to speak as**
   - **Personality Prompt** + **Knowledge Notes**
   - **Access** (comma-separated Foundry **user names** or `ALL`)
   - *(Optional)* **ElevenLabs Voice ID**
5. *(Optional)* Paste your **ElevenLabs API Key**.
6. In chat, type: `Nova, hello there.`  
   Authorized listeners will hear the voice.

---

## Configuration

### AI Slots

| Setting | Description |
| --- | --- |
| **Enabled** | Turn the slot on/off |
| **Name / Trigger** | Word that activates the AI (e.g., `Nova`) |
| **Actor to Speak As** | Controls chat name & portrait |
| **Personality Prompt** | Behavior, tone, limits |
| **Knowledge Notes** | World/ship/quest facts |
| **Access (user names or ALL)** | Comma-separated **Foundry user names** or `ALL` |
| **Voice ID** | ElevenLabs voice for this AI |
| **Rejection Line** | Text used when the AI declines |

> **Tip:** Put rules of engagement in the _Prompt_ and setting facts in _Knowledge Notes_.

### Access & Audio Routing

- TTS is delivered via **SocketLib** to the exact **Access** list.
- `ALL` allows everyone (GMs can still opt out).
- **Whispers** further restrict both the text and audio audience.

### GM Preview Voices

- **GM: Preview AI voices** — when on, GM hears all AI TTS regardless of Access.  
  Great for testing and streaming.

### ElevenLabs Setup (optional)

1. ElevenLabs → **Profile → API Keys** → create/copy key.  
2. In Foundry, paste the key into NOVA settings.
3. ElevenLabs → **Voices** → copy a **Voice ID**.
4. Paste that Voice ID into each AI slot you want voiced.

> API keys live in **world settings**, not in the repo.

---

## How to Use

### Talking in Public

Just address the AI by its **trigger**:

```
Nova, calculate jump fuel for 2 parsecs.
```

### Private Whispers

Whisper to an AI like any user:

```
/w Nova plot a quiet route to 61 Cygni.
```

- NOVA detects it was whispered and **responds privately** to the same recipients.
- TTS is sent only to those recipients **who also have Access**.

### Slash Commands

| Command | What it does |
| --- | --- |
| **/novabeep** | Plays a short beep to the users who would hear TTS (routing test) |
| **/novatest** | Sends a short ElevenLabs line to confirm TTS |
| **/novaself** | Confirms that _your_ client receives routed audio |

---

## Macro Examples

### 1) Talk to Nova (public)

```js
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
```

### 2) Whisper Nova (private to you)

```js
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
          whisper: [game.user.id]
        });
      }
    }
  }
}).render(true);
```

Duplicate these to impersonate other AIs (change `Nova` to another trigger).

---

## Tips & Best Practices

- Keep **Prompts** focused; put world facts in **Knowledge Notes**.
- Access lists must use **Foundry user names**, not character names.
- Use **GM Preview** when rehearsing scenes; disable for live games if you don’t want to hear everything.
- Give each AI a distinct **voice** for instant flavor.

---

## Troubleshooting

**No one hears TTS**
- Ensure **SocketLib** is enabled.
- Check **Access** (user names or `ALL`).
- Run **/novabeep** to verify routing without TTS.
- Make sure browsers have **unlocked audio** (click once/play any sound).

**GM hears TTS but players don’t**
- Players may not be on the AI’s **Access** list.
- Players can run **/novaself** to test their client.

**Private whisper wasn’t private**
- Confirm you actually sent a **/w** to the AI.  
- NOVA replies to **the same recipients**, and TTS is limited to those recipients **with Access**.

**Portrait/name missing**
- Install **Chat Portrait** and set **Actor to Speak As**.

---

## Credits

- **Author:** BdGM  
- **Foundry VTT** by Atropos  
- **SocketLib** by Manuel Vo (required)  
- **Chat Portrait** by ShoyuVanilla (recommended)  
- **ElevenLabs** for TTS (optional)

---

## License

**MIT** © BdGM

---

## Links

- **Repo:** <https://github.com/BdrGM/nova-multiai>  
- **Manifest:** <https://raw.githubusercontent.com/BdrGM/nova-multiai/main/module.json>  
- **Releases:** <https://github.com/BdrGM/nova-multiai/releases>
