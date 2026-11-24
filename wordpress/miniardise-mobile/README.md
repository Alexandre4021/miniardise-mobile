# Extension WordPress « MiniarDise Mobile »

API de l'application mobile (namespace `miniardise-mobile/v1`). Indépendante du thème, compatible HPOS.

## État (Phase 3 — fondations)

| Route | État |
|---|---|
| `GET /config` | ✅ |
| `POST /auth/login` · `/auth/refresh` · `/auth/logout` | ✅ jetons opaques hachés, rotation, détection de réutilisation, limitation de débit, journal |
| Jeton accepté par la Store API (`wc/store/*`) | ✅ code prêt — **à valider sur la recette (PoC R3)** |
| Inscription, mot de passe oublié, profil, adresses, commandes, suppression de compte | Phase 4b |
| Points relais, paiement, notifications | Phase 4c |

Les comptes ayant des droits d'administration (gestion boutique, édition) n'obtiennent **jamais** de jeton d'app.

## Installation (recette uniquement pour l'instant)

1. Zipper le dossier `miniardise-mobile/` **sans** `vendor/` ni `tests/`.
2. Recette → Extensions → Ajouter → Téléverser → Activer (crée 3 tables `*_mm_*`).
3. Vérifier `GET https://recette.epiceriefineminiardise.fr/wp-json/miniardise-mobile/v1/config`.

## Tests

```bash
composer install
composer test      # PHPUnit (tests unitaires sans WordPress)
composer lint      # php -l sur tous les fichiers
```

Les tests d'intégration avec WordPress (wp-env) arrivent avec la Phase 4b.
