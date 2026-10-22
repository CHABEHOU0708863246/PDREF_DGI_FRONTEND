# Lot L3 - Identite et acces (front)

## Objectif

Brancher le front sur l'authentification reelle du backend L3, avec un bootstrap
strict et des ecrans accessibles, sans aucune regle metier.

## Livrables

1. **Contrat auth** : login, refresh, logout, forgot, reset, me, change-password.
2. **Bootstrap** : refresh cookie -> `/me` -> permissions -> app ready.
3. **Intercepteur auth** : Bearer, refresh unique, rejeu, logout si echec.
4. **Guards** : auth, permissions et changement de mot de passe obligatoire.
5. **Ecrans** : login (show/hide, caps lock), forgot, reset, my-profile.
6. **Design** : 3D sobre, 4 etats, responsive 360/768/1280, axe 0.
7. **Securite** : cookie HttpOnly, access token memoire, aucune PII, CSP alignee.
8. **Tests unitaires** : AuthService, gateways, bootstrap, guards, composants.
9. **E2E** : auth avec API mockee + design system, axe/overflow.
10. **Documentation** : contrat API, securite, README, ce lot.
11. **Configuration** : `authMode='http'`, CSP `API_ORIGIN`, same-site documente.
12. **Qualite** : build sans warning, lint, format, coverage 70/80, budgets.
13. **Preuves** : tests, couverture, e2e, Lighthouse, audit production.

## Preuves de reference

| Gate                           | Resultat                                              |
| ------------------------------ | ----------------------------------------------------- |
| `npm test`                     | 163 tests                                             |
| `npm run check:coverage`       | 77,32 % lignes / 78,75 % branches / 70,69 % fonctions |
| `npm run e2e`                  | 14 tests (7 design system + 7 auth)                   |
| `npm run check:build-warnings` | build production sans warning                         |
| `npm run check:budgets`        | budgets respectes                                     |
| `npm run lighthouse`           | desktop 0,99 / 1,00                                   |
| `npm audit --omit=dev`         | 0 vulnerabilite de production                         |

## Choix

- Zoneless, SSR, hydratation.
- Auth API mockee dans Playwright pour ne pas dependre d'un backend au CI front.
- Profil Lighthouse desktop ; mobile couvert par Playwright/axe a 360 px.
- `cross-env` pour `API_ORIGIN` en dev sans secret.

## Limites

- Aucun ecran metier.
- MFA non exposee (L20).
- Les erreurs 404/409 des futurs endpoints metier seront couvertes avec les
  parcours L4 ; le socle d'interception est deja en place.
