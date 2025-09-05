# Changelog

All notable changes to **NOVA Multi‑AI (Chat + TTS)** will be documented in this file.  
This project follows **semver**. Dates are in YYYY‑MM‑DD.

---

## [0.2.0] – 2025-09-04

### Added
- **Per‑user audio broadcast (SocketLib):** TTS is now delivered to exactly the users allowed for an AI, not just the initiator. Works for both short and chunked audio.
- **Private whispers to AIs:** `/w "AI Name" …` now stays private. Both the text reply and the TTS are routed only to the sender + the AI’s allowed listeners (or the AI’s assigned owner), instead of everyone.
- **GM Preview Voices toggle:** Optional setting for the GM to always hear TTS for monitoring without granting general access.
- **AI ownership controls:** You can assign an AI to a specific user. Combined with whispering, this enables truly private “personal AIs.”
- **GM can ignore AI voices:** Useful when the table is noisy; GMs won’t receive TTS unless they want to.
- **Stability helpers:** Built‑in autoplay unlock shim and safer Audio handling for browsers that restrict autoplay.

### Changed
- **SocketLib is now a hard dependency** and the module explicitly enables sockets in `module.json` (`"socket": true`).  
  This is required for server‑side broadcasting so that non‑initiators hear audio.
- **Audio pipeline hardened:** unified `tts-direct` / `tts-chunk` / `tts-done` handling with sequencing and cleanup to prevent stuck buffers.
- **Recipient resolution refined:** access lists now handle `ALL`, `GM`, and exact Foundry user names reliably; avoids accidental “send to everyone.”
- **Settings polish:** kept the large prompt/notes fields and sliders; hid GM‑only options from players.

### Fixed
- **“Only initiator hears” bug** for TTS and test commands such as `/novabeep`, `/novatest`, `/novaself`.
- **Whispering to an AI sent replies to everyone**; now restricted to the proper audience.
- **Module occasionally not appearing in the list** due to manifest issues; cleaned up and verified.
- **Minor UI regressions** from prior drafts that affected player‑side visibility.

### Documentation
- **README fully rewritten** with clear setup, SocketLib requirement, ElevenLabs/OpenAI notes, usage patterns (ship AIs, familiars, patrons/gods), macro examples, and troubleshooting.
- **Badges and banner** added for a more polished GitHub presentation.
- **Credits updated:** OpenAI (text generation) and ElevenLabs (optional TTS) credited explicitly.

### Compatibility
- **Foundry VTT:** v13 (minimum & verified).
- **Requires:** `socketlib` ≥ 1.1.3.  
- **Recommends:** `chat-portrait` for name & portrait rendering in chat.

### Upgrade Notes
1. Install and enable **SocketLib**, then **restart the world** (a browser refresh is not sufficient for sockets).
2. Verify each AI’s **Access List** (use `ALL`, `GM`, or exact Foundry user names). Names must match exactly.
3. If no one hears audio, run `/novaself` and click the page once to unlock browser audio; then try `/novabeep` or `/novatest`.
4. GM Preview Voices is optional—disable it if you only want authorized listeners to hear TTS.

### Known Issues
- If a player’s browser blocks autoplay, they won’t hear TTS until they interact with the page once.
- GMs will not receive private whispers to an AI unless included by the whisper context or using the preview toggle (intentional).

---

## [0.1.3] – 2025-08-xx

### Overview
Initial public release used during early playtesting.

- Up to **8 AI slots** with name/trigger, actor to speak as, prompt, and knowledge notes.
- **ElevenLabs TTS** (optional) with voice ID per AI.
- Basic **/novabeep**, **/novatest**, and **/novaself** utilities.
- Per‑user access lists existed but **TTS routing depended on the initiator**, which could cause only the sender to hear audio.
- Whispering to an AI could still **post to everyone** and speak to everyone with access.

---

## Unreleased
- Additional TTS providers.
- Sheet‑aware context and tools.
- v2 Application framework migration (when targeting FVTT ≥ v16).

---

### Format
This file is hand‑maintained. When cutting a new tag on GitHub:
1. Update `version` in `module.json`.
2. Update the **release badge** and **download link** in the README if needed.
3. Add a section above with the new version and date.
