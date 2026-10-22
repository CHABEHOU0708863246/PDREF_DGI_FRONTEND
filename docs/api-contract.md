# Contrat API front-end / back-end

Le front L2 ne consomme aucun endpoint metier. Les contrats ci-dessous preparent
le lot L3 et doivent rester alignes avec le backend L1.

## Base et transport

- Base : `environment.apiUrl` + `/api/v1`.
- JSON UTF-8, `Content-Type: application/json`.
- Erreurs : `Content-Type: application/problem+json`.
- Cookies d'authentification : `HttpOnly`, `Secure`, `SameSite` adapte au domaine,
  jamais lisibles par JavaScript.
- CORS : origine du front explicitement autorisee, `credentials: true`.

## Enveloppe de succes

```json
{
  "success": true,
  "message": "Operation reussie",
  "data": {},
  "errors": [],
  "metadata": null
}
```

`PagedResponse<T>` :

```json
{
  "items": [],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 0,
  "totalPages": 0
}
```

## Erreur `problem+json` (RFC 9457)

```json
{
  "type": "urn:pdref:error:VALIDATION_FAILED",
  "title": "Donnees invalides",
  "status": 422,
  "detail": "Le champ reference est obligatoire.",
  "instance": "/api/v1/demandes",
  "code": "VALIDATION_FAILED",
  "traceId": "9f2c4d1a",
  "reference": "ERR-2026-000123",
  "errors": [{ "field": "reference", "message": "La reference est obligatoire." }]
}
```

Le front lit `code`, `traceId`, `reference` et `errors[]`. Il ne suppose jamais
un message serveur en francais : le message utilisateur est local, le detail
technique reste dans `error-footer`.

Codes connus : `UNAUTHENTICATED`, `SESSION_EXPIRED`, `PERMISSION_DENIED`,
`VALIDATION_FAILED`, `NOT_FOUND`, `DUPLICATE`, `CONFLICT`,
`CONCURRENCY_CONFLICT`, `PRECONDITION_FAILED`, `BUSINESS_RULE`,
`FILE_TOO_LARGE`, `FILE_TYPE_NOT_ALLOWED`, `RATE_LIMITED`,
`INTEGRATION_NOT_CONFIGURED`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`,
`NETWORK_ERROR`, `METHOD_NOT_ALLOWED`.

## Authentification (contrat L3)

| Endpoint             | Requete               | Reponse                        |
| -------------------- | --------------------- | ------------------------------ |
| `POST /auth/login`   | `{ login, password }` | `AuthSession` + cookie refresh |
| `POST /auth/refresh` | vide, cookie          | `AuthSession`                  |
| `POST /auth/logout`  | vide, cookie          | `204` + cookie expire          |

`AuthSession` :

```json
{
  "accessToken": "jwt",
  "expiresAt": "2026-10-22T12:00:00Z",
  "user": {
    "id": "u-1",
    "displayName": "Agent DGI",
    "roles": ["AGENT"],
    "permissions": ["Demandes_Read"],
    "mustChangePassword": false
  }
}
```

Regles :

- Le refresh token n'apparait jamais dans le JSON, le stockage navigateur, les
  URL ou les journaux.
- L'access token vit uniquement en memoire (`TokenStore`).
- Tous les appels d'authentification utilisent `withCredentials: true`.
- Sur `401`, l'intercepteur `auth` tente un seul refresh, partage entre appels
  concurrents, puis rejoue la requete. En cas d'echec : session videe et
  redirection `/auth/login`.
- Les routes publiques (`/auth/login`, `/portail-public`) ne recoivent pas de
  Bearer et ne declenchent pas de refresh en boucle.

## Intercepteurs

Ordre impose : `correlation -> error -> auth`.

- `correlation` : ajoute `X-Correlation-Id` et conserve le dernier identifiant.
- `error` : normalise les erreurs reseau/HTTP en `ApiProblemDetails`.
- `auth` : Bearer, refresh unique, rejeu, expiration.

## L2 : mode demo

`environment.authMode = 'demo'` en L2. `AppBootstrapService` ne fait aucun appel
reseau et marque les permissions pretes. Le passage en L3 consiste a :

1. passer `authMode` a `'http'` ;
2. brancher les endpoints reels et le CORS/cookie ;
3. ajouter l'origine API a `connect-src` dans la CSP ;
4. remplacer les gateways de demonstration par les implementations HTTP.
