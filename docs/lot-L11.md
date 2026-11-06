# Lot L11 - Demandes (front)

## Livrables

1. Liste `/dashboard/demandes` : filtres statut/origine, recherche numero/NCC/raison sociale, pagination, etats chargement/erreur/vide, permissions.
2. Formulaire `/dashboard/demandes/nouvelle` : 5 sections (contribuable/courrier, exercices/perimetre, variables, conformite, recapitulatif + PDF), garde de modifications non enregistrees, validation des exercices N/N-1, Toute la liasse exclusive, ≥1 etat hors liasse, ≥1 motif, precision Autres, plafonds variables.
3. Parcours de depot en trois temps : creation brouillon → upload du PDF via le proxy L6 `ownerType=DEMANDE` → `PUT ... deposer=true` transactionnel.
4. Fiche `/dashboard/demandes/:id` : 5 onglets (Synthese, Exercices, Conformite, Circuit, Pieces jointes), export PDF sans email/telephone, upload et telechargement des pieces jointes.
5. `DemandesGateway` : formulaire, liste, detail, creation, mise a jour avec `If-Match`, export PDF, pieces jointes.
6. Menu filtre par `Demandes_Read`, routes gardees par permissions, `unsavedChangesGuard`.
7. Corrections UI transverses : sidebar scrollable, selects custom stables au clic (pas de fermeture sur blur), focus conserve pendant la selection.

## Etats

- `BROUILLON`, `DEPOSEE`, `EN_CIRCUIT`, `REJETEE`, `CLOTUREE`, `ABANDONNEE` affiches ; seul le parcours brouillon est expose en L11.
- Les erreurs API sont normalisees avec le correlationId.
- Aucune PII email/telephone dans l'export PDF ou les URLs.

## Limites

- Aucun ecran contribuable (L22), aucun ecran Avis/Validation/CTF (L12/L12bis).
- La conformite est en lecture seule cote front ; elle est decidee serveur.
- H-24/H-31 restent bloquants Go-Live ; le front affiche l'erreur serveur explicite.
- Lighthouse doit couvrir liste, fiche et formulaire apres execution dediee.

## Preuves

- Tests : **254/254** ; lint et format verts.
- Couverture : **78,80 % statements / 74,41 % branches / 70,21 % functions / 80,41 % lignes**.
- Lighthouse desktop : liste **98/97**, fiche **98/97**, formulaire **98/97** (performance/accessibilite).
