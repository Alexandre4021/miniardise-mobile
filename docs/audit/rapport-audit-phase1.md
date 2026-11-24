# MiniarDise Mobile — Rapport d'audit Phase 1 (étapes A à G)

**Date :** 24/11/2026 · **Statut :** audit passif, aucune modification · **Destinataire :** Alexandre (validation requise avant la Phase 2)

---

## Conditions de l'audit (à lire en premier)

| Point | Ce qui a été fait réellement |
|---|---|
| Fichiers analysés | Dossier `Projet correction site epicerie` sur ton Mac : copie du site (`site epicerie`, **état du 13/11/2026**), dump `localhost.sql` (13/11/2026), livrables `PROD_CORRIGEE_2026-11-16` (rapports, audit sécurité du 17/11, thème, diagnostic Axepta). |
| Base de données | Lecture du dump par script, **en local sur ton Mac**, limitée aux réglages, produits, méthodes de livraison et répartition des commandes par moyen de paiement. **Aucune donnée client n'a été extraite ni recopiée** dans ce rapport. |
| Site en ligne | 4 requêtes GET publiques (accueil, index `/wp-json/`, Store API produits, `/wp-json/wp/v2/users`). La recette n'a pas pu être lue (accès robots refusé, ce qui est normal). Pas de connexion, pas de formulaire, pas de paiement. |
| Accès non disponibles | Panel LWS, FTP/SSH, phpMyAdmin, WordPress admin, compte Axepta, compte Stripe/WooPayments, comptes Apple / Google, GitHub (aucun compte GitHub relié à cette session). |
| Écart possible | Plusieurs points datent de la copie du 13/11. Depuis, des corrections ont été déployées (le thème MiniarDise Or est en ligne, deux nouveaux produits aussi). Les points marqués **« à confirmer »** doivent être revérifiés sur la production actuelle. |

---

## A–D. Environnement, fichiers, accès, outils

### Ressources accessibles

| Ressource | Accès | Remarque |
|---|---|---|
| Fichiers du site (copie 13/11) | ✅ Lecture | WordPress 7.1.4, WooCommerce 11.3.0, 23 extensions actives |
| Dump base (13/11) | ✅ Lecture | 5 bases ; prod = `epice2121284`, préfixe `wp8dc_` |
| Site de production | ✅ Lecture publique | Thème `miniardise-or` en ligne, Store API active |
| Recette | ❌ | Protégée (normal) — accès à me donner pour la Phase 2 |
| Panel LWS / FTP / BDD en direct | ❌ | Nécessaire pour Anubis/ModSecurity, version PHP, sauvegardes |
| Dépôt Git | ❌ | Aucun dépôt MiniarDise trouvé ; GitHub non relié |
| Projet Expo existant | ⚠️ Inconnu | Un échafaudage Expo « Terroir Élégant » a existé ; il n'est pas dans le dossier partagé |

### Outils et Skills disponibles dans cette session

| Besoin | Disponible | Commentaire |
|---|---|---|
| Expo / React Native | ✅ Skills `expo-overview`, `expo-router`, `expo-data-fetching`, `expo-design-system`, `expo-native-ui`, `expo-ui`, `expo-animation`, `expo-project-structure`, `expo-dev-client` + connecteur **Expo** (builds, simulateurs, docs) | Couverture complète côté mobile |
| Publication | ✅ Skills `eas-app-stores`, `eas-update`, `eas-workflows`, `eas-observe`, `eas-simulator` | Services EAS payants selon usage |
| Sécurité | ✅ Skill `owasp-security-audit` (OWASP Top 10:2025) | Pas de scanner dynamique (ZAP non connecté) |
| Machine | ✅ Mac Apple Silicon, Node, npm, git | Xcode à vérifier pour les builds iOS locaux (sinon EAS cloud) |
| WordPress / WooCommerce / PHP | ❌ Aucun Skill dédié | **Skill manquant** : je propose de créer un Skill « extension WooCommerce MiniarDise » (conventions, sécurité REST, tests PHPUnit, CRUD compatible HPOS) |
| Tests PHP / WordPress local | ❌ Non installé | À installer en Phase 3 : wp-env (Docker) + PHPUnit |
| Tests E2E mobiles | ❌ Non installé | Maestro (recommandé) en Phase 3 |
| Axepta / Stripe | ❌ Pas de connecteur | Documentation et comptes marchands à fournir |
| GitHub | ❌ Non relié | À connecter dans les réglages Claude (Connecteurs) |

---

## E. Audit technique de l'existant

### 1. Infrastructure

