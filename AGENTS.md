# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

DunMac lets you control your Mac remotely from a phone using natural language. You type a command in a web app, it goes through a Cloudflare tunnel to a Hono server running on the Mac, Claude (via OpenRouter) picks the right tools, and AppleScript/shell executes it.

## Commands

```bash
# Install
bun install

# Run both apps together
bun run dev

# Run individually
bun run dev:server   # Hono server on :3456
bun run dev:web      # SvelteKit on :5173

# Expose server via tunnel (required for phone access)
bun run tunnel       # cloudflared tunnel --url http://localhost:3456
```

No test suite. No linting config. TypeScript is checked via `tsc` implicitly through Bun.

## Architecture

```
apps/
  server/   Bun + Hono — runs on the Mac, all AI and tool execution happens here
  web/      SvelteKit — phone-facing UI, just sends messages to the server
```

**Server flow:** `POST /chat` → `ai.ts:chat()` → Vercel AI SDK `generateText` with OpenRouter → tool calls dispatched via `tools/index.ts:executeTool()` → AppleScript / shell.

**Tool system:** Each tool in `apps/server/src/tools/` exports a `ToolDefinition` (name, description, Zod parameters schema, execute function). All tools are registered in `tools/index.ts`. The AI SDK receives them as typed tools and calls `execute` automatically.

**Web client:** Single-page SvelteKit app. `src/lib/api.ts` handles all server communication. The server URL (tunnel URL) is entered by the user and stored in component state.

## Adding a tool

1. Create `apps/server/src/tools/my-tool.ts` exporting a `ToolDefinition`
2. Register it in `apps/server/src/tools/index.ts`

The tool description goes directly to Claude as a function description — write it clearly.

## Security model

`shell` tool: commands must be in `ALLOWED_COMMANDS`, shell metacharacters (`; | & \` $ ( ) < >`) are blocked, dangerous patterns (`rm -rf`, `sudo`, etc.) are blocked, and execution times out at 10s. Other tools use AppleScript via `osascript`, which has its own macOS permission prompts on first use.

## Environment

`apps/server/.env` (copy from `.env.example`):
```
OPENROUTER_API_KEY="..."
```

The model is hardcoded in `ai.ts` as `anthropic/claude-sonnet-4` via OpenRouter.
