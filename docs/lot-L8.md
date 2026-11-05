# Lot L8 - Contribuables

## Livrables

1. Liste `/dashboard/contribuables` avec filtres, pagination serveur, tri et qualite.
2. Formulaire creation/modification avec alertes email absent et centre obligatoire.
3. Fiche detail avec contacts masques et revelation tracee.
4. Selection `contribuable-select` branchee sur l API : CVA, debounce 300 ms, annulation de requete, combobox ARIA.
5. Export CSV et Excel avec PII masquee.
6. Menu filtre par `Contribuables_Read`.
7. Quatre etats, responsive 360/768/1280, axe 0.

## Regles

- Aucune PII en URL, log, audit ou export.
- Aucun NCC complet dans le lookup.
- Le jeu de demonstration `?lighthouse=1` est strictement local : `isLighthouseEnabled()` retourne faux en production.
- La fiche par defaut est masquee ; la revelation exige `Contribuables_ReadPii`.

## Preuves

- Tests front : **213/213**. Couverture : **78,14 % lignes / 76,60 % branches / 70,19 % fonctions / 77,02 % instructions**.
- E2E : **35/35**, axe 0 aux 3 largeurs.
- Lighthouse : liste contribuables performance **0,96** / accessibilite **1,00**.
