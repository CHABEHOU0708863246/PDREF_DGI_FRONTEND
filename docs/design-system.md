# Design system PDREF

Source de verite : `src/styles` (jetons, typographie, utilitaires) et
`src/app/core/components` (composants). La demo publique est
`/design-system-demo` ; elle ne contient que des donnees fictives.

## Principes

- Sobre, dense et lisible : priorite a l'information, pas a la decoration.
- Une seule source de verite : aucun hex, aucune taille en `px` en dur dans les
  composants. Les gates `check:tokens` et `check:architecture` le verifient.
- Couleur + icone + libelle : un statut ne depend jamais de la couleur seule.
- Quatre etats explicites : vide, chargement, erreur, succes.
- Accessibilite WCAG AA : focus visible, labels, contrastes, navigation clavier,
  cibles tactiles et `prefers-reduced-motion`.
- 3D decorative uniquement (CSS/perspective), jamais WebGL. Fallback statique si
  `prefers-reduced-motion: reduce`.
- Responsive : 360, 768 et 1280 px, sans scroll horizontal.

## Jetons

`src/styles/_tokens.scss` definit :

- couleurs : primaire, secondaire, surfaces, texte, bordures, succes, alerte,
  erreur, info, overlays ;
- typographie : familles Inter (corps) et Sora (titres), echelles 12 a 56 ;
- espacements 4 a 64, rayons, elevations, largeurs de dialogues et de preview ;
- mouvement : durees et courbes, neutralises sous `prefers-reduced-motion`.

Les themes sont portes par `[data-theme="light"]` / `[data-theme="dark"]`.
`theme-init.js` applique la preference avant le premier rendu pour eviter le
flash ; `ThemeService` gere `light`, `dark` et `system`.

## Composants

| Composant                   | Role                                                   |
| --------------------------- | ------------------------------------------------------ |
| `status-badge`              | Statut avec libelle, icone et ton                      |
| `data-table`                | Tableau serveur : tri, pagination, etats, problem+json |
| `kpi-card`                  | Indicateur avec tendance et etats                      |
| `state-panel`               | Etat vide/chargement/succes/erreur                     |
| `empty-illustration`        | Illustration 3D legere, decorative                     |
| `form-guide`                | Progression et erreurs de formulaire                   |
| `phone-input`               | Telephone ivoirien avec validation                     |
| `upload-field`              | Fichiers, limites, progression, label accessible       |
| `upload-progress`           | Progression globale d'envoi                            |
| `amount-fcfa`               | Montant FCFA formate                                   |
| `confirm-dialog`            | Confirmation native `<dialog>` accessible              |
| `confirm-dialog-with-input` | Confirmation avec motif obligatoire                    |
| `notification-center`       | Cloche, compteur, panneau, etat vide                   |
| `toast-host`                | Notifications ephemeres                                |
| `breadcrumb`                | Fil d'Ariane                                           |
| `page-header`               | En-tete de page et actions                             |
| `theme-toggle`              | Bascule clair/sombre                                   |
| `skip-link`                 | Lien d'evitement vers `#main-content`                  |
| `skeleton`                  | Chargement non bloquant                                |
| `error-footer`              | Code, trace et reference d'erreur                      |
| `contribuable-select`       | Lookup de demonstration (contrat L3)                   |
| `icon`                      | Jeu d'icones local, `aria-hidden` par defaut           |

Chaque composant est `standalone`, `OnPush`, sans dependance metier. Les entrees
sont des `input()`/`model()` ; les sorties sont des `output()`.

## Etats et retours

- Chargement : `skeleton` ou etat `loading`, jamais un spinner plein ecran.
- Vide : message, illustration et action de sortie.
- Erreur : `problem+json` rendu par `error-footer` (code, trace, reference) ;
  action de reprise.
- Succes : confirmation discrete, pas de blocage.
- Dialogues : focus piege, `Escape`, restitution du focus, titre accessible.

## Accessibilite

- Structure : un `main` par page avec `id="main-content"`, titres hierarchises,
  landmarks, lien d'evitement.
- Formulaires : label explicite, `aria-describedby` pour l'aide et les erreurs,
  messages annonces.
- Tableaux : `<caption>`, en-tetes de colonnes, etats annonces.
- Contrastes verifies par `src/app/testing/contrast.spec.ts` et axe.
- Mouvement : `prefers-reduced-motion` neutralise animations et transitions.
- Demo : axe sans violation a 360, 768 et 1280 px.

## Ajouter un composant

1. Creer `src/app/core/components/<nom>/<nom>.component.ts` (`standalone`, `OnPush`).
2. Utiliser exclusivement les jetons (`var(--...)`) ; pas de couleur/px en dur.
3. Couvrir les quatre etats si le composant affiche des donnees.
4. Ajouter un test de rendu et, si pertinent, un test de comportement.
5. Ajouter le composant a la section correspondante de la demo.
6. Verifier `npm run verify`, `npm run e2e` et `npm run lighthouse`.

## Demo

`/design-system-demo` est publique, lazy, `noindex,nofollow`, sans appel metier.
Les sections lourdes utilisent `@defer (on viewport)` : le premier rendu reste
leger et le contenu se charge au defilement. Les tests e2e chargent les sections
avant axe.
