# Lot L6 - Fichiers

## Livrables

1. Route `/dashboard/files` et entree de menu filtree par `Files_Read`.
2. Politique de fichiers lue depuis l'API : taille, formats, quota et nombre maximal.
3. Upload avec progression, validation client et messages d'erreur API.
4. Liste des groupes, version courante, statut et actions disponibles.
5. Telechargement authentifie via `secureDownload` (Bearer + blob).
6. Nouvelle version d'un fichier sans ecrasement de l'historique.
7. Suppression logique uniquement (`SUPPRIMEE`).
8. Etats loading/empty/error/success et responsive 360/768/1280.

## Notes

- Aucune regle de taille ou de format n'est codee en dur dans le front.
- `Content-Disposition: attachment` et nom assaini sont produits par l'API.
- Les permissions `Files_Upload` / `Files_Delete` masquent les actions sans
  supprimer l'ecran de consultation.

## Preuves

- Tests : **190/190**, couverture **77,16 % lignes / 78,34 % branches / 70,87 % fonctions**.
- E2E : **26/26**, dont 4 tests fichiers, axe 0 et overflow 360/768/1280.
- Build production sans warning ; budgets, tokens et architecture conformes.
