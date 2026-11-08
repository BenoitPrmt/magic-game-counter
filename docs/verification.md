# V1 Verification

Checks performed on November 7, 2026.

## Automated checks

- `pnpm typecheck`: strict type checking.
- `pnpm lint`: React, Next.js, and TypeScript rules.
- `pnpm test`: 10 cases covering life totals, eliminations, simultaneous losses, undo, exceptions, concessions, manual results, rematches, rotations, bounded history, and invalid or unavailable storage.
- `pnpm build`: complete static export, a locally bundled font, and a generated service worker with a content hash.
- `pnpm test:pwa` (after building): 4 cases covering the presence of precached assets, offline reloads, explicit updates, targeted cleanup of old caches, and exclusion of external/non-GET requests from interception.

## Browser checks

- Game setup with names, 20/40 starting life, and custom values.
- Duel: the top counter is rotated by 180°, including the name and buttons.
- 3 to 6 players at 390 × 844: counters and buttons remain within their zones, without overflow.
- 6 players: all four individual rotations at 320 × 568 and 844 × 390, without clipped buttons or scores.
- A native Chrome press held for 1.1 seconds: 20 → 14, stopping on release; the next short click: 14 → 15; the other player remains unchanged.
- Saving after a change, reloading, and undoing an action.
- Starting life set to 1: a win is detected at 0, the second loss can be entered without interruption, a draw is detected, and correction and undo remain available.
- Screen wake lock: reported as active in the test browser.
- Updates: hidden during a game, offered after returning to setup, with successful activation and reload.
- Production offline mode: server shutdown confirmed by a failed HTTP request, game reloaded from the cache, saved life total restored, and life total changes still working.
- No errors in the production console during the normal flow.

## Verification limitations

Mobile viewport sizes were checked in a desktop browser. Installation on physical iOS/Android devices, hardware safe areas, and power-saving policies still need to be checked on those devices. The installation button uses the native prompt when available and otherwise displays Safari/Android instructions.

## Visual redesign — November 8, 2026

- Three compositions: compact game setup, multiplayer cards, and a face-to-face duel.
- Dark mode is the default for a new installation; existing preferences and saved games are preserved.
- New multiplayer games start with upright cards; individual rotation remains available. Duels retain their opposing orientations.
- Original SVG twilight scenery and card terrain, matching PWA icons, and assets included in the offline cache.
- Checks: 3 to 6 players at 320 × 568, all four rotations with 6 players in portrait and landscape (844 × 390), and duels in both orientations. No clipped buttons or scores.
- Color picker, return to setup with confirmation, history, and undo checked in the browser.
- Type checking, lint, 10 functional tests, the static build, and 4 service worker tests passed.

## Matte direction — November 8, 2026

- Charcoal/ivory backgrounds, muted colors, and opaque surfaces. Illustrations, gradients, halos, decorative transparency, the medallion, and slogans removed.
- Direct result labels. Storage/cache errors and updates remain contextual; permanent technical status messages removed.
- 60 browser layout checks: 2 to 6 players, light/dark themes, 320 × 568, 390 × 844, and 844 × 390, with default and rotated orientations. Scores tested up to 10000. No clipped scores or buttons, no board overflow, and no button targets smaller than 44 px.
- Production screenshots of all three views in both themes; visible form labels and input examples preserved.
- Automatic wins, simultaneous losses, draws, correction, and undo checked. History and counters restored after reloading.
- Deferred update applied from setup; reload, life total changes, and undo checked with the server stopped. No errors in the production console during this flow.
- Type checking, lint, 10 functional tests, the build, and 4 PWA tests passed. The game engine and saved-state format remain unchanged.
