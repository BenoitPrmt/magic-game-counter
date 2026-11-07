'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { GameBoard } from './game-board';
import { readStored, saveStored } from '@/lib/storage';
import { createGame, reduceGame, rematch, type Game } from '@/lib/game';
import { Flame, Moon, Sun, ArrowRight, Minus, Plus, Users, Check } from 'lucide-react';
export const colors = ['blue', 'red', 'green', 'ivory', 'black'] as const;
export const colorNames = ['Bleu', 'Rouge', 'Vert', 'Ivoire', 'Charbon'];
const subscribe = () => () => {};
export function CounterApp() {
  const ready=useSyncExternalStore(subscribe,()=>true,()=>false);
  return ready ? <ReadyApp/> : <main className="app loading" aria-label="Chargement de votre table"><Flame size={32}/></main>;
}
function ReadyApp() {
  const [stored] = useState(readStored);
  const [storageError,setStorageError]=useState(stored.error);
  const [count, setCount] = useState(stored.data.setup.count);
  const [names, setNames] = useState(stored.data.setup.names);
  const [life, setLife] = useState(stored.data.setup.life);
  const [custom, setCustom] = useState(stored.data.setup.custom);
  const [dark, setDark] = useState(stored.data.dark);
  const [playerColors, setPlayerColors] = useState(stored.data.setup.colors);
  const [game, setGame] = useState<Game | null>(stored.data.game);
  useEffect(()=>{
    const ok=saveStored({version:1,setup:{count,names,colors:playerColors,life:Number.isInteger(life)&&life>=1&&life<=9999?life:20,custom},game,dark});
    if(!ok) queueMicrotask(()=>setStorageError(true));
    document.documentElement.style.colorScheme=dark?'dark':'light';
  },[count,names,playerColors,life,custom,game,dark]);
  const notice=storageError ? <div className="storage-notice" role="alert">La sauvegarde locale est indisponible ou a été réinitialisée. Gardez cet écran ouvert.<button aria-label="Masquer l’avertissement" onClick={()=>setStorageError(false)}>×</button></div> : null;
  const appClass = dark ? 'app dark' : 'app';
  if (game) return <main className={`${appClass} playing`}>{notice}<GameBoard game={game} dispatch={a=>setGame(g=>g ? reduceGame(g,a) : g)} onNew={()=>setGame(null)} onRematch={()=>setGame(rematch(game))}/></main>;
  return <main className={dark ? 'app dark' : 'app'}>
    {notice}<header className="site-header"><Link className="brand" href="/" aria-label="Compagnon, accueil"><span className="brand-icon"><Flame size={22} /></span>compagnon<span className="brand-dot">.</span></Link><button className="icon-button" aria-label={dark ? 'Activer le thème clair' : 'Activer le thème sombre'} onClick={() => setDark(!dark)}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button></header>
    <section className="setup-shell"><div className="intro"><h1>La partie commence ici.</h1><p>Posez le téléphone. Sortez les cartes.<br />On s’occupe des points de vie.</p></div>
      <form className="setup-card" onSubmit={e => { e.preventDefault(); if(life>=1 && life<=9999 && Number.isInteger(life))setGame(createGame({count,names,colors:playerColors,life,custom})); }}>
        <div className="form-section"><div className="section-line"><h2>Autour de la table</h2><span className="muted"><Users size={15} /> {count} joueurs</span></div><div className="segmented player-count">{[2,3,4,5,6].map(n => <button type="button" aria-pressed={count === n} className={count === n ? 'selected' : ''} key={n} onClick={() => setCount(n)}>{n}</button>)}</div></div>
        <div className="player-fields">{Array.from({length: count}, (_, i) => <div className="player-field" key={i}><span className={`player-orb ${colors[playerColors[i]]}`}>{i+1}</span><div className="name-input"><label htmlFor={`name-${i}`}>Joueur {i+1}</label><input id={`name-${i}`} maxLength={24} placeholder={['Ex. Benoît', 'Ex. Chandra', 'Ex. Léa', 'Ex. Jace', 'Ex. Nissa', 'Ex. Alex'][i]} value={names[i]} onChange={e => setNames(names.map((n,j) => j === i ? e.target.value : n))}/></div><div className="color-picker" role="group" aria-label={`Couleur du joueur ${i+1}`}>{colors.map((c,j) => <button type="button" key={c} className={`color-dot ${c}`} aria-label={colorNames[j]} aria-pressed={playerColors[i] === j} onClick={() => setPlayerColors(playerColors.map((v,k) => k === i ? j : v))}>{playerColors[i] === j && <Check size={12}/>}</button>)}</div></div>)}</div>
        <div className="form-section life-section"><div className="section-line"><h2>Points de vie de départ</h2><span className="tiny">À chacun son format</span></div><div className="life-options">{[20,40].map(n => <button type="button" className={`life-option ${!custom && life === n ? 'selected' : ''}`} key={n} onClick={() => {setLife(n);setCustom(false);}}><strong>{n}</strong><span>{n === 20 ? 'Classique' : 'Commander'}</span></button>)}<button type="button" className={`life-option ${custom ? 'selected' : ''}`} onClick={() => setCustom(true)}><span className="custom-symbol"><Minus size={16}/><Plus size={16}/></span><span>Personnalisé</span></button></div>{custom && <label className="custom-life">Vies par joueur<input type="number" min={1} max={9999} required placeholder="Ex. 30" value={life} onChange={e => setLife(Number(e.target.value))}/></label>}</div>
        <button className="primary start-button" type="submit">Commencer la partie <ArrowRight size={19}/></button><p className="form-note">Un seul écran. Toute la table.</p>
      </form>
      <p className="setup-footer"><span className="status-dot"/>Sans compte · Sauvegarde sur cet appareil</p>
    </section><footer className="site-footer"><span>Un outil de Benoît Parmentier</span><span>Pour le plaisir de jouer.</span></footer>
  </main>;
}
