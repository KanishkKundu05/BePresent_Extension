# Privacy Policy — bePresent

**Last updated:** March 2026

## Overview

bePresent is a Chrome extension that blocks doomscroll feeds on social media while Claude Code is running. This policy explains what data the extension accesses and how it's handled.

## Data Collection

**bePresent does not collect, transmit, or sell any user data.**

No analytics, telemetry, tracking pixels, or third-party scripts are included.

## Data Stored Locally

The extension stores a small amount of data on your device using the Chrome Storage API (`chrome.storage.sync`):

| Data | Purpose |
|------|---------|
| Enabled/disabled toggle | Remembers whether blocking is active |
| Bypass timestamp | Tracks when your daily 5-minute bypass expires |
| Last bypass date | Prevents reuse of the bypass on the same day |

If you have Chrome Sync enabled, this data syncs across your Chrome devices via your Google account. It never leaves your Google account.

## Network Activity

The extension communicates **only** with a local server running on `localhost:8765` on your machine. This server:

- Runs entirely on your computer
- Never connects to the internet
- Only receives hook notifications from Claude Code running on your machine

**No data is sent to any external server, API, or third party.**

## Permissions

| Permission | Why it's needed |
|------------|----------------|
| `storage` | Save toggle state and bypass status |
| `tabs` | Broadcast state updates to open tabs |
| Host access (Instagram, X, YouTube) | Inject the blocking overlay on these sites |

## Host Permissions

The extension runs content scripts on:

- `*.instagram.com` — to block Reels
- `*.x.com` — to block the feed
- `*.youtube.com` — to block Shorts

The extension does **not** read, collect, or transmit any content from these sites. It only injects a visual overlay to block the feed.

## Data Deletion

Uninstalling the extension removes all stored data. You can also clear it manually via Chrome → Extensions → bePresent → Details → Clear Data.

## Changes

If this policy changes, the update will be reflected here with a new date.

## Contact

For questions about this privacy policy, open an issue on the [GitHub repository](https://github.com/KanishkKundu05/BePresent_Extension).
