# Compagnon

A French-language Magic life counter designed for a shared device at the center of the table.

## Development

```sh
pnpm install
pnpm dev
```

## Verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:pwa # check the generated service worker
```

A Next.js application exported as a static site in `out/`. No account or backend required.

## Features

- 2 to 6 players, with customizable names (24 characters), colors, and starting life totals (1 to 9999).
- Two-player mode: a split screen with opposing orientations. In landscape mode, players sit at the left and right ends. Each player zone can be rotated by 90° from the menu.
- Short press: ±1. Holding for more than 420 ms repeats the action every 125 ms, stopping on release, pointer cancellation, or loss of visibility.
- Undo and a history of the last 300 actions, including settings, concessions, and results.
- Detection at 0 life or below: a non-blocking banner allows simultaneous losses to be entered. The last active player wins; no active players means a draw. Results can be reopened for corrections.
- Per-player exceptions and optional automatic detection. Concessions, manually declared winners, and draws remain available.
- Rematches preserve seating and settings; replacing an ongoing game requires confirmation.
- Light/dark theme preferences and game state are stored locally under `compagnon:v1`. Data is not sent to a server.
- Screen wake lock, when supported, with a new request when returning to the app. The browser or power-saving settings may deny it.

## Production and PWA

```sh
pnpm build
pnpm start
# http://localhost:4173
# Alternative port: pnpm start --port 4174
```

`pnpm build` exports the site and generates `out/sw.js` from all exported files. The cache is identified by a content hash. The previous version remains consistent during a game; updates wait and can only be applied from the game setup screen. A new tab on the same origin loads the same saved state: use only one active table per origin/device.

Deploy **the contents of `out/` at the root of an HTTPS host**. Service workers and installation require HTTPS (or localhost for testing). Serve `sw.js` and HTML documents with `Cache-Control: no-cache`, and `/_next/static/` chunks with immutable caching. The included preview server applies these headers. Do not use `next start` with this static export.

Offline mode becomes available after the first complete load. No permanent technical status is displayed; only cache errors and available updates are reported. The service worker is disabled during development (`pnpm dev`). Installation uses the native prompt when available; other browsers display instructions, including Safari on iOS.

The app tracks life totals and concessions, not card effects. Poison counters and commander damage are not included in this first version. Elimination rules can be overridden manually from the menu.

Completed checks and their limitations are recorded in [docs/verification.md](docs/verification.md). The Outfit font, reused from the reference site, is bundled locally under the SIL OFL license in `public/fonts/`.

## Visual direction

The interface evokes a matte tabletop accessory: charcoal or light paper backgrounds, opaque surfaces, regular-weight Georgia numerals, and brick, slate, olive, ochre, and plum colors. Buttons and fields have touch targets of at least 44 px. Game setup, multiplayer, and duel views retain their distinct compositions, without illustrations, gradients, decorative transparency, or slogans. Outfit is used for the interface. Dark mode remains the default without changing saved preferences.
