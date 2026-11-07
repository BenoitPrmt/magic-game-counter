import {
  COLORS,
  DEFAULT_SETUP,
  type Game,
  type Setup,
  type Snapshot,
  type Player,
} from "./game";
export const STORAGE_KEY = "compagnon:v1";
export type Stored = {
  version: 1;
  setup: Setup;
  game: Game | null;
  dark: boolean;
};
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const integer = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v);
function player(v: unknown): v is Player {
  return (
    record(v) &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    v.name.length <= 24 &&
    COLORS.includes(v.color as (typeof COLORS)[number]) &&
    integer(v.life) &&
    integer(v.rotation) &&
    [0, 90, 180, 270].includes(v.rotation) &&
    typeof v.conceded === "boolean" &&
    typeof v.protected === "boolean"
  );
}
function snapshot(v: unknown): v is Snapshot {
  return (
    record(v) &&
    Array.isArray(v.players) &&
    v.players.length >= 2 &&
    v.players.length <= 6 &&
    v.players.every(player) &&
    new Set(v.players.map((p) => p.id)).size === v.players.length &&
    typeof v.automatic === "boolean" &&
    (v.result === null ||
      (record(v.result) &&
        typeof v.result.manual === "boolean" &&
        (v.result.winner === null ||
          v.players.some(
            (p) => p.id === (v.result as Record<string, unknown>).winner,
          ))))
  );
}
export function validGame(v: unknown): v is Game {
  return (
    record(v) &&
    typeof v.id === "string" &&
    integer(v.initialLife) &&
    v.initialLife >= 1 &&
    v.initialLife <= 9999 &&
    integer(v.createdAt) &&
    Array.isArray(v.history) &&
    v.history.length <= 300 &&
    v.history.every(
      (h) =>
        record(h) &&
        integer(h.id) &&
        integer(h.at) &&
        typeof h.label === "string" &&
        snapshot(h.before),
    ) &&
    snapshot(v)
  );
}
export function validSetup(v: unknown): v is Setup {
  return (
    record(v) &&
    integer(v.count) &&
    v.count >= 2 &&
    v.count <= 6 &&
    integer(v.life) &&
    v.life >= 1 &&
    v.life <= 9999 &&
    typeof v.custom === "boolean" &&
    Array.isArray(v.names) &&
    v.names.length === 6 &&
    v.names.every((n) => typeof n === "string" && n.length <= 24) &&
    Array.isArray(v.colors) &&
    v.colors.length === 6 &&
    v.colors.every((c) => integer(c) && c >= 0 && c < 5)
  );
}
export function readStored(): { data: Stored; error: boolean } {
  const fallback: Stored = {
    version: 1,
    setup: DEFAULT_SETUP,
    game: null,
    dark:
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: fallback, error: false };
    const saved: unknown = JSON.parse(raw);
    if (!record(saved) || saved.version !== 1)
      return { data: fallback, error: true };
    const setupOK = validSetup(saved.setup),
      gameOK = saved.game === null || validGame(saved.game);
    return {
      data: {
        version: 1,
        setup: setupOK ? (saved.setup as Setup) : DEFAULT_SETUP,
        game: gameOK ? (saved.game as Game | null) : null,
        dark: typeof saved.dark === "boolean" ? saved.dark : fallback.dark,
      },
      error: !setupOK || !gameOK,
    };
  } catch {
    return { data: fallback, error: true };
  }
}
export function saveStored(data: Stored): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