| Élément | Constat | Statut |
|---|---|---|
| WordPress | 7.1.4 | ✅ récent |
| WooCommerce | 11.3.0, Store API `wc/store/v1` publique et fonctionnelle (prix en centimes, déclinaisons, stock) | ✅ réutilisable directement |
| Base | MariaDB 10.11, commandes en stockage **classique** (HPOS désactivé) | ⚠️ coder uniquement via les fonctions WooCommerce |
| PHP | 8.1 dans la copie du 13/11 (plus de correctifs de sécurité) | ⚠️ passage 8.3 à confirmer |
| Thème | **MiniarDise Or 1.2.4** en ligne (sur mesure, sans Avada) | ✅ Avada n'est plus un sujet |
| Sécurité hébergeur | WAF **ModSecurity** + anti-robots **Anubis** (défi JavaScript) observés lors de l'audit du 17/11 | 🔴 **bloquant pour une app** tant qu'aucune exemption n'est en place |
| Cache | WP Fastest Cache + WP-Optimize + cache LWS | ⚠️ les routes API ne doivent pas être mises en cache |

### 2. Catalogue et données commerciales

| Élément | Constat |
|---|---|
| Produits | 24 produits variables publiés au 13/11 (+ Mélange sportif et Graines de courge en ligne depuis), 36 déclinaisons, 3 produits privés |
| Attributs | `pa_poids` (70 g à 1 kg) ; aucun produit simple |
| Catégories | Pistache, Noisette, Amandes, Noix, Cajou créées par le thème ; anciennes catégories « 500 g » / « 1 kg » / « Non classé » à nettoyer |
| Fiches produits | Données enrichies (allergènes, valeurs nutritionnelles, recettes) stockées par le thème → **à exposer à l'app** par l'extension |
| Prix | TTC saisis, TVA calculée par WooCommerce |
| Stock | Gestion activée, réservation 60 min |
| Coupons | 13 coupons publiés |
| Avis | Avis WooCommerce activés + extension MiniarDise Avis |
| Comptes | ~660 comptes ; inscription « Mon compte » activée, mot de passe choisi par le client, commande sans compte autorisée |

### 3. Paiement — situation réelle

Répartition des commandes payées / expédiées sur 12 mois (13/11/2025 → 13/11/2026), d'après le dump :

| Moyen | Commandes | Période |
|---|---|---|
| **WooPayments** (carte, Apple Pay, Google Pay) | **173** (≈ 49 %) | depuis 05/2025, dernière le 12/11/2026 |
| Axepta ancienne intégration (`computop_onetime`) | 120 | jusqu'au 10/08/2026 |
| **Axepta BNP Paribas v2.3.0** | 25 | 12/08 → 07/11/2026 |
| Paiement à la livraison / au retrait (`cod`) | 37 | actif |

Constats Axepta (extension v2.3.0) :
- Mode **production**, page de paiement hébergée en **redirection**, capture automatique, CB + Apple Pay + Google Pay.
- Retour serveur via `/axepta-return` (`wc-api=axepta_cb_return`) avec URL de notification (URLNotify) → **compatible avec une app** si la commande est créée côté serveur et le paiement fait dans une session navigateur.
- Au 13/11, la passerelle WooCommerce Axepta est **désactivée** et un diagnostic « OAuth token request failed » est en cours → Axepta **n'est pas fiable aujourd'hui**.
- Route publique `axepta/v1/settings` : n'expose que la liste des moyens de paiement (pas de secret).

WooPayments : actif, déjà utilisé via la Store API (97 commandes passées par la Store API depuis 2025). Côté app, deux options : page hébergée / navigateur, ou SDK Stripe natif (lourd, couplage fort). **Décision nécessaire.**

### 4. Livraison

| Zone | Méthodes configurées |
|---|---|
| France | Mondial Relay (2 instances), La Poste Pro Expéditions (3), UPS point relais, UPS EU, retrait sur place |
| Z1 / Z2 / Z3 / Royaume-Uni | Chronopost + Mondial Relay (Chronopost déclaré inutilisé) |
| Z1 Colissimo | La Poste Pro Expéditions |
| Hors zones | Retrait sur place |

Point d'attention : les points relais (Mondial Relay, UPS) passent par des widgets web propres à chaque extension ; la Store API ne fournit pas de sélecteur de point relais → **développement spécifique ou limitation V1** (ex. La Poste domicile + retrait seulement).

### 5. API et extensions — ce qui existe, ce qui se réutilise

