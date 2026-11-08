"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GameBoard } from "./game-board";
import { PwaControls } from "./pwa-controls";
import { readStored, saveStored } from "@/lib/storage";
import {
  createGame,
  reduceGame,
  rematch,
  COLORS as colors,
  type Game,
} from "@/lib/game";
import { Moon, Sun, Play, X, Minus, Plus, Check } from "lucide-react";
export const colorNames = ["Ardoise", "Brique", "Olive", "Ocre", "Prune"];
const subscribe = () => () => {};
export function CounterApp() {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return ready ? (
    <ReadyApp />
  ) : (
    <main className="app loading" aria-label="Chargement de votre table">
      <span>Chargement…</span>
    </main>
  );
}
function ReadyApp() {
  const [stored] = useState(readStored);
  const [storageError, setStorageError] = useState(stored.error);
  const [count, setCount] = useState(stored.data.setup.count);
  const [names, setNames] = useState(stored.data.setup.names);
  const [life, setLife] = useState(stored.data.setup.life);
  const [custom, setCustom] = useState(stored.data.setup.custom);
  const [dark, setDark] = useState(stored.data.dark);
  const [playerColors, setPlayerColors] = useState(stored.data.setup.colors);
  const [game, setGame] = useState<Game | null>(stored.data.game);
  useEffect(() => {
    const ok = saveStored({
      version: 1,
      setup: {
        count,
        names,
        colors: playerColors,
        life: Number.isInteger(life) && life >= 1 && life <= 9999 ? life : 20,
        custom,
      },
      game,
      dark,
    });
    if (!ok) queueMicrotask(() => setStorageError(true));
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#191918" : "#F2EFE7");
  }, [count, names, playerColors, life, custom, game, dark]);
  const notice = storageError ? (
    <div className="storage-notice" role="alert">
      La sauvegarde locale est indisponible ou a été réinitialisée. Gardez cet
      écran ouvert.
      <button
        aria-label="Masquer l’avertissement"
        onClick={() => setStorageError(false)}
      >
        ×
      </button>
    </div>
  ) : null;
  const appClass = dark ? "app dark" : "app";
  return (
    <main className={`${appClass}${game ? " playing" : ""}`}>
      <PwaControls inGame={!!game} />
      {game ? (
        <>
          {notice}
          <GameBoard
            key={game.id}
            dark={dark}
            onThemeChange={() => setDark((value) => !value)}
            game={game}
            dispatch={(a) => setGame((g) => (g ? reduceGame(g, a) : g))}
            onNew={() => setGame(null)}
            onRematch={() => setGame(rematch(game))}
          />
        </>
      ) : (
        <>
          {notice}
          <header className="site-header">
            <Link className="brand" href="/" aria-label="Compagnon, accueil">
              <span className="brand-copy">
                <strong>Compteur de vies</strong>
              </span>
            </Link>
            <button
              className="icon-button"
              aria-label={
                dark ? "Activer le thème clair" : "Activer le thème sombre"
              }
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </header>
          <section className="setup-shell">
            <form
              className="setup-card"
              onSubmit={(e) => {
                e.preventDefault();
                if (life >= 1 && life <= 9999 && Number.isInteger(life))
                  setGame(
                    createGame({
                      count,
                      names,
                      colors: playerColors,
                      life,
                      custom,
                    }),
                  );
              }}
            >
              <div className="setup-card-heading">
                <h1>Nouvelle partie</h1>
              </div>
              <div className="form-section">
                <div className="section-line">
                  <h2>Nombre de joueurs</h2>
                </div>
                <div className="segmented player-count">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <button
                      type="button"
                      aria-pressed={count === n}
                      className={count === n ? "selected" : ""}
                      key={n}
                      onClick={() => setCount(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <h2 className="players-label">Noms des joueurs</h2>
              <div className="player-fields">
                {Array.from({ length: count }, (_, i) => (
                  <div className="player-field" key={i}>
                    <ColorPicker
                      index={i}
                      value={playerColors[i]}
                      onChange={(value) =>
                        setPlayerColors((values) =>
                          values.map((c, j) => (j === i ? value : c)),
                        )
                      }
                    />
                    <div className="name-input">
                      <label htmlFor={`name-${i}`}>Joueur {i + 1}</label>
                      <input
                        id={`name-${i}`}
                        maxLength={24}
                        placeholder={
                          [
                            "Ex. Benoît",
                            "Ex. Chandra",
                            "Ex. Léa",
                            "Ex. Jace",
                            "Ex. Nissa",
                            "Ex. Alex",
                          ][i]
                        }
                        value={names[i]}
                        onChange={(e) =>
                          setNames(
                            names.map((n, j) => (j === i ? e.target.value : n)),
                          )
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="clear-name"
                      aria-label={`Effacer le nom du joueur ${i + 1}`}
                      disabled={!names[i]}
                      onClick={() =>
                        setNames((values) =>
                          values.map((n, j) => (j === i ? "" : n)),
                        )
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="form-section life-section">
                <div className="section-line">
                  <h2>Points de vie de départ</h2>
                </div>
                <div className="life-options">
                  {[20, 40].map((n) => (
                    <button
                      type="button"
                      aria-pressed={!custom && life === n}
                      className={`life-option ${!custom && life === n ? "selected" : ""}`}
                      key={n}
                      onClick={() => {
                        setLife(n);
                        setCustom(false);
                      }}
                    >
                      <strong>{n}</strong>
                      <span>{n === 20 ? "Classique" : "Commander"}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-pressed={custom}
                    className={`life-option ${custom ? "selected" : ""}`}
                    onClick={() => setCustom(true)}
                  >
                    <span className="custom-symbol">
                      <Minus size={16} />
                      <Plus size={16} />
                    </span>
                    <span>Personnalisé</span>
                  </button>
                </div>
                {custom && (
                  <label className="custom-life">
                    Vies par joueur
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      required
                      placeholder="Ex. 30"
                      value={life}
                      onChange={(e) => setLife(Number(e.target.value))}
                    />
                  </label>
                )}
              </div>
              <button className="primary start-button" type="submit">
                <Play size={18} fill="currentColor" /> Démarrer la partie
              </button>
            </form>
          </section>
        </>
      )}
    </main>
  );
}

function ColorPicker({
  index,
  value,
  onChange,
}: {
  index: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <details className="color-menu">
      <summary aria-label={`Changer la couleur du joueur ${index + 1}`}>
        <span className={`player-orb ${colors[value]}`} />
      </summary>
      <div
        className="color-picker"
        role="group"
        aria-label={`Couleur du joueur ${index + 1}`}
      >
        {colors.map((color, j) => (
          <button
            type="button"
            key={color}
            className={`color-dot ${color}`}
            aria-label={colorNames[j]}
            aria-pressed={value === j}
            onClick={(event) => {
              onChange(j);
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            {value === j && <Check size={13} />}
          </button>
        ))}
      </div>
    </details>
  );
}
