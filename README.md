# DunMac

Control your Mac from your phone using AI. That's it.

I built this for a demo at the [UnitedBy.AI](https://unitedby.ai) gathering in Chennai. Wanted to show how you can talk to your Mac like a human and have it actually do stuff.

## What it does

You type (or say) things like:
- "Open Safari and go to google.com"
- "Play some jazz on Spotify"
- "Take a screenshot"
- "Set volume to 50%"
- "Toggle dark mode"

And your Mac does it. From your phone. From anywhere.

## How it works

```
┌────────────────┐      HTTPS       ┌───────────────────────────────────┐
│   Phone/Web    │  ──────────────→ │   Hono Server (runs on Mac)       │
│   (anywhere)   │      tunnel      │   - AI (Claude via OpenRouter)    │
│                │  ←────────────── │   - Tool execution (osascript)    │
└────────────────┘                  └───────────────────────────────────┘
```

The AI (Claude via OpenRouter) takes your natural language and picks the right tools to run. Music control, screenshots, opening apps, system settings - all through AppleScript and shell commands.

## Tools

| Tool | What it does |
|------|--------------|
| `open_app` | Open any macOS app |
| `open_url` | Open URL in browser |
| `say` | Text-to-speech |
| `notify` | Show macOS notification |
| `screenshot` | Capture screen |
| `shell` | Run safe shell commands |
| `music_play` | Play music (Apple Music/Spotify) |
| `music_pause` | Pause playback |
| `music_next` | Next track |
| `music_previous` | Previous track |
| `volume_set` | Set volume (0-100) |
| `volume_mute` | Mute/unmute |
| `dark_mode` | Toggle dark mode |
| `lock_screen` | Lock screen |
| `battery_status` | Get battery info |
| `running_apps` | List running apps |
| `front_app` | Get focused app |

## Setup

```bash
bun install
cp .env.example .env
# add your OPENROUTER_API_KEY from openrouter.ai/keys
```

Run the server:
```bash
cd apps/server && bun run dev
```

Create a tunnel so your phone can reach it:
```bash
cloudflared tunnel --url http://localhost:3456
```

Start the web app:
```bash
cd apps/web && bun run dev
```

Open localhost:5173 on your phone, paste the tunnel URL, connect. Done.

## Tech

- Bun + Hono for the server
- Claude Sonnet via OpenRouter for the AI
- SvelteKit for the web app
- AppleScript for Mac automation
- Cloudflare Tunnel for remote access

## Security

Only allowlisted commands run. Dangerous stuff like `rm -rf` or `sudo` is blocked. No auth in this version though - add that if you're using this for real.

## Talk

I presented this at [UnitedBy.AI](https://unitedby.ai). Slides here: [talks.sanju.sh/ai-gathering-unitedbyai-jan2026](https://talks.sanju.sh/ai-gathering-unitedbyai-jan2026/)

---

Built by [THISUX](https://thisux.com)
