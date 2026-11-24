# Tests fonctionnels — fiche produit, avis, compte (recette, extension 0.2.0, 24/11/2026)

Exécution réelle, sans cookie, en-tête d'accès recette, compte client de test.

| Scénario | Résultat |
|---|---|
| 26 produits de la boutique : fiche enrichie du thème disponible | ✅ 26/26 (0 sans fiche) |
| Fiche « Bâtonnets d'amandes » : accroche, 5 bienfaits, 3 recettes, détail, 8 lignes nutritionnelles + source, conservation | ✅ |
| Déclinaisons (poids / prix TTC / stock) identiques à la Store API | ✅ 26/26 |
| Produit inexistant | ✅ 404 |
| Avis produit / derniers avis | ✅ 200 — **0 avis sur la recette** : affichage à vérifier dès qu'un avis existe |
| `/me` sans jeton | ✅ 401 |
| Connexion, profil | ✅ 200 |
| Adresses (lecture) / adresse invalide (injection) | ✅ 200 / 400 `mm_invalid_address` |
| Historique de commandes | ✅ 200 — **le compte Test n'a aucune commande** |
| Commandes d'autres numéros | ✅ 404 (jamais de 403 qui confirmerait l'existence) |
| Mot de passe oublié, compte inexistant | ✅ 200, réponse neutre |
| Inscription invalide | ✅ 400 |

**Anomalie de données (recette)** : « Bâtonnets d'amandes » et « Amandes effilées » sont des produits variables
sans aucune déclinaison publiée → non achetables. L'app affiche désormais « Indisponible ». À vérifier en production.

**Tests de composants (Jest + RNTL)** : carte produit (prix du poids choisi, format épuisé désactivé, ajout de la
bonne déclinaison et quantité, message d'erreur serveur, produit sans format) — 58/58 tests app.
