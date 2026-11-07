# Compagnon

Compteur de vies Magic en français, conçu pour un appareil au centre de la table.

## Développement

```sh
pnpm install
pnpm dev
```

## Vérification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Application Next.js exportée en site statique dans `out/`. Aucun compte ni backend.

## Fonctionnement

- 2 à 6 joueurs, noms (24 caractères), couleurs et vies initiales personnalisables (1 à 9999).
- À deux : écran partagé, zones opposées. En paysage, les joueurs se placent aux extrémités gauche et droite. Chaque zone peut tourner de 90° depuis le menu.
- Appui bref : ±1. Appui de plus de 420 ms : répétition toutes les 125 ms, arrêt au relâchement, à l’annulation du geste ou à la perte de visibilité.
- Annulation et historique des 300 dernières actions, y compris réglages, abandon et résultat.
- Détection à 0 vie ou moins : bannière non bloquante, pour finir de saisir des pertes simultanées. Dernier joueur actif : victoire ; aucun : match nul. Le résultat peut être repris pour correction.
- Exceptions individuelles et détection désactivable. Abandon, victoire manuelle et match nul restent disponibles.
- Revanche avec les mêmes places et réglages ; confirmation avant de remplacer une partie en cours.
- Thème clair/sombre, préférence et partie enregistrées localement sous `compagnon:v1`. Les données ne sont pas envoyées à un serveur.
- Maintien de l’écran éveillé, si disponible ; nouvelle demande au retour sur l’application. Le navigateur ou l’économie d’énergie peuvent le refuser.

## Production et PWA

```sh
pnpm build
pnpm start
# http://localhost:4173
# Autre port : pnpm start --port 4174
```

`pnpm build` exporte le site et génère `out/sw.js` à partir de tous les fichiers exportés. Le cache porte une empreinte du contenu. L’ancienne version reste cohérente pendant une partie ; la mise à jour attend et ne peut être appliquée que sur l’écran de création. Un nouvel onglet sur la même origine reprend la même sauvegarde : utiliser une seule table active par origine/appareil.

Déployer **le contenu de `out/` à la racine d’un hébergement HTTPS**. Les service workers et l’installation nécessitent HTTPS (ou localhost pour les essais). Servir `sw.js` et les documents HTML avec `Cache-Control: no-cache`, les chunks `/_next/static/` avec un cache immuable. Le serveur de prévisualisation inclus applique ces en-têtes. Ne pas utiliser `next start` avec cet export statique.

Le mode hors ligne est prêt lorsque « Disponible hors ligne » apparaît après le premier chargement complet. Le service worker n’est pas activé en développement (`pnpm dev`). L’installation utilise l’invite native quand elle existe ; les autres navigateurs affichent les instructions, notamment Safari iOS.

L’application suit les vies et les abandons, pas les effets des cartes. Poison et dégâts de commandant ne sont pas inclus dans cette première version. Les règles d’élimination peuvent être contournées manuellement depuis le menu.
