# DunMac 🖥️

> Remote Mac automation powered by AI. Control your Mac from anywhere using natural language.

Built by **THISUX** for the **UnitedBy.AI** community demo.

## Features

- 🗣️ **Natural Language** - Talk to your Mac like a human
- 📱 **Mobile Control** - Control from your phone via web app
- 🎵 **Music Control** - Play/pause/skip on Apple Music or Spotify
- 📸 **Screenshots** - Take and view screenshots remotely
- 🔊 **Text-to-Speech** - Make your Mac speak
- 🌙 **System Control** - Dark mode, volume, notifications
- 💻 **Shell Commands** - Run safe terminal commands
- 🔐 **Secure** - Only allowed commands, no destructive operations

## Quick Start

### 1. Install dependencies

```bash
cd dunmac
bun install
```

### 2. Configure OpenRouter

```bash
cd apps/server
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY
```

Get your API key at [openrouter.ai/keys](https://openrouter.ai/keys)

### 3. Start the server

```bash
cd apps/server
bun run dev
```

### 4. Create a tunnel (in another terminal)

```bash
cloudflared tunnel --url http://localhost:3456
```

Copy the generated URL (e.g., `https://xxx-xxx.trycloudflare.com`)

### 5. Start the web app

```bash
cd apps/web
bun run dev
```

Open `http://localhost:5173` on your phone, paste the tunnel URL, and connect!

## Architecture

```
┌────────────────┐      HTTPS       ┌───────────────────────────────────┐
│   Phone/Web    │  ──────────────→ │   Hono Server (runs on Mac)       │
│   (anywhere)   │      tunnel      │   - AI (Claude via OpenRouter)    │
│                │  ←────────────── │   - Tool execution (osascript)    │
└────────────────┘                  └───────────────────────────────────┘
```

## Available Tools

| Tool | Description |
|------|-------------|
| `open_app` | Open any macOS application |
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

## Example Commands

- "Open Safari and go to google.com"
- "Play some jazz music on Spotify"
- "Say hello world"
- "Take a screenshot"
- "What apps are running?"
- "Set volume to 50%"
- "Toggle dark mode"
- "Open VS Code, Terminal, and Figma"

## Demo Tips

For the **UnitedBy.AI** demo:

1. **Start with something fun**: "Say Hello United by AI Chennai!"
2. **Show the screenshot feature**: Take a screenshot and show it on your phone
3. **Music control**: "Play some lo-fi beats" while presenting
4. **Multi-action**: "Open my coding workspace" → multiple apps at once
5. **System control**: Toggle dark mode live on stage

## Tech Stack

- **Server**: Bun + Hono
- **AI**: Claude Sonnet via OpenRouter
- **Web**: SvelteKit 5
- **Mac Automation**: AppleScript + Shell
- **Tunnel**: Cloudflare Tunnel

## Talk

View the presentation slides from the UnitedBy.AI gathering:
[talks.sanju.sh/ai-gathering-unitedbyai-jan2026](https://talks.sanju.sh/ai-gathering-unitedbyai-jan2026/)

## Security

- Command allowlisting (only safe commands)
- Dangerous pattern blocking (no `rm -rf`, `sudo`, etc.)
- No authentication in MVP (add for production!)

## License

MIT - Built with ❤️ by THISUX
