# Securite front-end L3

## Session et jetons

- Refresh token : cookie `HttpOnly; Secure; SameSite=Strict;
Path=/api/v1/auth` emis par le backend L3.
- Access token : uniquement en memoire (`TokenStore`), marge d'expiration 5 s.
  Aucun `localStorage`/`sessionStorage` pour un jeton.
- Bootstrap : `refresh -> GET /me -> permissions -> ready`. Aucun appel metier
  avant la fin de cette chaine.
- Sur `401`, l'intercepteur tente **un seul refresh** partage entre appels
  concurrents, rejoue une fois, puis vide la session et redirige vers login.
- Logout : appel serveur, nettoyage local dans `finalize`, cookie expire.

## Contrainte SameSite

Le front et l'API doivent etre sur le meme site (sous-domaines ou reverse proxy).
Le backend refuse de demarrer en Production si `Auth:PublicOrigin` n'est pas
same-site avec les origines CORS. Cette contrainte est documentee dans le README.

## Donnees personnelles

- Aucune PII dans les URL, journaux, cache ou stockage navigateur.
- `returnUrl` nettoye : chemin interne uniquement, query strings supprimees.
- Le token de reset est un secret a usage unique, transmis dans le lien email ;
  il n'est jamais journalise.
- Les logs ne contiennent ni jeton, ni mot de passe, ni corps de requete.

## CSP et en-tetes

`src/server.ts` applique :

- `default-src 'self'`, `script-src 'self'`,
  `style-src 'self' 'unsafe-inline'`, `font-src 'self'`, `img-src 'self' data:`,
  `connect-src 'self'` + `API_ORIGIN`, `frame-ancestors 'none'`,
  `base-uri 'self'`, `form-action 'self'`.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
  `Permissions-Policy`, `X-Frame-Options: DENY`,
  `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, HSTS.

Le build desactive `inlineCritical` pour supprimer le handler `onload` inline
incompatible avec la CSP. En developpement, `API_ORIGIN` autorise
`http://localhost:5080` ; en production, il doit valoir l'origine API exacte.

## Permissions

- Le backend resout les permissions a chaque requete ; le JWT ne les porte pas.
- Le front utilise `/me` pour l'affichage et les guards ; un `403` serveur reste
  l'autorite finale.
- `mustChangePasswordGuard` force le changement initial avant tout ecran metier.
- `authGuard`, `accessGuard` et `mustChangePasswordGuard` couvrent les routes
  protegees.

## Mots de passe

- Minimum 12 caracteres, controle des mots de passe compromis cote backend.
- Argon2id par defaut, PBKDF2-SHA512 en repli.
- Show/hide accessible, caps lock signale, messages sans detail technique.
- Reset a usage unique, expiration 30 min, revocation des sessions.

## Limites L3

- MFA : structure backend prete, aucune UI ni obligation avant L20.
- Le front ne peut pas garantir seul les attributs du cookie, le CORS, le
  rate limiting ou l'audit : ces controles sont cote backend L3.
