# Vérification de la V1

Vérifications effectuées le 7 novembre 2026.

## Contrôles automatisés

- `pnpm typecheck` : types stricts.
- `pnpm lint` : règles React, Next.js et TypeScript.
- `pnpm test` : 10 cas couvrant les vies, éliminations, pertes simultanées, annulation, exceptions, abandons, résultats manuels, revanche, rotations, historique borné et stockage invalide/refusé.
- `pnpm build` : export statique complet, police locale et service worker généré avec empreinte de contenu.
- `pnpm test:pwa` (après build) : 4 cas couvrant la présence des ressources précachées, le rechargement hors ligne, les mises à jour explicites, le nettoyage ciblé des anciens caches et l’absence d’interception des requêtes externes/non-GET.

## Vérifications dans le navigateur

- Création avec noms, 20/40 vies et valeur personnalisée.
- Duel : compteur supérieur inversé à 180°, nom et boutons inclus.
- 3 à 6 joueurs à 390 × 844 : compteurs et boutons dans leurs zones, sans débordement.
- 6 joueurs : quatre rotations individuelles à 320 × 568 et 844 × 390, sans boutons ni scores coupés.
- Appui natif Chrome de 1,1 seconde : 20 → 14, arrêt au relâchement ; clic bref suivant : 14 → 15 ; autre joueur inchangé.
- Sauvegarde après modification, rechargement et annulation.
- Vies initiales à 1 : victoire détectée à 0, deuxième perte saisie sans blocage, match nul détecté, reprise et annulation.
- Écran éveillé : statut actif dans le navigateur de test.
- Mise à jour : masquée pendant une partie, proposée après retour à la création, activation et rechargement fonctionnels.
- Hors ligne en production : arrêt du serveur confirmé par échec HTTP, rechargement de la partie depuis le cache, reprise du total sauvegardé et modification des vies.
- Console de production sans erreurs lors du parcours normal.

## Limites de la vérification

Les tailles mobiles ont été vérifiées dans un navigateur de bureau. L’installation sur des appareils iOS/Android réels, leurs zones de sécurité matérielles et leurs politiques d’économie d’énergie restent à vérifier sur ces appareils. Le bouton d’installation utilise l’invite native lorsqu’elle est disponible et affiche sinon les instructions Safari/Android.
