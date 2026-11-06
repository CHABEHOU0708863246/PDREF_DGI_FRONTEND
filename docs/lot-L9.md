# Lot L9 - Courriers

## Livrables

1. Liste `/dashboard/courriers` : filtres type, sens, dates, expediteur, lien, recherche et pagination serveur.
2. Formulaire creation/modification : dates conditionnelles non futures, imputation GUDEF verrouillee, expediteur assiste par la liste L5.
3. Fiche detail : en-tete, objet, references, contribuable, demande grisee, donnees C3 et pieces jointes.
4. Pieces jointes via le proxy courrier L6, sans permission Files_* globale.
5. Selecteur `courrier-select` generique : debounce 300 ms, CVA, ARIA combobox, aucun numero dans l URL.
6. Menu filtre par `Courriers_Read` et actions filtrees par permissions.
7. Quatre etats, responsive 360/768/1280, axe 0.

## Regles

- Les champs C3 ne sont pas rendus sans `Courriers_ReadInternal` ; le serveur les masque aussi.
- Aucune PII complete dans la liste ou le lookup.
- Le jeu `?lighthouse=1` reste strictement non-production.
- Le build Lighthouse utilise la configuration dediee `lighthouse`, optimisee mais avec `production: false`.
- Aucun numero complet dans l URL ; la navigation utilise l identifiant.

## Preuves

- Tests front : **240/240**. Couverture : **80,17 % lignes / 76,39 % branches / 70,06 % fonctions / 79,04 % instructions**.
- E2E : **41/41**, axe 0 aux 3 largeurs.
- Lighthouse courriers : performance **0,93** / accessibilite **1,00**.
- Lighthouse L7/L8 conserve : notifications **0,90-0,92**, contribuables **0,92**, accessibilite **1,00**.
