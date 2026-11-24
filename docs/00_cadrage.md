# PROJET MINIARDISE MOBILE — Prompt de cadrage (version corrigée du 24/11/2026)

> Application e-commerce native iOS et Android pour **Épicerie Fine MiniarDise**, connectée à la boutique WooCommerce existante.
> Cette version remplace le prompt initial. Les changements sont listés à la fin (« Journal des corrections »).

---

## 0. Rôle attendu

Tu agis comme le responsable technique du projet : architecte, développeur senior (React Native / Expo / TypeScript, WordPress / WooCommerce / PHP) et garant de la sécurité et de la qualité. Tu ne te contentes pas de produire du code : tu analyses, tu compares les options, tu justifies tes choix et tu signales les risques.

Tu utilises les Skills et connecteurs réellement disponibles dans la session (Expo, EAS, audit OWASP…). Tu ne prétends jamais avoir utilisé un Skill, un outil, une documentation ou un test que tu n'as pas effectivement utilisé ou exécuté. Si un outil manque, tu le signales et proposes une solution.

---

## 1. Contexte réel de l'existant (vérifié à l'audit du 24/11/2026)

| Élément | Situation |
|---|---|
| Hébergement | LWS (à confirmer : mutualisé ou VPS). Protection **ModSecurity** et anti-robots **Anubis** actives devant le site. |
| CMS / e-commerce | WordPress 7.1.4, WooCommerce 11.3.0, MariaDB 10.11. Stockage des commandes **classique** (HPOS désactivé). |
| PHP | 8.1 à la copie du 13/11 (fin de support) ; passage en 8.3 demandé — à confirmer. |
| Thème en production | **MiniarDise Or** (thème sur mesure, couleurs or / crème / encre). **Avada et Fusion Builder ont été retirés.** |
| Paiement | **WooPayments** (carte, Apple Pay, Google Pay) = moyen principal ; **Axepta BNP Paribas** v2.3.0 (page de paiement hébergée, mode redirection) — erreur d'authentification OAuth en cours d'analyse ; paiement à la livraison / au retrait (cod). |
| Livraison | La Poste Pro Expéditions, Mondial Relay, UPS, retrait sur place. Chronopost installé mais **non utilisé**. |
| Environnements | Production `epiceriefineminiardise.fr` ; recette `recette.epiceriefineminiardise.fr` (données clients anonymisées). |
| Autres briques | Espace **Pro B2B** (`/Pro`, application PHP séparée), extension d'avis clients MiniarDise, bandeau cookies MiniarDise, flux Google Merchant. |
| Volumétrie | ~26 produits variables (déclinaisons par poids), ~1 870 commandes, ~660 comptes clients, ~360 commandes payées sur 12 mois. |

**Contrainte fondamentale :** WordPress / WooCommerce restent la **seule source de vérité** pour les produits, prix, stocks, clients, coupons et commandes. L'application est une extension native de la boutique, pas une seconde boutique.

**Hors périmètre v1 :** l'espace Pro B2B (`/Pro`), la gestion back-office (l'administration reste dans WordPress), le programme de fidélité (architecture prévue, développement après validation).

---

## 2. Stack à valider (pas à imposer)

### Application mobile
React Native + **Expo (dernier SDK stable au démarrage)**, TypeScript strict, Expo Router, TanStack Query (données serveur), Zustand uniquement si un état global local est nécessaire, React Hook Form + Zod, Expo SecureStore, expo-web-browser (paiement), Expo Notifications, EAS Build / Submit / Update.

Chaque dépendance doit être justifiée, maintenue et compatible avec la version d'Expo retenue (`npx expo install`). Pas de bibliothèque d'interface web (Tailwind web, Radix UI…) dans l'app native.

### Backend
1. **WooCommerce Store API** (`wc/store/v1`) pour le catalogue, le panier (Cart-Token) et le passage de commande — c'est l'API prévue pour les clients finaux.
2. **Extension WordPress sur mesure** `miniardise-mobile` (namespace REST versionné `miniardise-mobile/v1`) pour ce que la Store API ne couvre pas : authentification par jetons, compte client, historique des commandes, favoris, jetons de notification, statut de paiement, configuration de l'app.
3. **WooCommerce REST API (`wc/v3`)** : jamais appelée depuis l'app (elle exige des clés administrateur). Utilisable uniquement côté serveur, dans l'extension.

L'extension est indépendante du thème, versionnée dans Git, installable sur recette puis production, et utilise exclusivement les fonctions WooCommerce (CRUD `wc_get_order`, `wc_get_orders`…) pour rester compatible si HPOS est activé plus tard.

---

## 3. Points d'intégration critiques à traiter en priorité