| Brique | Existe | Réutilisable pour l'app | Commentaire |
|---|---|---|---|
| Store API (`wc/store/v1`) | ✅ | ✅ catalogue, panier, commande | Cart-Token pour panier sans cookie |
| REST API `wc/v1-v3` | ✅ | ❌ depuis l'app | Clés administrateur → uniquement côté serveur |
| `woocommerce-legacy-rest-api` | ✅ | ❌ | Ancienne API `/wc-api/` : désactiver si aucun service ne l'utilise |
| `jwt-authentication-for-wp-rest-api` 1.5.0 | ✅ (non visible en ligne) | ❌ | Pas de clé, pas de révocation ni rafraîchissement → ne pas l'utiliser |
| `mobile-assistant-connector` 2.2.4 | ✅ | ❌ | Testée jusqu'à WordPress 6.0, abandonnée, donne accès aux ventes à une app tierce → **à désactiver** si inutilisée |
| `wp-cli-login-server` | ✅ | ❌ | Connexion sans mot de passe par lien → **à retirer de la prod** |
| `woocommerce-pdf-invoices-packing-slips` 5.9.2 | ✅ | — | Signalée vulnérable à l'audit du 17/11 → mettre à jour |
| `wc-push-notifications` | ✅ | ❌ | Notifications de l'app WooCommerce officielle (admin), pas pour les clients |
| La Poste Pro, Chronopost | ✅ | Partiel | Leurs routes REST servent leurs plateformes, pas l'app |
| Extension mobile MiniarDise | ❌ | — | **À développer** : auth, compte, commandes, favoris, notifications, statut paiement |
| `/wp-json/wp/v2/users` | — | — | Ne renvoie pas la liste des utilisateurs (bon signe) |

Conflits potentiels : deux couches de cache + cache LWS sur les routes REST ; deux passerelles carte (WooPayments et Axepta) proposant toutes deux Apple Pay / Google Pay (un seul domaine Apple Pay vérifié à gérer) ; Chronopost installé mais inutilisé.

### 6. Risques de sécurité

| Gravité | Risque | Recommandation |
|---|---|---|
| 🔴 Critique | Dump avec données clients et fichiers de secrets (`wp-config.php`, identifiants admin Pro, accès site de test) dans un dossier non chiffré du Bureau | Ne jamais versionner ; déplacer hors du Bureau ou chiffrer ; générer une base de dev **anonymisée** |
| 🔴 Élevé | Anubis / ModSecurity bloqueront l'app ; une exemption mal faite ouvrirait l'API aux robots | Exemption ciblée par route + limitation de débit dans l'extension |
| 🟠 Élevé | Extensions à risque encore actives au 13/11 (`wp-cli-login-server`, `mobile-assistant-connector`, legacy API, JWT, PDF invoices vulnérable) | Vérifier en prod, désactiver via la recette d'abord |
| 🟠 Élevé | PHP 8.1 hors support | Passer en 8.3 (à confirmer) |
| 🟠 Élevé | Paiement Axepta instable | Ne pas bâtir l'app sur Axepta seul tant que l'erreur OAuth n'est pas résolue |
| 🟡 Moyen | Mot de passe BDD et clés WordPress à renouveler (audit du 16/11) | Statut à confirmer |
| 🟡 Moyen | 4 administrateurs, pas de double authentification | Activer la 2FA avant d'exposer une API compte client |
| 🟡 Moyen | Commande sans compte + création de compte ouverte | Limitation de débit et anti-énumération dans l'extension |

### 7. Limites de l'hébergement LWS

- Anti-robots à défi JavaScript incompatible avec un client natif (bloquant à lever avec le support LWS).
- WAF ModSecurity pouvant rejeter des corps JSON (réponses 406 observées le 17/11) → tests de non-blocage à prévoir.
- Hébergement mutualisé ou VPS : **à confirmer**. Sur mutualisé : pas de file de tâches durable, cron WordPress déclenché par les visites, ressources partagées → l'envoi de notifications doit rester léger (Expo Push en lot, via cron système LWS si disponible).
- Pas d'environnement de dev local fourni → WordPress local par Docker (wp-env).

---

## Architecture mobile recommandée

```
App iOS / Android (Expo, TypeScript)
   │  HTTPS (TLS), jeton d'accès court + rafraîchissement (SecureStore)
   ▼
LWS : exemption ciblée Anubis/ModSecurity pour /wp-json/wc/store/* et /wp-json/miniardise-mobile/*
   ▼
WordPress
   ├─ Store API WooCommerce ── catalogue, panier (Cart-Token), checkout
   └─ Extension « miniardise-mobile » (namespace v1)
        ├─ Auth : connexion, rafraîchissement rotatif, révocation, suppression compte
        ├─ Compte : profil, adresses, commandes (contrôle d'appartenance)
        ├─ Paiement : création session prestataire, statut confirmé par notification serveur
        ├─ Favoris, jetons push, préférences de consentement
        └─ Contenu : fiches enrichies (allergènes…), accueil, configuration app
   ▼
WooCommerce (CRUD) ──► MariaDB          Prestataires : WooPayments / Axepta ─(notification serveur)─► WordPress
                                         Notifications : WordPress ─► Expo Push ─► APNs / FCM
```

