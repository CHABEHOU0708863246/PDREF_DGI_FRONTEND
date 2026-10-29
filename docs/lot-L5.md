# Lot L5 - Referentiels et administration

## Livrables

1. Cinq ecrans `/dashboard/admin/...` : directions, exercices, listes de valeurs,
   parametres, modeles de notification.
2. Filtres, tableau, pagination et formulaires de creation/modification.
3. Desactivation/activation sans suppression physique.
4. Badges `Provisoire` et `Legacy` ; valeurs legacy non selectionnables.
5. Parametres : valeur courante, historique et nouvelle version datee.
6. Menu filtre par permissions Admin/DSI (`Directions_Read`, etc.).
7. Route protegee par `accessGuard`, etats loading/empty/error/success.
8. Responsive 360/768/1280 et axe 0.

## Notes

- Aucune regle metier cachee dans le front : l'API decide.
- Le front n'envoie aucune suppression : uniquement activation/desactivation.
- Les valeurs affichees comme provisoires viennent du seed A/B, en attente de
  REF-7/Q-06 (voir la matrice backend).

## Preuves

- Tests : **183/183**, couverture **77,42 % lignes / 78,41 % branches / 70,61 % fonctions**.
- E2E : **22/22**, dont 4 tests admin, axe 0 et overflow 360/768/1280.
- Build production sans warning ; budgets conformes ; Lighthouse desktop 0,99 / 1,00.