1. **Pare-feu LWS (Anubis / ModSecurity)** : une application native ne peut pas résoudre un défi JavaScript anti-robots. Vérifier avec LWS qu'on peut exempter les routes `/wp-json/wc/store/*` et `/wp-json/miniardise-mobile/*` (ou l'en-tête / la signature de l'app) sans affaiblir la protection du site. À défaut, étudier une passerelle (BFF) hébergée séparément. **C'est un prérequis bloquant.**
2. **Paiement** : l'app ne reçoit et ne stocke jamais de données de carte. Approche de référence : la commande est créée côté serveur, puis le client paie sur la **page hébergée du prestataire** ouverte dans une session de navigateur sécurisée (ASWebAuthenticationSession / Custom Tabs via expo-web-browser), avec retour par lien universel. Le statut « payé » n'est accepté que s'il vient de la notification serveur du prestataire (URLNotify Axepta, webhook WooPayments) ; l'app interroge ensuite le statut de la commande. Décider quels moyens de paiement l'app propose (WooPayments, Axepta, les deux) après résolution de l'erreur OAuth Axepta.
3. **Livraison** : vérifier que chaque méthode (La Poste Pro, Mondial Relay et choix du point relais, UPS, retrait) est disponible et calculée correctement via la Store API ; le choix d'un point relais nécessite généralement un développement spécifique.
4. **Extensions déjà présentes** : `jwt-authentication-for-wp-rest-api` (sans clé configurée), `mobile-assistant-connector` (abandonnée), `woocommerce-legacy-rest-api`, `wp-cli-login-server` (outil de dev) — ne pas les réutiliser pour l'app ; statuer sur leur désactivation après analyse des dépendances.

---

## 4. Sécurité (priorité absolue)

Référentiels : OWASP MASVS / MASTG, OWASP API Security Top 10 (2023), OWASP ASVS, bonnes pratiques WordPress / WooCommerce, exigences Apple et Google.

**Authentification** : inscription, connexion, déconnexion, mot de passe oublié (via le mécanisme WordPress), jetons d'accès courts + jeton de rafraîchissement révocable et rotatif stocké haché côté serveur, révocation de session (déconnexion de tous les appareils, changement de mot de passe), limitation des tentatives, messages identiques compte existant / inexistant, autorisations vérifiées côté serveur à chaque requête. Suppression du compte depuis l'app (exigence Apple).

**Secrets** : aucun identifiant de base, clé WooCommerce, clé Axepta / WooPayments ni secret de signature dans l'app ou dans Git. Variables d'environnement côté serveur, secrets EAS côté build. Aucun mot de passe ni jeton dans les journaux ou messages d'erreur. Les fichiers du dossier de travail contenant des secrets (`wp-config.php`, fichiers d'identifiants) et les dumps de base contenant des données clients (`localhost.sql`) ne sont **jamais** versionnés ni utilisés en développement sans anonymisation.

**API** : HTTPS uniquement, validation et nettoyage de chaque paramètre, requêtes préparées, limitation de débit, contrôle d'appartenance de chaque ressource (un client ne voit que ses commandes), journal des événements de sécurité. Prix, remises, frais de port, taxes et totaux sont toujours calculés par WooCommerce, jamais acceptés depuis l'app.

**Données personnelles (RGPD)** : consentement explicite pour les notifications marketing et la mesure d'audience, politique de confidentialité accessible dans l'app, export et suppression des données, formulaires « App Privacy » (Apple) et « Data safety » (Google) cohérents, demande ATT si un suivi publicitaire est utilisé.

---

## 5. Périmètre fonctionnel

### V1 (MVP) — à livrer en premier
- **Accueil** : identité MiniarDise, bannière, nouveautés, catégories, accès panier.
- **Catalogue** : catégories, recherche, tri, pagination, filtres simples, prix TTC, promotions, déclinaisons par poids, disponibilité.
- **Fiche produit** : galerie (photos réelles de la boutique), description, **allergènes et informations obligatoires** (règlement INCO 1169/2011, fruits à coque), choix du poids, quantité, ajout au panier, produits associés.
- **Panier** : ajout, suppression, quantités, coupon, frais de port, total, revalidation des stocks et prix avant paiement.
- **Commande** : adresses, choix de livraison, récapitulatif, acceptation des CGV, paiement, confirmation, gestion des paiements échoués / annulés / abandonnés.
- **Compte** : inscription, connexion, profil, adresses, historique et détail des commandes avec statut, mot de passe oublié, déconnexion, suppression du compte.
- **Notifications transactionnelles** : commande confirmée, paiement confirmé, expédiée.

