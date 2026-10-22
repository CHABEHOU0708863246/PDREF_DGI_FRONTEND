# Lot L2 — Fondations front-end

## Objectif

Poser un socle Angular 21 fiable, accessible et securise, sans empieter sur le
lot L3 (ecrans et regles metier). Le lot est livre avec ses preuves de qualite.

## Livrables

1. **Socle Angular 21** : standalone, SSR + hydratation, zoneless, routing lazy,
   environment demo/http, PWA.
2. **Architecture** : `features -> core` uniquement, aucune feature croisee ;
   gate `check:architecture`.
3. **Design system** : jetons (couleurs, typo, espacements, rayons, elevations,
   mouvement), themes clair/sombre/systeme, polices Inter/Sora auto-hebergees.
4. **Composants transverses** : table, KPI, statuts, etats, formulaires, upload,
   dialogues, notifications, breadcrumb, theme toggle, skip link.
5. **Contrat d'authentification L3** : cookie HttpOnly, access token en memoire,
   login/refresh/logout `withCredentials`, mode demo sans appel reseau.
6. **Intercepteurs** : correlation, normalisation d'erreurs, auth avec refresh
   unique et rejeu ; guards auth/permissions/changements non sauvegardes.
7. **Erreurs** : `application/problem+json` (code, trace, reference, erreurs de
   champ) et rendu utilisateur via `error-footer`.
8. **Securite** : CSP stricte, `nosniff`, `no-referrer`, `frame-ancestors 'none'`,
   absence de PII dans URL/logs/stockage, compression HTTP.
9. **Accessibilite** : WCAG AA, focus visible, labels, dialogues natifs, lien
   d'evitement, `prefers-reduced-motion`, contrastes testes.
10. **Performance** : budgets gzip, sections lourdes en `@defer (on viewport)`,
    build sans warning, SSR compresse.
11. **Tests** : 146 tests unitaires/composants, couverture globale 82,19 % lignes,
    81,67 % branches, 73,08 % fonctions, 81,38 % instructions.
12. **E2E** : 7 tests Playwright, axe sans violation a 360/768/1280 px, themes,
    dialogue accessible, problem+json, reduced motion.
13. **Documentation et CI** : README, contrats, securite, design system, workflow
    GitHub Actions front-end.

## Preuves

| Gate                           | Resultat                                                    |
| ------------------------------ | ----------------------------------------------------------- |
| `npm run lint`                 | OK                                                          |
| `npm run format:check`         | OK                                                          |
| `npm run typecheck`            | OK                                                          |
| `npm test`                     | 146/146                                                     |
| `npm run check:coverage`       | 82,19 % lignes (seuil 70 %)                                 |
| `npm run check:build-warnings` | Build production sans warning                               |
| `npm run check:budgets`        | Initial 111,30 KiB gzip ; plus gros chunk feature 10,24 KiB |
| `npm run check:tokens`         | Aucun hex/px en dur                                         |
| `npm run check:architecture`   | Frontieres respectees                                       |
| `npm run e2e`                  | 7/7, 0 violation axe                                        |
| `npm run lighthouse`           | Desktop : performance 0,99 ; accessibilite 1,00             |
| `npm audit --omit=dev`         | 0 vulnerabilite de production                               |

Lighthouse : FCP 0,6 s, LCP 0,8 s, TBT 20 ms, CLS 0 (profil desktop). Le profil
mobile n'est pas la cible de reference ; le responsive 360 px et l'accessibilite
mobile sont couverts par Playwright/axe.

## Choix techniques

- **Zoneless** : moins de cycles de change detection, TBT reduit.
- **SSR compresse** : middleware `compression` (1.8.2), cache immuable des assets.
- **CSP compatible** : `inlineCritical` desactive pour supprimer le handler
  `onload` inline d'Angular.
- **Defer** : les sections lourdes de la demo se chargent au defilement ; le
  premier rendu reste leger.
- **Mode demo L2** : `AUTH_BOOTSTRAP_MODE = 'demo'` ; aucun appel API reel.

## Limites et suite L3

- Aucun modele, aucune regle, aucun ecran metier.
- Aucun endpoint reel consomme ; le contrat est prepare et teste.
- Le passage en L3 doit : passer `authMode` a `http`, brancher les endpoints,
  ajouter l'origine API a `connect-src`, remplacer les gateways de demo et
  couvrir les parcours metier par des tests.
- Les vulnerabilites de developpement restantes concernent l'outillage
  (Lighthouse/CI) et ne sont pas embarquees dans le bundle de production.
