# Garde du site de recette — v1.2.0

Copie de `miniardise-site-test.php` (mu-plugin de la recette, v1.1.0) avec deux ajouts **actifs uniquement sur la recette** :

1. **Accès de l'app de test** : en-tête `X-MO-Recette-Acces`, accepté seulement sur `/wp-json/wc/store/*` et `/wp-json/miniardise-mobile/v1/*`, avec un code dédié à l'app (distinct du code navigateur).
2. **WooPayments en compte de test** : Stripe / WordPress.com débloqués seulement si `MO_TEST_WOOPAYMENTS_SANDBOX` est défini.

## Installation (recette uniquement)

1. FTP recette → remplacer `wp-content/mu-plugins/miniardise-site-test.php`.
2. Dans le `wp-config.php` **de la recette** (jamais dans Git) :
   ```php
   define( 'MO_TEST_CODE_APP', 'un-code-long-aleatoire' );          // le même que EXPO_PUBLIC_RECETTE_ACCESS de l'app
   define( 'MO_TEST_PASSERELLES', 'woocommerce_payments' );          // après connexion d'un compte WooPayments de test
   define( 'MO_TEST_WOOPAYMENTS_SANDBOX', true );                    // idem
   ```
3. Le code app est inclus dans les builds de développement / recette (lisible par qui possède ces builds) : il ne donne accès qu'à la recette, et peut être changé à tout moment.
