NOVA Multi-AI (Chat + TTS)

Bring multiple AI “crew” into your Foundry world.
NOVA Multi-AI lets you define up to 8 distinct AI identities, each with their own trigger name, personality prompt, knowledge notes, speaking actor, and per-user audio access. Optional ElevenLabs TTS turns responses into voice—routed only to the allowed listeners.

Requires Foundry VTT v13.
Optional: Chat Portrait
 to show portraits & names in chat bubbles.

✨ Features

Up to 8 AIs with:

Name/trigger (e.g., “Nova”)

Actor to speak as (for chat portrait/name)

Personality prompt (large, multi-line field)

Knowledge notes (large, multi-line field)

Per-user access list (who may hear TTS)

Per-user TTS routing (only authorized listeners hear audio)

GM Preview Voices toggle (GM can monitor TTS if desired)

Test & utility commands

/novabeep — quick audio check

/novatest — short voice test line

/novaself — confirm your client can hear routed audio

Optional Chat Portrait support (recommended)

📦 Installation

Manifest URL (paste in Foundry > Add-on Modules > Install Module):

https://raw.githubusercontent.com/BdrGM/nova-multiai/main/module.json


Or download the latest release ZIP from GitHub Releases and install manually.

⚙️ Configuration

Open Game Settings → Module Settings → NOVA Multi-AI.

For each AI slot (1–8):

Enabled — turn the slot on/off

Name / Trigger — word that activates the AI (e.g., “Nova”)

Actor to Speak As — actor name for chat/portrait display

Personality Prompt — large text area; how the AI should behave

Knowledge Notes — large text area; world/ship/setting notes

Access (Player Names or ALL) — comma-separated Foundry user names who should hear TTS (use ALL for everyone)

Rejection Line (optional) — fallback text when the AI declines

ElevenLabs (optional)

Enter your ElevenLabs API Key in the module settings

Set a Voice ID per AI (from your ElevenLabs account)

GM Preview Voices

GM: Preview AI voices — when on, the GM also hears TTS even if not on the access list (useful to monitor).

🗣️ How to Use

Just type to the AI using its trigger name in chat.
Example:

Player: “Nova, what are the 4 cardinal directions?”

The module sends your message to the correct AI identity, posts the reply to chat (as the chosen actor), and plays TTS to authorized listeners.

⌨️ Commands

In chat:

/novabeep — Plays a short beep on clients who would hear TTS (routing test)

/novatest — Sends a short test sentence through ElevenLabs (GM can verify voice works)

/novaself — Confirms your client receives routed audio

🔒 Privacy / Keys

The ElevenLabs API key is stored in your world settings, not in the repository.

Per-user access lists are world settings as well.

🧰 Troubleshooting

Players can’t hear TTS, GM can

Ensure the player’s Foundry user name is in the AI’s Access list (or set to ALL).

Ask the player to run /novaself.

Make sure the GM Preview toggle isn’t the only reason you’re hearing audio.

No sound for anyone

Verify your ElevenLabs API Key and Voice ID.

Run /novabeep to confirm audio routing works even without TTS.

Players must have browser audio unlocked (click anywhere/play any sound once).

Portrait/name not showing

Install and enable Chat Portrait (recommended) and set Actor to Speak As correctly.

🗺️ Roadmap

Sheet-aware context (character & ship sheets)

More TTS engines

Per-AI system prompts & tool use

Better moderation/filters

🤝 Contributing

Issues and PRs welcome!

Fork the repo

Create a feature branch

Submit a PR with a clear description

📄 License

MIT © BdGM

🙏 Credits

Foundry VTT by Atropos

Chat Portrait by ShoyuVanilla (optional recommendation)

ElevenLabs for TTS (optional)

🔗 Links

Repo: https://github.com/BdrGM/nova-multiai

Manifest: https://raw.githubusercontent.com/BdrGM/nova-multiai/main/module.json

Releases: https://github.com/BdrGM/nova-multiai/releases

# nova-multiai
“Author: BdGM”
![Total downloads](https://img.shields.io/github/downloads/BdrGM/nova-multiai/total)
