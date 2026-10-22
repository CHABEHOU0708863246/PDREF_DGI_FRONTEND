# Securite front-end

## Session et jetons

- Refresh token : cookie `HttpOnly` emis par le backend, jamais lu par le front.
- Access token : uniquement en memoire (`TokenStore`), avec marge d'expiration de
  5 secondes. Aucun `localStorage`/`sessionStorage` pour un jeton.
- Sur `401` : un seul refresh concurrent, rejeu de la requete, sinon session videe
  et redirection vers `/auth/login`.
- Déconnexion : appel serveur, puis nettoyage local dans `finalize`.
- Le mode L2 est `demo` : aucun appel d'authentification reel.

## Donnees personnelles

- Pas de PII dans les URL, les parametres de navigation, les journaux ou le cache.
- Le `returnUrl` est nettoye (`sanitizeReturnUrl`) et ne conserve pas les query
  strings sensibles.
- Les modeles utilisateur se limitent a `id`, `displayName`, `roles`,
  `permissions`, `mustChangePassword` (pas d'email ni de telephone).
- Les messages de log ne contiennent ni jeton, ni PII, ni corps de requete.

## En-tetes et CSP

`src/server.ts` applique sur chaque reponse :

- `Content-Security-Policy` : `default-src 'self'`, `script-src 'self'`,
  `style-src 'self' 'unsafe-inline'`, `font-src 'self'`, `img-src 'self' data:`,
  `connect-src 'self'` (+ `API_ORIGIN` si configure), `frame-ancestors 'none'`,
  `base-uri 'self'`, `form-action 'self'`.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy`
- `X-Frame-Options: DENY`

La CSP interdit les scripts inline. Le build desactive `inlineCritical` pour
eviter le handler `onload` genere par Angular. Les styles de composants sont
injectes via l'exception `style-src 'unsafe-inline'`, limitee aux styles.

En L3, ajouter l'origine API exacte a `connect-src` et adapter `form-action` si
un flux de formulaire externe est necessaire.

## Navigation et permissions

- `authGuard` protege les routes privees ; SSR laisse passer puis hydrate.
- `accessGuard` verifie `permissions`, `allPermissions` et `roles` avant
  activation ; echec vers `/unauthorized`.
- `unsavedChangesGuard` protege les formulaires non sauvegardes.
- Les routes publiques sont limitees a `/auth`, `/portail-public`, `/error`,
  `/unauthorized` et `/design-system-demo`.

## Fichiers et uploads

- Types et tailles sont valides avant envoi ; limites passees en proprietes.
- Le nom de fichier n'est jamais injecte dans le DOM sans echappement.
- L'URL d'objet est revoquee apres usage.
- Le backend reste l'autorite finale (type MIME, taille, antivirus).

## Dependances et chaine CI

- `npm audit --omit=dev` doit rester sans vulnerabilite de production.
- Les vulnerabilites de developpement (LHCI, outillage) sont suivies et ne sont
  pas embarquees dans le bundle.
- Gates : lint, format, typecheck, tests, couverture, budgets, tokens,
  architecture, build sans warning, e2e + axe, Lighthouse.
- Aucun secret dans le depot ; les variables d'environnement sont injectees par
  la plateforme.

## Limites L2

Le front ne peut pas garantir seul la securite de l'authentification : le backend
doit emettre les cookies avec les bons attributs, valider l'origine CORS, limiter
les tentatives et journaliser sans PII. Ces points sont des prerequis L3.
