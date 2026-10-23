# Contrat API front-end / back-end L3

## Transport

- Base : `environment.apiUrl` + `/api/v1`.
- JSON UTF-8 ; erreurs `application/problem+json`.
- Cookies d'authentification : `HttpOnly; Secure; SameSite=Strict;
Path=/api/v1/auth`, emis par le backend.
- CORS : origine exacte, `AllowCredentials`, sans wildcard.
- Front et API doivent etre **same-site** ; sinon le refresh cookie n'est jamais
  envoye.

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

Les gateways front lisent `data`. Aucun `refreshToken` n'est present dans une
reponse.

## Authentification

| Endpoint                     | Requete                            | Reponse                                       |
| ---------------------------- | ---------------------------------- | --------------------------------------------- |
| `POST /auth/login`           | `{ login, password }`              | `{ accessToken, expiresAt }` + cookie         |
| `POST /auth/refresh`         | cookie                             | `{ accessToken, expiresAt }` + cookie tourne  |
| `POST /auth/logout`          | cookie                             | `204` + cookie expire                         |
| `POST /auth/forgot-password` | `{ login }`                        | `202`, meme corps que le compte existe ou non |
| `POST /auth/reset-password`  | `{ token, newPassword }`           | `200`                                         |
| `GET /me`                    | Bearer                             | `MeResponse`                                  |
| `POST /me/change-password`   | `{ currentPassword, newPassword }` | `200`                                         |

`MeResponse` :

```json
{
  "id": "u-1",
  "login": "agent",
  "displayName": "Agent DGI",
  "email": "agent@dgi.ci",
  "directionId": "GUDEF",
  "directionCode": "GUDEF",
  "mustChangePassword": false,
  "roles": ["AGENT_GUDEF"],
  "permissions": ["CAN_READ_OWN_PROFILE", "CAN_CHANGE_PASSWORD"]
}
```

Le front enchaîne **refresh -> /me -> permissions -> ready** au démarrage des
routes protégées. Aucun endpoint métier n'est appelé avant `permissions.ready()`.

## Erreur problem+json

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

Codes connus : `UNAUTHENTICATED`, `SESSION_EXPIRED`, `PERMISSION_DENIED`,
`VALIDATION_FAILED`, `NOT_FOUND`, `DUPLICATE`, `CONFLICT`,
`CONCURRENCY_CONFLICT`, `PRECONDITION_FAILED`, `BUSINESS_RULE`,
`FILE_TOO_LARGE`, `FILE_TYPE_NOT_ALLOWED`, `RATE_LIMITED`,
`INTEGRATION_NOT_CONFIGURED`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`,
`NETWORK_ERROR`, `METHOD_NOT_ALLOWED`.

## Intercepteurs

Ordre : `correlation -> error -> auth`.

- `correlation` : `X-Correlation-Id`.
- `error` : normalise et affiche `problem+json` ; les routes `/auth/*` laissent
  le formulaire gérer son erreur.
- `auth` : Bearer, un seul refresh partagé sur 401, rejeu une fois, puis
  expiration et redirection login.

## Audit L4

- GET /api/v1/audit/events : policy Audit_Read, filtres eventCode, userId,
  equestId, correlationId, rom, o, curseur.
- GET /api/v1/audit/events/export?format=csv|json : policy Audit_Export.
- Aucun endpoint PUT/PATCH/DELETE ; le journal est append-only.
- Le front affiche uniquement lecture, filtres, curseur et export conditionne par Audit_Export.

## L2 historique

Le lot L2 fonctionnait en `authMode='demo'` sans appel réseau. Ce mode reste
disponible pour les tests, mais la configuration L3 est `'http'`.
