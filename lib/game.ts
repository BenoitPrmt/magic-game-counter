export const COLORS = ["blue", "red", "green", "ivory", "black"] as const;
export type Color = (typeof COLORS)[number];
export type Player = {
  id: string;
  name: string;
  color: Color;
  life: number;
  rotation: number;
  conceded: boolean;
  protected: boolean;
};
export type Setup = {
  count: number;
  names: string[];
  colors: number[];
  life: number;
  custom: boolean;
};
export type Result = { winner: string | null; manual: boolean };
export type Snapshot = {
  players: Player[];
  automatic: boolean;
  result: Result | null;
};
export type Entry = { id: number; at: number; label: string; before: Snapshot };
export type Game = Snapshot & {
  id: string;
  initialLife: number;
  history: Entry[];
  createdAt: number;
};
export type Action =
  | { type: "life"; id: string; delta: number }
  | { type: "rotate"; id: string }
  | { type: "protect"; id: string }
  | { type: "concede"; id: string }
  | { type: "automatic"; value: boolean }
  | { type: "finish"; winner: string | null }
  | { type: "resume" }
  | { type: "undo" };
export const DEFAULT_SETUP: Setup = {
  count: 2,
  names: ["", "", "", "", "", ""],
  colors: [0, 1, 2, 3, 4, 0],
  life: 20,
  custom: false,
};
export function createGame(setup: Setup, now = Date.now()): Game {
  return {
    id: String(now),
    initialLife: setup.life,
    createdAt: now,
    automatic: true,
    result: null,
    history: [],
    players: Array.from({ length: setup.count }, (_, i) => ({
      id: String(i),
      name: setup.names[i]?.trim() || `Joueur ${i + 1}`,
      color: COLORS[setup.colors[i]],
      life: setup.life,
      rotation: (setup.count <= 3 ? i === 0 : i < 2) ? 180 : 0,
      conceded: false,
      protected: false,
    })),
  };
}
export function eliminated(game: Snapshot, player: Player) {
  return (
    player.conceded || (game.automatic && player.life <= 0 && !player.protected)
  );
}
export function outcome(game: Snapshot): Result | null {
  if (game.result) return game.result;
  const active = game.players.filter((p) => !eliminated(game, p));
  return active.length <= 1
    ? { winner: active[0]?.id ?? null, manual: false }
    : null;
}
function snapshot(game: Game): Snapshot {
  return {
    players: game.players,
    automatic: game.automatic,
    result: game.result,
  };
}
export function reduceGame(game: Game, action: Action, now = Date.now()): Game {
  if (action.type === "undo") {
    const last = game.history.at(-1);
    return last
      ? { ...game, ...last.before, history: game.history.slice(0, -1) }
      : game;
  }
  if (game.result && action.type !== "resume") return game;
  const next = { ...game, players: game.players.map((p) => ({ ...p })) };
  let label = "";
  if ("id" in action) {
    const player = next.players.find((p) => p.id === action.id);
    if (!player) return game;
    if (action.type === "life") {
      if (player.conceded) return game;
      player.life += action.delta;
      label = `${player.name} : ${action.delta > 0 ? "+" : "−"}${Math.abs(action.delta)} vie${Math.abs(action.delta) > 1 ? "s" : ""} (${player.life})`;
    } else if (action.type === "rotate") {
      player.rotation = (player.rotation + 90) % 360;
      label = `${player.name} : rotation`;
    } else if (action.type === "protect") {
      player.protected = !player.protected;
      label = `${player.name} : ${player.protected ? "reste en jeu malgré ses vies" : "détection rétablie"}`;
    } else if (action.type === "concede") {
      player.conceded = true;
      label = `${player.name} abandonne`;
    }
  } else if (action.type === "automatic") {
    next.automatic = action.value;
    label = `Détection automatique ${action.value ? "activée" : "désactivée"}`;
  } else if (action.type === "finish") {
    next.result = { winner: action.winner, manual: true };
    label =
      action.winner === null
        ? "Match nul déclaré"
        : `Victoire de ${next.players.find((p) => p.id === action.winner)?.name}`;
  } else if (action.type === "resume") {
    next.result = null;
    label = "Partie reprise pour correction";
  }
  return {
    ...next,
    history: [
      ...game.history,
      {
        id: (game.history.at(-1)?.id ?? 0) + 1,
        at: now,
        label,
        before: snapshot(game),
      },
    ].slice(-300),
  };
}
export function rematch(game: Game): Game {
  return {
    ...game,
    id: String(Date.now()),
    createdAt: Date.now(),
    history: [],
    result: null,
    players: game.players.map((p) => ({
      ...p,
      life: game.initialLife,
      conceded: false,
      protected: false,
    })),
  };
}
