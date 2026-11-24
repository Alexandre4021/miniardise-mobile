# Tests panier — Store API WooCommerce sur la recette (24/11/2026)

**Conditions :** requêtes sans cookie (comme l'app), en-tête d'accès recette, Cart-Token. Exécution réelle.

| Scénario | Résultat |
|---|---|
| Panier vide + obtention du Cart-Token | ✅ 200, jeton reçu |
| Ajout d'une déclinaison (Mélange sportif 200 g × 2) | ✅ 201, 2 articles, poids affiché |
| Passage à 3 unités | ✅ 200, totaux recalculés par WooCommerce |
| Code promo inexistant | ✅ 400, message WooCommerce en français affiché tel quel |
| Adresse 95240 → modes de livraison | ✅ Retrait (0 €), Relais Colissimo (6,90 €), Domicile Colissimo (9,50 €), Relais Chronopost (5,50 €) |
| Suppression de l'article | ✅ 200, panier vide |

Fiche produit enrichie, avis et compte (extension 0.2.0) : à tester après installation de la 0.2.0 sur la recette (0.1.3 installée au moment du test).