**Paiement** : l'app demande la création de la commande → l'extension renvoie l'URL de la page de paiement → ouverture dans une session navigateur sécurisée → retour par lien universel → l'app interroge le statut ; seul le statut confirmé par le prestataire côté serveur fait passer la commande en « payée ».

Alternatives écartées (à détailler en Phase 2) : app « vue web » du site (refus Apple, expérience pauvre) ; WC REST API avec clés dans l'app (faille critique) ; CoCart (extension tierce supplémentaire sans gain décisif face à la Store API stable) ; BFF séparé (coût et maintenance — gardé en plan B si LWS refuse l'exemption).

---

## Estimation des phases

Estimations indicatives pour un développement assisté par Claude avec ta validation à chaque étape ; elles dépendent surtout des décisions ci-dessous et des délais LWS / Apple / Google.

| Phase | Contenu | Durée indicative | Critères de validation |
|---|---|---|---|
| 1. Audit | Ce rapport | fait | Tu valides le rapport et les décisions |
| 2. Architecture | Schémas, contrat d'API (OpenAPI), ADR auth / paiement / livraison, plan de tests, réponse LWS | 1 semaine | Exemption LWS confirmée ; choix paiement et livraison V1 actés |
| 3. Fondations | Dépôt GitHub, CI, WordPress local anonymisé, extension squelette sur recette, app squelette + design system MiniarDise Or, build de dev iOS/Android | 1 à 2 semaines | App de dev qui affiche le catalogue de la recette ; CI verte |
| 4a. Catalogue & panier | Accueil, catalogue, recherche, fiche produit, panier, coupon | 2 semaines | Tests unitaires + E2E verts ; données identiques au site |
| 4b. Compte | Auth complète, profil, adresses, commandes, suppression compte | 2 semaines | Tests d'accès croisé et d'énumération verts ; audit OWASP de l'extension |
| 4c. Commande & paiement | Livraison, checkout, paiement prestataire (sandbox), idempotence, notifications transactionnelles | 2 à 3 semaines | 4 scénarios de paiement validés en sandbox ; aucun doublon |
| 5. Publication | TestFlight, test fermé Google (durée imposée par Google aux nouveaux comptes), fiches magasin, confidentialité | 2 à 4 semaines | Validation Apple et Google ; recette finale signée |
| 6. V2 / V3 | Favoris, promos, connexion Apple/Google, fidélité | à chiffrer | — |

**Priorités** : (1) exemption LWS, (2) décision paiement, (3) hygiène sécurité du site (extensions à risque, PHP 8.3, 2FA, données hors du Bureau), (4) comptes Apple / Google (délais D-U-N-S), puis développement.

---

## Points nécessitant ta décision

1. **Moyen(s) de paiement dans l'app** : WooPayments seul (recommandé pour démarrer : stable, déjà majoritaire), Axepta seul (une fois l'erreur OAuth résolue), ou les deux.
2. **Livraison en V1** : toutes les méthodes y compris points relais (développement spécifique), ou V1 limitée (La Poste domicile + retrait) et points relais en V2.
3. **Paiement au retrait (`cod`)** : le proposer dans l'app ?
4. **Commande sans compte** dans l'app : oui / non (recommandé : oui, comme sur le site).
5. **Comptes développeur** : as-tu déjà un compte Apple Developer *organisation* (D-U-N-S) et un compte Google Play Console au nom de l'entreprise ?
6. **Hébergement** : mutualisé ou VPS chez LWS ? Peux-tu ouvrir un ticket LWS pour l'exemption Anubis/ModSecurity (je te prépare le texte) ?
7. **Échafaudage Expo « Terroir Élégant »** : repartir de zéro (recommandé, palette MiniarDise Or validée depuis) ou me donner accès pour l'évaluer ?
8. **Extensions à risque** : accord pour préparer leur désactivation sur la recette ?
9. **GitHub** : relier ton compte GitHub à Claude et créer un dépôt privé `miniardise-mobile` ?
10. **Mode sombre** : V1 ou plus tard ?
11. **Accès pour la Phase 2** : identifiants de la recette (à me transmettre de façon sécurisée, pas dans un fichier du dossier), accès aux environnements de test Axepta et WooPayments.
