# Lot L7 - Notifications

## Livrables

1. `notification-center` : cloche, panneau glissant 3D leger, badge pulse discret.
2. `aria-expanded`, `aria-controls`, Escape, clic exterieur, focus rendu au bouton.
3. Etats chargement, vide, erreur et liste dans le panneau.
4. Page `/dashboard/my-notifications` : liste, filtres lues/non lues, pagination et marquage lu.
5. Separation stricte entre statut d'envoi et statut de lecture.
6. Responsive 360/768/1280 et axe 0.
7. Aucune PII, aucun montant, aucun contenu d'avis dans l'interface.
8. Donnees de demonstration limitees au developpement/e2e ; aucun appel metier en L7.

## Notes

- Les notifications internes aux agents sont persistees dans la cloche en plus du canal principal.
- Les messages au contribuable suivent EMAIL -> SMS -> IN_APP ; l'in-app n'apparait qu'en repli.
- Le jeu de demonstration est utilise par l'harness Lighthouse local ; il n'est jamais servi en production.
- Lighthouse est execute sur la page et sur la cloche ouverte, avec un script de connexion hors depot.

## Preuves

- Tests front : **199/199**, couverture **75,83 % lignes / 77,06 % branches / 71,91 % fonctions**.
- E2E : **31/31**, axe 0 aux 3 largeurs.
- Lighthouse : performance **0,97** et accessibilite **1,00** sur la page et la cloche ouverte.

## Blocage du jeu de demonstration

`?lighthouse=1` est strictement reserve au developpement et aux tests locaux.
Le helper `isLighthouseEnabled()` retourne toujours `false` lorsque
`environment.production` est vrai : aucun bypass d'authentification et aucune
donnee de demonstration ne sont servis en production, meme sur `localhost`.
Le harness Lighthouse utilise un build de test non-production optimise.

## Revision L11 - destinataire externe

Le front n'expose aucune boite de notification contribuable en L11. Les evenements `DEPOT_ACCUSE` et `CONFORMITE_REJET` sont produits par l'API L11 et portes par l'outbox L7 avec un destinataire externe chiffre ; aucune PII n'est affichee dans les ecrans internes.
