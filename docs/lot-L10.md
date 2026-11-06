# Lot L10 - Moteur de workflow

## Livrables

1. Ecran `/dashboard/admin/workflows` en lecture seule.
2. Liste des definitions, filtre par statut et selection d une version.
3. Detail des etapes, delais, roles, groupes paralleles, jointures et feature flag.
4. Aucun editeur visuel ; toute nouvelle version passe par l API Admin/DSI.
5. Quatre etats, responsive 360/768/1280, axe 0.
6. Menu filtre par `Workflows_Read`.

## Regles

- Aucun droit de mutation dans l UI L10.
- Les roles metier ne lisent pas les definitions Workflows.
- Le jeu Lighthouse est strictement non-production.

## Preuves

- Tests front : **243/243**. Couverture : **80,50 % lignes / 76,33 % branches / 70,03 % fonctions / 79,59 % instructions**.
- E2E : **44/44**, axe 0 aux 3 largeurs.
- Lighthouse workflows : performance **0,96** / accessibilite **1,00**.
