# PDREF Frontend — Lot L2

Fondations du front-end de la Plateforme de Demande de Rectification des Etats
Financiers (DGI Cote d'Ivoire). Ce lot livre le socle technique, le design system,
la securite navigateur et les contrats d'integration. Il ne contient aucune regle
metier, aucun modele metier et aucun ecran metier.

## Perimetre

- Angular 21 autonome, SSR et hydratation, zoneless.
- Design system accessible : jetons, composants, etats, themes clair/sombre/systeme.
- Contrat d'authentification L3 (cookie HttpOnly, access token en memoire uniquement).
- Intercepteurs `correlation -> error -> auth`, guards et gestion `problem+json`.
- Demo publique `/design-system-demo` : donnees fictives, `noindex`, chargee en lazy.
- Qualite verifiee : lint, format, typage, tests, couverture, budgets, tokens,
  architecture, e2e Playwright + axe, Lighthouse.

## Demarrage

Prerequis : Node 24.12.0, npm 11.6.2.

```bash
npm ci
npm start
```

Application : `http://localhost:4200`. Demo : `http://localhost:4200/design-system-demo`.

Build et rendu SSR :

```bash
npm run build
npm run serve:ssr   # http://localhost:4000
```

## Scripts

| Commande                     | Usage                                       |
| ---------------------------- | ------------------------------------------- |
| `npm start`                  | Serveur de developpement (4200)             |
| `npm run build`              | Build production + prerender SSR            |
| `npm run serve:ssr`          | Sert le build sur 4000                      |
| `npm test`                   | Tests unitaires et composants (Vitest)      |
| `npm run test:coverage`      | Tests + couverture                          |
| `npm run e2e`                | Playwright + axe + scenarios design system  |
| `npm run lighthouse`         | LHCI sur le serveur SSR (profil desktop)    |
| `npm run verify`             | Chaine qualite complete hors e2e/Lighthouse |
| `npm run check:budgets`      | Budget gzip initial et features             |
| `npm run check:tokens`       | Interdit les couleurs/tailles en dur        |
| `npm run check:architecture` | Regles de dependances et frontieres         |
| `npm run check:coverage`     | Seuils globaux et par couche                |

Lighthouse necessite un Chrome/Chromium. Avec Playwright :

```bash
npx playwright install chromium
# Windows
$env:CHROME_PATH="$env:LOCALAPPDATA\ms-playwright\chromium-<version>\chrome-win64\chrome.exe"
npm run lighthouse
```

Le profil Lighthouse est **desktop** (application d'administration). Le rendu
mobile 360 px est couvert par les tests Playwright et axe.

## Architecture

```text
src/app
  app.config.ts / app.routes.ts
  core/
    components/      composants du design system
    directives/      focus, piege de focus, etc.
    guards/          auth, permissions, changements non sauvegardes
    interceptors/    correlation, erreurs, auth
    models/          contrats API et modeles transverses
    services/        auth, session, permissions, theme, upload, notifications
    utils/           formats, URL sures, problem+json, correlation
  features/
    auth/ dashboard/ design-system/ errors/ portail/ portail-public/
src/styles/          jetons, typographie, utilitaires
public/              polices auto-hebergees, theme-init, icones
e2e/                 tests Playwright + axe
scripts/             gates qualite
```

## Contrats et securite

- Enveloppe de succes : `{ success, message, data, errors, metadata? }`.
- Erreur : `application/problem+json` avec `code`, `traceId`, `reference`, `errors[]`.
- Session : refresh token en cookie HttpOnly cote backend, jamais dans le stockage
  navigateur ; access token uniquement en memoire (`TokenStore`).
- Aucune PII dans les URL, le cache, les journaux ou le stockage local.
- CSP stricte, `nosniff`, `no-referrer`, `frame-ancestors 'none'`.
- En L2, `environment.authMode = 'demo'` : aucun appel d'authentification reel.
  Le passage a `http` se fait en L3 avec le backend.

Voir [docs/api-contract.md](docs/api-contract.md),
[docs/security-front.md](docs/security-front.md) et
[docs/design-system.md](docs/design-system.md).

## Etat de livraison L2

Resultats de reference (voir [docs/lot-L2.md](docs/lot-L2.md)) :

- 146 tests unitaires/composants, couverture globale > 82 % lignes.
- 7 tests e2e : 0 violation axe a 360/768/1280 px, themes, dialogue, reduced motion.
- Budget initial 111,30 KiB gzip, plus gros chunk feature 10,24 KiB gzip.
- Lighthouse desktop : performance 0,99, accessibilite 1,00.
- Build production sans warning.

## Limites assumees

- Aucun ecran ni appel metier : le lot L3 branche l'API reelle et le mode `http`.
- Les donnees de `/design-system-demo` sont fictives et locales.
- Le profil Lighthouse desktop est le profil de reference ; le mobile est couvert
  par Playwright/axe a 360 px.
