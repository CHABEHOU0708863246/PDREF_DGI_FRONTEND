# PDREF Frontend - Lot L10

Front-end Angular 21 de la Plateforme de Demande de Rectification des Etats
Financiers (DGI Cote d'Ivoire). Le lot L10 ajoute la consultation en lecture seule des definitions de workflow versionnees.
Le socle L3 conserve la connexion, le renouvellement de session, le mot de passe
oublie/reinitialisation, le profil, les permissions et la garde de changement obligatoire.

## Perimetre

- Angular 21 autonome, SSR/hydratation, zoneless.
- Design system accessible (jetons, themes, etats, responsive 360/768/1280).
- Authentification par cookie HttpOnly, access token en memoire uniquement.
- Bootstrap strict : refresh -> `GET /me` -> permissions -> application prete.
- Intercepteurs `correlation -> error -> auth` et guards auth/permissions.
- Ecrans authentification L3 et journal d'audit L4 en lecture seule.
- Qualite : lint, format, typage, tests, couverture, budgets, tokens,
  architecture, e2e Playwright + axe, Lighthouse.

## Demarrage

Prerequis : Node 24.12.0, npm 11.6.2, backend L3 sur `http://localhost:5080`.

```bash
npm ci
npm start
```

Application : `http://localhost:4200`. Demo design system :
`http://localhost:4200/design-system-demo` (publique, donnees fictives).

Le serveur de developpement recoit `API_ORIGIN=http://localhost:5080` via
`cross-env` pour que la CSP `connect-src` autorise l'API locale.

Build et rendu SSR :

```bash
# API_ORIGIN doit pointer vers l'origine publique de l'API
$env:API_ORIGIN="https://api.pdref.dgi.ci"
npm run build
npm run serve:ssr   # http://localhost:4000
```

**Contrainte SameSite=Strict** : le front et l'API doivent etre sur le meme site
(sous-domaines d'un meme domaine, ou reverse proxy). Exemple :
`https://pdref.dgi.ci` et `https://api.pdref.dgi.ci`. Un front et une API sur des
sites differents ne recevront jamais le cookie de refresh.

## Scripts

| Commande                     | Usage                                    |
| ---------------------------- | ---------------------------------------- |
| `npm start`                  | Dev server SSR + API locale (4200)       |
| `npm run build`              | Build production + prerender SSR         |
| `npm run serve:ssr`          | Sert le build sur 4000                   |
| `npm test`                   | Tests unitaires et composants            |
| `npm run test:coverage`      | Tests + couverture                       |
| `npm run e2e`                | Playwright + axe (design, auth, audit)   |
| `npm run lighthouse`         | LHCI sur `/design-system-demo` (desktop) |
| `npm run verify`             | Chaine qualite hors e2e/Lighthouse       |
| `npm run check:budgets`      | Budget gzip initial et features          |
| `npm run check:tokens`       | Interdit les couleurs/tailles en dur     |
| `npm run check:architecture` | Frontieres features -> core              |
| `npm run check:coverage`     | Seuils globaux et par couche             |

Lighthouse necessite Chrome/Chromium :

```bash
npx playwright install chromium
# Windows
$env:CHROME_PATH="$env:LOCALAPPDATA\ms-playwright\chromium-<version>\chrome-win64\chrome.exe"
npm run lighthouse
```

## Architecture

```text
src/app
  core/
    components/      design system + password-input
    guards/          auth, permissions, must-change-password
    interceptors/    correlation, erreurs, auth
    models/          contrats API/auth
    services/        auth, bootstrap, permissions, theme...
  features/
    auth/            login, forgot-password, reset-password, my-profile
    dashboard/ design-system/ errors/ portail/ portail-public/
e2e/                 design system + authentification (API mockee)
scripts/             gates qualite
```

## Contrat d'authentification

- `POST /api/v1/auth/login` -> `{ accessToken, expiresAt }`.
- `POST /api/v1/auth/refresh` -> meme forme, cookie HttpOnly.
- `POST /api/v1/auth/logout`.
- `GET /api/v1/me` -> identite, roles, permissions, direction,
  `mustChangePassword`.
- `POST /api/v1/auth/forgot-password` (reponse anti-enumeration).
- `POST /api/v1/auth/reset-password`.
- `POST /api/v1/me/change-password`.
- Aucun champ `refreshToken` dans le JSON ; l'access token reste en memoire.

Le backend L3 resout les permissions a chaque requete ; le front ne les utilise
que pour l'affichage et les guards. Un `403` reste l'autorite serveur.

En L3, `environment.authMode = 'http'`. La demo `/design-system-demo` et les
ecrans `/auth/*` sont publics et ne declenchent pas le bootstrap reseau.

## Securite

- Cookie refresh `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`.
- Access token en memoire (`TokenStore`), jamais dans localStorage/sessionStorage.
- Aucune PII dans URL, logs, cache ou stockage navigateur.
- CSP stricte, `nosniff`, `no-referrer`, `frame-ancestors 'none'`.
- `connect-src` aligne sur `API_ORIGIN`.
- Erreurs `problem+json` avec `code`, `traceId`, `reference`.

Voir [docs/api-contract.md](docs/api-contract.md),
[docs/security-front.md](docs/security-front.md),
[docs/design-system.md](docs/design-system.md),
[docs/lot-L3.md](docs/lot-L3.md), [docs/lot-L6.md](docs/lot-L6.md) et
[docs/lot-L7.md](docs/lot-L7.md), [docs/lot-L8.md](docs/lot-L8.md), [docs/lot-L9.md](docs/lot-L9.md) et [docs/lot-L10.md](docs/lot-L10.md).

## Etat de livraison

Resultats de reference L7 (details dans `docs/lot-L7.md`) :

- Tests unitaires/composants : **199 tests**, couverture **75,83 % lignes / 77,06 % branches / 71,91 % fonctions**.
- E2E : **31 tests** Playwright (design system + auth + audit + admin + fichiers + notifications), axe 0.
- Build production sans warning, budgets, tokens et architecture conformes.
- Lighthouse notifications : performance **0,97** / accessibilite **1,00** sur la page et la cloche ouverte.

## Limites assumees

- Aucun ecran ni appel metier : L4+ branche les parcours metier.
- MFA : structure backend prete, aucune UI ni obligation L3 (L20).
- Le profil Lighthouse desktop est la reference ; le mobile est couvert par
  Playwright/axe a 360 px.

## Lot L7 - Notifications

- Cloche accessible avec panneau glissant 3D leger et badge pulse respectant reduced motion.
- Page `/dashboard/my-notifications` paginee, filtree et marquable comme lue.
- Etats vide/chargement/erreur/liste, responsive 360/768/1280, axe 0.
- Aucune PII, aucun montant et aucun contenu d avis.
- Donnees de demonstration limitees au developpement/e2e ; API reelle en production.
- Lighthouse execute sur la page et la cloche ouverte.

## Lot L8 - Contribuables

- Liste filtrable et paginee, qualite, formulaire et fiche masquee.
- Revelation PII tracee avec `Contribuables_ReadPii`.
- Selection contribuable HTTP/ARIA, export CSV/Excel sans PII.
- Responsive 360/768/1280 et axe 0.
- Tests front : **213/213** ; e2e **35/35** ; couverture **78,14 % lignes / 76,60 % branches**.
- Lighthouse contribuables : performance **0,96** / accessibilite **1,00**.

## Lot L9 - Courriers

- Registre filtrable et pagine, formulaire de creation/modification et fiche detail.
- Imputation GUDEF verrouillee, snapshot contribuable fige, champs C3 masques par permission.
- Selecteur courrier ARIA, pieces jointes via proxy L6, aucun elargissement Files_*.
- Tests front : **240/240** ; e2e **41/41** ; couverture **80,17 % lignes / 76,39 % branches**.
- Lighthouse courriers : performance **0,93** / accessibilite **1,00**.

## Lot L10 - Moteur de workflow

- Ecran admin Workflows en lecture seule, liste, etapes, jointures et feature flag.
- Aucun editeur, aucun module metier branche.
- Tests front : **243/243** ; e2e **44/44** ; couverture **80,50 % lignes / 76,33 % branches**.
- Lighthouse workflows : performance **0,96** / accessibilite **1,00**.