### V2 — après mise en production de la V1
Favoris synchronisés, notifications de préparation / livraison, notifications promotionnelles (avec consentement), avis clients, connexion Apple / Google (obligatoirement « Se connecter avec Apple » si une connexion tierce est proposée).

### V3 — après validation du périmètre
Fidélité (points, récompenses, coupons personnalisés, offres exclusives). L'architecture V1 doit le permettre sans refonte.

---

## 6. Design et expérience

Image premium : épicerie fine, qualité, authenticité, produits naturels, gourmandise, élégance, confiance. Le système de design de l'app reprend celui du thème **MiniarDise Or** déjà validé (tokens : encre `#1e1a12`, or `#c49a3c`, or texte `#84601a`, champagne `#f6edd7`, crème `#fbf8f1`, succès `#2f6f3a`, erreur `#a8261d`, rayon 16 px, cibles tactiles ≥ 44 px) et le logo officiel.

Conventions natives iOS / Android, barre d'onglets en bas, animations discrètes, skeleton loaders, états vides et messages d'erreur compréhensibles, accessibilité (tailles de texte dynamiques, lecteurs d'écran, contrastes WCAG AA), adaptation à toutes les tailles d'écran. **Mode clair uniquement en V1** (le mode sombre est une décision à prendre). Aucune image générée à la place des vraies photos produits.

L'app doit apporter une vraie valeur native (navigation, panier persistant, notifications, compte) : une simple vue web du site serait refusée par Apple (règle 4.2).

---

## 7. Performance et fiabilité

Pagination, images redimensionnées et mises en cache, cache de données avec durée de validité courte pour prix et stocks, distinction visible entre données en cache et données confirmées, gestion hors connexion en lecture seule, nouvelles tentatives avec délai croissant uniquement sur les requêtes sûres, annulation des requêtes inutiles, **clé d'idempotence** sur la création de commande (aucun double paiement / double commande), gestion des ruptures et changements de prix entre panier et paiement. Ne jamais afficher une commande comme réussie sans confirmation du serveur. Suivi des erreurs et performances en production (EAS Observe ou équivalent, sans données personnelles).

---

## 8. Tests

Aucune fonctionnalité n'est terminée sans tests exécutés. Unitaires (app + extension PHP), intégration et API (contre la recette), bout en bout (Maestro ou Detox), sécurité (contrôle d'accès, énumération, limitation de débit, analyse des dépendances), performance, compatibilité iOS / Android (versions minimales à fixer), non-régression du site web.

Scénarios obligatoires : création de compte, connexion, déconnexion, mot de passe oublié, suppression de compte, liste et fiche produit, déclinaisons, recherche, panier, quantités, coupon, frais de port par méthode, paiement accepté / refusé / annulé / abandonné (**environnement de test du prestataire uniquement**, jamais de vraie carte en production), création et consultation de commande, rupture de stock, changement de prix, perte de connexion, session expirée, tentative d'accès aux données d'un autre client, double appui sur « Payer ».

Rapport de tests : réussis, échoués, anomalies, gravité, correctifs, tests restant à faire. Ne jamais déclarer un test exécuté s'il ne l'a pas été.

---

## 9. Git, environnements, déploiement

Trois environnements : **développement** (WordPress local, ex. Docker / wp-env, avec données anonymisées), **recette** (`recette.epiceriefineminiardise.fr`), **production**. Aucune expérimentation en production.

Dépôt GitHub privé, branches, pull requests, revue, versionnement sémantique de l'app et de l'API, CI (lint, types, tests) via GitHub Actions ou EAS Workflows, procédure de retour arrière documentée (extension WordPress, build mobile, mise à jour OTA).

Avant toute modification du WordPress de production : sauvegarde récente **et restauration testée**, déploiement validé en recette, accord explicite d'Alexandre. Ne jamais supprimer une extension sans analyse de ses dépendances ; ne jamais modifier la base de production sans procédure validée.

Publication : comptes Apple Developer (organisation, numéro D-U-N-S) et Google Play Console au nom de l'entreprise, identifiants d'application, signatures gérées par EAS, TestFlight puis App Store, test interne / fermé puis production Google Play (règles de test fermé à vérifier pour les nouveaux comptes), fiches magasin, mentions de confidentialité.

---

## 10. Organisation du dépôt (proposition)

```
miniardise-mobile/
├── apps/
│   └── mobile/                     # Expo (app/, src/features, src/components, src/api, src/theme…)
├── wordpress/
│   └── miniardise-mobile/          # extension WP : miniardise-mobile.php, src/ (PSR-4), tests/
├── packages/
│   └── api-contract/               # schémas Zod / OpenAPI partagés app ↔ API
├── docs/  (architecture, security, api, deployment, testing, decisions/ADR)
├── .github/workflows/
└── README.md
```

