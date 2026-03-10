# bePresent

A Chrome extension that blocks doomscroll feeds while [Claude Code](https://claude.ai/claude-code) is running — so you stay focused instead of falling into infinite scroll.

**The idea:** if Claude is working, you should be too. When Claude stops, your feeds come back.

## Blocked Platforms

| Platform | What's blocked |
|----------|---------------|
| Instagram | Reels (`/reels`) |
| YouTube | Shorts (`/shorts`) |
| X (Twitter) | Entire feed |

## How It Works

```
┌─────────────────┐     hooks      ┌─────────────────┐    websocket    ┌─────────────────┐
│   Claude Code   │ ─────────────► │  Blocker Server │ ◄─────────────► │ Chrome Extension│
│   (terminal)    │                │  (localhost)    │                 │   (browser)     │
└─────────────────┘                └─────────────────┘                 └─────────────────┘
```

1. **Claude Code hooks** notify a local server when you submit a prompt or Claude finishes
2. **Blocker server** tracks all Claude Code sessions and their working/idle states
3. **Chrome extension** overlays blocked feeds when no session is actively working

## Quick Start

### 1. Install the server

```bash
npx claude-blocker --setup
```

This installs the Claude Code hooks and starts the server on `localhost:8765`.

### 2. Install the Chrome extension

- Load unpacked from `packages/extension/dist`

### 3. Use it

Toggle blocking on/off from the extension popup. When Claude Code is working, your feeds are unblocked. When Claude is idle, they're blocked.

## Features

- **Soft blocking** — modal overlay, not a hard block
- **Real-time** — no page refresh needed when state changes
- **Multi-session** — tracks multiple Claude Code instances
- **Emergency bypass** — 5-minute bypass, once per day
- **SPA-aware** — detects navigation within Instagram and YouTube

## Server CLI

```bash
npx claude-blocker --setup     # Start with auto-setup
npx claude-blocker --port 9000 # Custom port
npx claude-blocker --remove    # Remove hooks
npx claude-blocker --help      # Show help
```

## Development

```bash
pnpm install
pnpm build
pnpm dev
```

### Project Structure

```
packages/
├── server/      # Node.js server + CLI
├── extension/   # Chrome extension (Manifest V3)
└── shared/      # Shared TypeScript types
```

## Privacy

All data stays on your machine. The server runs on localhost only. See [PRIVACY.md](PRIVACY.md).

## License

MIT

---

Forked from [Claude Blocker](https://github.com/t3-content/claude-blocker) by Theo Browne. Source: [KanishkKundu05/BePresent_Extension](https://github.com/KanishkKundu05/BePresent_Extension).
