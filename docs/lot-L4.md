# Lot L4 - Audit : collecte (front)

## Livrables

1. `core/models/audit` : evenement, page curseur, filtres et catalogue des 17 codes.
2. `HttpAuditGateway` : lecture et export uniquement, aucune mutation.
3. Ecran `/dashboard/audit` : filtres (evenement, utilisateur, demande, periode), tableau, curseur, export.
4. Etats vide, chargement et erreur avec `StatePanel`.
5. Export CSV/JSON conditionne par `Audit_Export`.
6. Route protegee par `Audit_Read`, lazy loading.
7. Menu filtre par permission ; Audit ajoute uniquement aux profils autorises.
8. Documentation du contrat audit et de la securite.
9. Tests Vitest du composant.
10. E2E Playwright avec API mockee, axe 0 et overflow 360/768/1280.
11. Aucun bouton modifier/supprimer, aucune methode de mutation.
12. Budget preserve par chunk lazy.
13. Build, lint, format, couverture et preuves.

## Preuves

- Tests : **167/167**, couverture **76,90 % lignes / 78,57 % branches / 70,35 % fonctions**.
- E2E : **18/18**, dont 4 tests audit, axe 0 et overflow 360/768/1280.
- Build production sans warning ; budget initial **43,07 KiB gzip**, plus gros lazy **57,03 KiB**.
- Lighthouse desktop : performance **0,99**, accessibilite **1,00**.
