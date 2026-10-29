# PDREF Frontend - Lot L5

Front-end Angular 21 de la Plateforme de Demande de Rectification des Etats
Financiers (DGI Cote d'Ivoire). Le lot L5 ajoute l'administration des referentiels : directions, exercices, listes de valeurs, parametres et modeles de notification.
connexion, renouvellement de session, mot de passe oublie/reinitialisation,
profil, permissions et garde de changement obligatoire.

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
[docs/design-system.md](docs/design-system.md) et
[docs/lot-L3.md](docs/lot-L3.md).

## Etat de livraison

Resultats de reference L4 (details dans `docs/lot-L4.md`) :

- Tests unitaires/composants : **183 tests**, couverture **77,42 % lignes / 78,41 % branches / 70,61 % fonctions**.
- E2E : **22 tests** Playwright (design system + auth + audit + admin), axe 0.
- Budget initial **43,07 KiB gzip**, plus gros chunk lazy **57,03 KiB**.
- Lighthouse desktop design system : performance 0,99 / accessibilite 1,00.
- Build production sans warning.

## Limites assumees

- Aucun ecran ni appel metier : L4+ branche les parcours metier.
- MFA : structure backend prete, aucune UI ni obligation L3 (L20).
- Le profil Lighthouse desktop est la reference ; le mobile est couvert par
  Playwright/axe a 360 px.
