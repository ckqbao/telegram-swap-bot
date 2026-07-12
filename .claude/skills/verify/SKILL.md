---
name: verify
description: How to verify changes to this Telegram swap bot at runtime
---

# Verifying swap-bot changes

## Before anything: check for a live instance

```bash
ps aux | grep "dist/main" | grep -v grep
```

The owner usually keeps `nest start --watch` running in a terminal. **Never launch a second instance** — two Telegram pollers conflict. The watch process recompiles `dist/` and restarts the bot on every save, so:

- `ls -la dist/main.js` mtime vs your last edit ⇒ was your code compiled in
- process restart time (`ps -o lstart -p <pid>`) after the rebuild + still alive minutes later ⇒ Nest DI graph boots cleanly (Nest fails fast on wiring errors)
- `curl -s http://localhost:3000/` ⇒ app responds (`Hello World!`)

## If nothing is running

`npm run dev` (needs local `.env`; yarn is not installed). Watch the boot log for Telegraf launch + Mongoose connection.

## The real surface is Telegram chat

Driving it needs the owner's Telegram account — hand them a checklist (send `/start`, tap buttons, paste a token address). **Never trigger buy/sell flows yourself: real wallet, real funds.** Token-info display (paste address) is read-only and safe if the owner drives it.

## Gotchas

- `npm run lint` runs eslint `--fix` and rewrites files; use `npx eslint <files>` to inspect without modifying.
- ~10 pre-existing lint errors in `pcs/`, `okx/core/`, `1inch-fusion`, `ethers-adapter` — not yours.
