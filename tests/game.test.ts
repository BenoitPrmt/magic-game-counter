import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  DEFAULT_SETUP,
  eliminated,
  outcome,
  reduceGame,
  rematch,
} from "../lib/game";
import { validGame, validSetup } from "../lib/storage";
const start = () =>
  createGame(
    { ...DEFAULT_SETUP, names: ["Benoît", "Chandra", "", "", "", ""] },
    100,
  );
test("creates two to six named players with opposing seats only in duels", () => {
  for (let count = 2; count <= 6; count++) {
    const g = createGame({ ...DEFAULT_SETUP, count });
    assert.equal(g.players.length, count);
    assert.equal(g.players[0].rotation, count === 2 ? 180 : 0);
    assert.equal(g.players.at(-1)?.rotation, 0);
    assert.equal(g.players.at(-1)?.name, `Joueur ${count}`);
    assert.equal(outcome(g), null);
  }
});
test("life changes are independent and reversible, including elimination", () => {
  const initial = start();
  const g = reduceGame(initial, { type: "life", id: "0", delta: -20 });
  assert.equal(g.players[0].life, 0);
  assert.equal(g.players[1].life, 20);
  assert.equal(outcome(g)?.winner, "1");
  assert.ok(eliminated(g, g.players[0]));
  assert.deepEqual(reduceGame(g, { type: "undo" }), initial);
});
test("supports negative life, simultaneous losses and recovery after detection", () => {
  let g = reduceGame(start(), { type: "life", id: "0", delta: -25 });
  g = reduceGame(g, { type: "life", id: "1", delta: -20 });
  assert.equal(outcome(g)?.winner, null);
  g = reduceGame(g, { type: "life", id: "0", delta: 26 });
  assert.equal(outcome(g)?.winner, "0");
});
test("elimination in multiplayer preserves seats and only ends at last survivor", () => {
  let g = createGame({ ...DEFAULT_SETUP, count: 4 });
  g = reduceGame(g, { type: "concede", id: "0" });
  assert.equal(outcome(g), null);
  g = reduceGame(g, { type: "life", id: "1", delta: -20 });
  assert.equal(outcome(g), null);
  g = reduceGame(g, { type: "concede", id: "2" });
  assert.equal(outcome(g)?.winner, "3");
  assert.equal(g.players.length, 4);
});
test("exceptions and manual detection settings override life losses", () => {
  let g = reduceGame(start(), { type: "life", id: "0", delta: -20 });
  g = reduceGame(g, { type: "protect", id: "0" });
  assert.equal(outcome(g), null);
  g = reduceGame(g, { type: "concede", id: "0" });
  assert.equal(outcome(g)?.winner, "1");
  g = reduceGame(start(), { type: "automatic", value: false });
  g = reduceGame(g, { type: "life", id: "0", delta: -20 });
  assert.equal(outcome(g), null);
});
test("manual results lock life changes and can be resumed or undone", () => {
  const initial = start();
  let g = reduceGame(initial, { type: "finish", winner: "0" });
  assert.equal(outcome(g)?.winner, "0");
  assert.deepEqual(reduceGame(g, { type: "life", id: "1", delta: 5 }), g);
  assert.deepEqual(reduceGame(g, { type: "undo" }), initial);
  g = reduceGame(g, { type: "resume" });
  assert.equal(outcome(g), null);
  g = reduceGame(g, { type: "finish", winner: null });
  assert.equal(outcome(g)?.winner, null);
});
test("rematch preserves names, colors and seating while clearing concessions and protection", () => {
  let g = reduceGame(start(), { type: "protect", id: "0" });
  g = reduceGame(g, { type: "concede", id: "1" });
  g = reduceGame(g, { type: "rotate", id: "0" });
  const r = rematch(g);
  assert.equal(r.players[0].name, "Benoît");
  assert.equal(r.players[0].rotation, 270);
  assert.equal(r.history.length, 0);
  assert.ok(
    r.players.every((p) => p.life === 20 && !p.conceded && !p.protected),
  );
  assert.equal(outcome(r), null);
});
test("storage validation accepts round trips and rejects corrupt state", () => {
  const g = reduceGame(start(), { type: "life", id: "0", delta: -1 });
  assert.ok(validGame(JSON.parse(JSON.stringify(g))));
  assert.ok(validSetup(DEFAULT_SETUP));
  for (const bad of [
    null,
    {},
    { ...g, players: [g.players[0]] },
    { ...g, result: { winner: "missing", manual: true } },
    { ...g, history: [{}] },
    { ...g, players: g.players.map((p) => ({ ...p, life: "oops" })) },
  ])
    assert.equal(validGame(bad), false);
});
test("history is bounded and rotates through all four orientations", () => {
  let g = start();
  for (let n = 0; n < 305; n++) g = reduceGame(g, { type: "rotate", id: "0" });
  assert.equal(g.history.length, 300);
  assert.equal(g.players[0].rotation, 270);
  assert.equal(reduceGame(g, { type: "undo" }).players[0].rotation, 180);
});

test("storage survives JSON round trips, malformed data and unavailable storage", async () => {
  const { readStored, saveStored, STORAGE_KEY } =
    await import("../lib/storage");
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
    },
  });
  try {
    const game = start();
    assert.ok(
      saveStored({ version: 1, setup: DEFAULT_SETUP, game, dark: true }),
    );
    assert.deepEqual(readStored().data.game, game);
    memory.set(
      STORAGE_KEY,
      JSON.stringify({ version: 1, setup: {}, game, dark: true }),
    );
    assert.equal(readStored().error, true);
    assert.deepEqual(readStored().data.game, game);
    memory.set(STORAGE_KEY, "{broken");
    assert.equal(readStored().error, true);
    assert.equal(readStored().data.game, null);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Storage denied");
      },
    });
    assert.equal(readStored().error, true);
    assert.equal(
      saveStored({ version: 1, setup: DEFAULT_SETUP, game, dark: false }),
      false,
    );
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
