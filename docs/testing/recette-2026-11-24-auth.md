# Tests de sécurité — authentification de l'app sur la recette (24/11/2026)

**Environnement :** recette.epiceriefineminiardise.fr, extension 0.1.2, garde de recette d'origine.
**Conditions :** requêtes **sans aucun cookie** (comme l'app native), en-tête d'accès recette, compte client de test.
**Exécution :** réelle, depuis le navigateur intégré (fetch, `credentials: 'omit'`). Aucun secret reproduit ici.

| # | Scénario | Attendu | Obtenu | Statut |
|---|---|---|---|---|
| 1 | Mauvais code d'accès recette | 403 | 403 | ✅ |
| 2 | Panier invité (Store API) | 200, aucun client | 200, aucun e-mail | ✅ |
| 3 | Connexion, mauvais mot de passe | 401 neutre | 401 `mm_invalid_credentials` | ✅ |
| 4 | Connexion valide | 200 + jetons | 200 | ✅ |
| 5 | Store API avec jeton (PoC R3) | client reconnu | 200, e-mail du compte | ✅ |
| 6 | Jeton inventé | 401 | 401 `mm_invalid_token` | ✅ |
| 7 | Jeton sur une route hors app (`wp/v2/users/me`) | refus | 403 | ✅ |
| 8 | Rafraîchissement | nouveaux jetons | 200, jetons différents | ✅ |
| 9 | Rejeu d'un ancien jeton de rafraîchissement | 401 + famille révoquée | 401 | ✅ |
| 10 | Jeton d'accès de la famille après rejeu | 401 | 401 `mm_invalid_token` | ✅ |
| 11 | Déconnexion puis réutilisation du jeton | 401 | 401 | ✅ |

**Observations**
- Après rotation normale, l'ancien jeton d'accès reste valable jusqu'à son expiration (15 min max). Comportement prévu ; durcissement possible (révocation immédiate) — à décider.
- Anti-robots LWS (Anubis) : en-têtes `x-anubis-*` vides, aucun défi pour un client non navigateur (`curl`) → **PoC R1 validée**.
- Pare-feu ModSecurity : requêtes POST JSON avec `Authorization: Bearer` acceptées → **PoC R2 validée**.
- PoC R4 (paiement WooPayments en session navigateur) : en attente (décision du 24/11).
