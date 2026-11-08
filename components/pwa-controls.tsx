"use client";
import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Modal } from "./modal";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function PwaControls({ inGame }: { inGame: boolean }) {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [help, setHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [updating, setUpdating] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstall(null);
    };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    queueMicrotask(() => {
      setInstalled(!!standalone);
    });
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    let disposed = false;
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((reg) => {
          if (disposed) return;
          const inspect = () => {
            if (reg.waiting) setWaiting(reg.waiting);
          };
          inspect();
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed") {
                if (navigator.serviceWorker.controller) inspect();
              }
            });
          });
          reg.update().catch(() => {});
        })
        .catch(() => {
          if (!disposed && !navigator.serviceWorker.controller) setFailed(true);
        });
    }
    return () => {
      disposed = true;
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  async function doInstall() {
    if (!install) {
      setHelp(true);
      return;
    }
    await install.prompt();
    const choice = await install.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstall(null);
  }
  function update() {
    if (!waiting) return;
    setUpdating(true);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );
    waiting.postMessage({ type: "SKIP_WAITING" });
  }
  return (
    <>
      {!inGame && failed && (
        <div className="pwa-error" role="alert">
          <span>Le mode hors ligne n’a pas pu être activé.</span>
          <button className="text-button" onClick={() => setFailed(false)}>
            Fermer
          </button>
        </div>
      )}
      {!inGame && !installed && (
        <div className="pwa-controls">
          <button className="text-button" onClick={doInstall}>
            <Download size={16} /> Installer l’app
          </button>
        </div>
      )}
      {!inGame && waiting && (
        <div className="update-notice" role="status">
          <span>Une nouvelle version est prête.</span>
          <button disabled={updating} onClick={update}>
            <RefreshCw size={14} />
            {updating ? "Mise à jour…" : "Mettre à jour"}
          </button>
        </div>
      )}
      {help && (
        <Modal labelledBy="install-title" onClose={() => setHelp(false)}>
          <div className="dialog-header">
            <h2 id="install-title">Installer l’app</h2>
          </div>
          <ol className="install-steps">
            <li>
              <strong>Sur iPhone ou iPad</strong>
              <br />
              Ouvrez le site dans Safari, touchez Partager, puis « Sur l’écran
              d’accueil ».
            </li>
            <li>
              <strong>Sur Android ou ordinateur</strong>
              <br />
              Dans le menu du navigateur, choisissez « Installer l’application »
              ou « Ajouter à l’écran d’accueil ».
            </li>
          </ol>
          <p className="hint">
            Le mode hors ligne nécessite un premier chargement complet.
          </p>
          <button className="primary" onClick={() => setHelp(false)}>
            Compris
          </button>
        </Modal>
      )}
    </>
  );
}