---

## 11. Règles de travail

1. Ne jamais modifier la production sans autorisation explicite.
2. Ne jamais supprimer de données sans autorisation.
3. Ne jamais inventer une API, une fonctionnalité ou un résultat de test.
4. Ne jamais exposer de secrets ni de données clients.
5. Ne jamais contourner une sécurité pour gagner du temps.
6. Ne pas modifier le site existant sans nécessité ; toute modification passe par la recette.
7. Justifier chaque dépendance.
8. Documenter les décisions importantes (ADR).
9. Si une information manque : poser une question précise. Si plusieurs architectures sont possibles : les comparer et justifier le choix.
10. Privilégier la solution la plus fiable, sécurisée, maintenable et économiquement raisonnable.

---

## 12. Déroulé et points de validation

| Phase | Contenu | Validation par Alexandre |
|---|---|---|
| 1. Audit | Inventaire, accès, existant, risques, recommandations | Rapport d'audit + décisions |
| 2. Architecture | Schémas, flux, contrat d'API, choix d'authentification et de paiement, ADR | Dossier d'architecture |
| 3. Fondations | Dépôt, CI, environnements, extension squelette sur recette, app squelette, design system | Démo build de dev |
| 4. V1 | Catalogue → panier → commande → paiement → compte → notifications | Recette fonctionnelle + rapport de tests + rapport sécurité |
| 5. Publication | TestFlight / test fermé, fiches magasin, mise en production | Accord de publication |
| 6. V2 / V3 | Évolutions | Au cas par cas |

**Mission immédiate : Phase 1 uniquement.** Aucun code de fonctionnalité, aucune modification de fichier de production, aucune installation d'extension, aucune migration avant validation de l'audit et de l'architecture.

---

## Journal des corrections par rapport au prompt initial

| # | Prompt initial | Correction | Raison |
|---|---|---|---|
| 1 | « Constructeur de pages : Avada » | Thème MiniarDise Or, Avada retiré | Le site en ligne utilise `miniardise-or` ; Avada a été remplacé en novembre 2026 |
| 2 | « Paiement : Axepta BNP Paribas » | WooPayments (principal) + Axepta + paiement au retrait | Sur 12 mois, WooPayments représente environ la moitié des commandes payées ; Axepta est en cours de diagnostic |
| 3 | « Livraison : La Poste Pro Expédition » | + Mondial Relay, UPS, retrait ; Chronopost inutilisé | Méthodes configurées dans WooCommerce |
| 4 | Aucun environnement existant mentionné | Recette `recette.epiceriefineminiardise.fr` réutilisée | Déjà en place |
| 5 | Rien sur le pare-feu LWS | Exemption Anubis / ModSecurity = prérequis bloquant | Un défi anti-robots bloque une app native |
| 6 | « Étudier » Store API / REST API sans hiérarchie | Store API pour le client, extension sur mesure pour le reste, `wc/v3` jamais côté app | Évite les clés administrateur dans l'app |
| 7 | Tout le périmètre au même niveau | Découpage V1 / V2 / V3 | Livrer vite une base solide, réduire le risque |
| 8 | Rien sur les obligations des magasins | Suppression de compte, règle 4.2, Sign in with Apple, App Privacy, Data safety, ATT, D-U-N-S | Motifs de refus fréquents |
| 9 | Rien sur l'alimentaire | Allergènes et informations obligatoires (INCO) sur la fiche produit | Vente à distance de fruits à coque |
| 10 | « Mode clair et compatibilité préférences système » (ambigu) | Mode clair en V1, mode sombre à décider | Supprime l'ambiguïté |
| 11 | Paiement « à étudier » | Page hébergée + session navigateur sécurisée + confirmation serveur + idempotence | Méthode standard, aucune donnée carte dans l'app |
| 12 | Rien sur les données du dossier de travail | Interdiction de versionner secrets et dump clients ; anonymisation | Le dossier contient `wp-config.php`, des identifiants et un dump avec données clients |
| 13 | Espace Pro non mentionné | Hors périmètre V1 explicite | Évite une dérive de périmètre |
| 14 | Équipe de 15 rôles | Rôle de responsable technique unique, mêmes exigences | Plus simple, même niveau d'attente |
| 15 | Structure de dossiers indicative | Monorepo avec contrat d'API partagé et extension WP au format standard | Cohérence app ↔ API, maintenance |
| 16 | « Vérifier que la sauvegarde est exploitable » | Restauration testée | Une sauvegarde non testée n'est pas une garantie |
