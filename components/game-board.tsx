"use client";
import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Minus,
  Plus,
  RotateCw,
  Undo2,
  X,
  History,
  Flag,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { type Game, type Action, eliminated, outcome } from "@/lib/game";
import { HoldButton } from "./hold-button";
import { Modal } from "./modal";
import { useWakeLock } from "./use-wake-lock";
export function GameBoard({
  game,
  dispatch,
  onNew,
  onRematch,
  dark,
  onThemeChange,
}: {
  game: Game;
  dispatch: (a: Action) => void;
  onNew: () => void;
  onRematch: () => void;
  dark: boolean;
  onThemeChange: () => void;
}) {
  const [keepAwake, setKeepAwake] = useState(true);
  const wakeStatus = useWakeLock(keepAwake);
  const [panel, setPanel] = useState<"menu" | "history" | "leave" | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [confirm, setConfirm] = useState<"new" | "rematch" | null>(null);
  const result = outcome(game);
  const [dismissed, setDismissed] = useState("");
  const signature = result
    ? `${game.id}-${result.winner}-${game.history.at(-1)?.id}-${game.history.at(-1)?.at}`
    : "";
  const detected = !!result && signature !== dismissed;
  function closeResult() {
    setShowResult(false);
    setDismissed(signature);
    if (game.result) dispatch({ type: "resume" });
  }
  return (
    <div
      className={`game-screen ${game.players.length === 2 ? "duel-screen" : "multiplayer-screen"}`}
    >
      <header className="game-header">
        <button
          className="back-button"
          aria-label="Revenir à la création"
          onClick={() => setPanel("leave")}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1>Partie</h1>
          <p>
            {game.players.length} joueurs · {game.initialLife} vie
            {game.initialLife > 1 ? "s" : ""}
          </p>
        </div>
        <nav className="game-toolbar" aria-label="Actions de la partie">
          <button
            aria-label="Annuler la dernière action"
            disabled={!game.history.length}
            onClick={() => dispatch({ type: "undo" })}
          >
            <Undo2 size={19} />
          </button>
          <button
            aria-label="Ouvrir le menu de la partie"
            onClick={() => {
              setPanel("menu");
              setConfirm(null);
            }}
          >
            <MoreVertical size={22} />
          </button>
        </nav>
      </header>
      <div
        className={`board board-${game.players.length}`}
        aria-label="Plateau de jeu"
      >
        {game.players.map((player) => (
          <PlayerZone
            key={player.id}
            player={player}
            out={eliminated(game, player)}
            locked={!!game.result || !!panel || showResult}
            dispatch={dispatch}
          />
        ))}
      </div>
      <footer className="game-footer">
        <button onClick={() => setPanel("history")}>
          <History size={17} /> Historique
        </button>
      </footer>
      {detected && !game.result && (
        <div className="outcome-banner" role="status">
          <span>
            {result.winner === null
              ? "Match nul"
              : `Victoire de ${game.players.find((p) => p.id === result.winner)?.name}`}
          </span>
          <button onClick={() => setShowResult(true)}>Voir</button>
          <button
            className="banner-close"
            aria-label="Continuer la saisie"
            onClick={() => setDismissed(signature)}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {((showResult && result) || game.result) && (
        <Modal
          className="result-dialog"
          labelledBy="result-title"
          onClose={closeResult}
        >
          <h2 id="result-title">
            {result?.winner === null
              ? "Match nul"
              : `Victoire de ${game.players.find((p) => p.id === result?.winner)?.name}`}
          </h2>
          <button
            className="primary"
            onClick={() => {
              setShowResult(false);
              onRematch();
            }}
          >
            Revanche <RotateCcw size={16} />
          </button>
          <button className="secondary" onClick={onNew}>
            Nouvelle partie
          </button>
          <button className="text-button" onClick={closeResult}>
            Reprendre pour corriger
          </button>
        </Modal>
      )}
      {panel && (
        <Modal
          className="menu-dialog"
          labelledBy="menu-title"
          onClose={() => setPanel(null)}
        >
          <div className="dialog-header">
            <h2 id="menu-title">
              {panel === "history"
                ? "Historique de la partie"
                : panel === "leave"
                  ? "Revenir à la création ?"
                  : "Votre partie"}
            </h2>
            <button
              className="icon-button"
              aria-label="Fermer le menu"
              onClick={() => setPanel(null)}
            >
              <X size={18} />
            </button>
          </div>
          {panel === "leave" ? (
            <>
              <p className="install-copy">La partie en cours sera remplacée.</p>
              <div className="menu-bottom">
                <button className="secondary" onClick={() => setPanel(null)}>
                  Continuer à jouer
                </button>
                <button className="primary" onClick={onNew}>
                  Nouvelle partie
                </button>
              </div>
            </>
          ) : panel === "history" ? (
            <>
              <button className="text-button" onClick={() => setPanel("menu")}>
                <ArrowLeft size={16} /> Retour aux réglages
              </button>
              <ol className="history-list">
                {game.history.toReversed().map((h) => (
                  <li key={h.id}>
                    <span>{h.label}</span>
                    <time>
                      {new Date(h.at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </li>
                ))}
                {!game.history.length && <li>Aucune action.</li>}
              </ol>
            </>
          ) : (
            <>
              <p className="menu-description">
                {game.players.length} joueurs · {game.initialLife} vie
                {game.initialLife > 1 ? "s" : ""} au départ
              </p>
              <button className="menu-row" onClick={() => setPanel("history")}>
                <History size={18} /> Historique{" "}
                <span>{game.history.length}</span>
              </button>
              <label className="toggle-row">
                <span>
                  Détecter les éliminations
                  <small>À 0 vie ou moins, sauf exception activée.</small>
                </span>
                <input
                  type="checkbox"
                  checked={game.automatic}
                  disabled={!!game.result}
                  onChange={(e) =>
                    dispatch({ type: "automatic", value: e.target.checked })
                  }
                />
              </label>
              <label className="toggle-row">
                <span>
                  Garder l’écran allumé
                  <small>
                    {!keepAwake
                      ? "Désactivé"
                      : wakeStatus === "active"
                        ? "Actif pendant cette partie"
                        : wakeStatus === "unavailable"
                          ? "Indisponible dans ce navigateur ou en économie d’énergie"
                          : "Activation en cours…"}
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={keepAwake}
                  onChange={(e) => setKeepAwake(e.target.checked)}
                />
              </label>
              <label className="toggle-row">
                <span>Thème sombre</span>
                <input
                  type="checkbox"
                  checked={dark}
                  onChange={onThemeChange}
                />
              </label>
              <div className="player-settings">
                {game.players.map((p) => (
                  <div className="player-setting" key={p.id}>
                    <div>
                      <span className={`small-orb ${p.color}`} />
                      <strong>{p.name}</strong>
                      <button
                        className="icon-button"
                        aria-label={`Tourner la zone de ${p.name}`}
                        disabled={!!game.result}
                        onClick={() => dispatch({ type: "rotate", id: p.id })}
                      >
                        <RotateCw size={16} />
                      </button>
                    </div>
                    <label className="exception-label">
                      <input
                        type="checkbox"
                        disabled={!!game.result}
                        checked={p.protected}
                        onChange={() => dispatch({ type: "protect", id: p.id })}
                      />
                      <ShieldCheck size={14} /> Reste en jeu à 0 vie ou moins
                    </label>
                    <button
                      className="text-button danger"
                      disabled={p.conceded || !!game.result}
                      onClick={() => dispatch({ type: "concede", id: p.id })}
                    >
                      <Flag size={14} />
                      {p.conceded ? "A abandonné" : "Abandonner"}
                    </button>
                  </div>
                ))}
              </div>
              <label className="manual-result">
                Déclarer le résultat
                <select
                  value=""
                  disabled={!!game.result}
                  onChange={(e) => {
                    if (e.target.value) {
                      dispatch({
                        type: "finish",
                        winner:
                          e.target.value === "draw" ? null : e.target.value,
                      });
                      setPanel(null);
                      setShowResult(true);
                    }
                  }}
                >
                  <option value="">Choisir un résultat…</option>
                  {game.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      Victoire de {p.name}
                    </option>
                  ))}
                  <option value="draw">Match nul</option>
                </select>
              </label>
              <p className="hint">
                Les effets des cartes ne sont pas pris en compte.
              </p>
              {confirm ? (
                <div className="confirm-box">
                  <p>
                    {confirm === "new"
                      ? "Quitter cette partie et créer une nouvelle table ?"
                      : "Recommencer avec les mêmes joueurs ?"}{" "}
                    Les compteurs seront réinitialisés.
                  </p>
                  <div>
                    <button
                      className="secondary"
                      onClick={() => setConfirm(null)}
                    >
                      Continuer à jouer
                    </button>
                    <button
                      className="primary"
                      onClick={() => {
                        setPanel(null);
                        if (confirm === "new") onNew();
                        else onRematch();
                      }}
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="menu-bottom">
                  <button
                    className="secondary"
                    onClick={() => setConfirm("rematch")}
                  >
                    Revanche
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setConfirm("new")}
                  >
                    Nouvelle partie
                  </button>
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
function PlayerZone({
  player,
  out,
  locked,
  dispatch,
}: {
  player: Game["players"][number];
  out: boolean;
  locked: boolean;
  dispatch: (a: Action) => void;
}) {
  const [change, setChange] = useState(0);
  const previousLife = useRef(player.life);
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const delta = player.life - previousLife.current;
    previousLife.current = player.life;
    if (!delta) return;
    const update = setTimeout(() => setChange((current) => current + delta), 0);
    if (reset.current) clearTimeout(reset.current);
    reset.current = setTimeout(() => setChange(0), 1500);
    return () => clearTimeout(update);
  }, [player.life]);
  useEffect(
    () => () => {
      if (reset.current) clearTimeout(reset.current);
    },
    [],
  );
  function step(delta: number) {
    dispatch({ type: "life", id: player.id, delta });
  }
  const sideways = player.rotation % 180 !== 0;
  return (
    <section
      className={`player-zone ${player.color} ${out ? "is-out" : ""}`}
      aria-label={`Compteur de ${player.name}`}
    >
      <div
        className={`zone-content ${sideways ? "sideways" : ""}`}
        style={
          {
            "--rotation": `${player.rotation}deg`,
            "--digits": Math.max(2, String(player.life).length),
          } as React.CSSProperties
        }
      >
        <div className="zone-heading">
          <span className="zone-dot" />
          <h2>{player.name}</h2>
          {out && (
            <span className="out-label">
              {player.conceded ? "Abandon" : "Éliminé"}
            </span>
          )}
        </div>
        <div className="life-controls">
          <HoldButton
            label={`Retirer une vie à ${player.name}`}
            disabled={locked || player.conceded}
            onStep={() => step(-1)}
          >
            <Minus />
          </HoldButton>
          <div className="life-total" aria-live="polite" aria-atomic="true">
            <span
              className="life-number"
              aria-label={`${player.life} point${Math.abs(player.life) === 1 ? "" : "s"} de vie`}
            >
              {player.life}
            </span>
            <span
              className={`life-change ${change ? "visible" : ""}`}
              aria-hidden="true"
            >
              {change > 0 ? "+" : ""}
              {change || ""}
            </span>
          </div>
          <HoldButton
            label={`Ajouter une vie à ${player.name}`}
            disabled={locked || player.conceded}
            onStep={() => step(1)}
          >
            <Plus />
          </HoldButton>
        </div>
        {player.protected && (
          <span className="zone-bottom">Reste en jeu à 0 vie</span>
        )}
      </div>
    </section>
  );
}
