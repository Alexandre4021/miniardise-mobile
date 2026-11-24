# Ticket support LWS — à copier dans l'espace client (Assistance › Nouveau ticket)

**Objet :** epiceriefineminiardise.fr — exemption anti-robots (Anubis) et WAF pour l'API REST d'une application mobile

Bonjour,

Je suis titulaire de l'hébergement du domaine **epiceriefineminiardise.fr** (offre Starter, site WordPress / WooCommerce). Nous développons une application mobile iOS et Android pour notre boutique. L'application appelle l'API REST WordPress du site en HTTPS.

Une application native ne peut pas résoudre le défi JavaScript de la protection anti-robots (Anubis) : ses requêtes seraient bloquées. Pourriez-vous me confirmer les points suivants :

1. **Exemption Anubis** : est-il possible d'exclure de la protection anti-robots uniquement les chemins suivants, en conservant la protection sur le reste du site ?
   - `/wp-json/wc/store/` (API boutique WooCommerce)
   - `/wp-json/miniardise-mobile/` (API de l'application, avec limitation de débit gérée par le site)
   - `/paiement-app/` (page de paiement ouverte par l'application dans le navigateur du téléphone, qui elle peut exécuter JavaScript — à confirmer si nécessaire)
2. **Pare-feu ModSecurity** : ces mêmes chemins reçoivent des requêtes `POST` / `PUT` / `PATCH` / `DELETE` avec un corps JSON et un en-tête `Authorization: Bearer`. Pouvez-vous confirmer qu'elles ne seront pas rejetées (nous avons observé des réponses 406 lors de tests), ou indiquer les règles à ajuster ?
3. **Cache** : pouvez-vous confirmer que le cache serveur LWS ne met pas en cache les réponses de `/wp-json/` (ou nous indiquer comment l'exclure) ?
4. **Tâches planifiées** : l'offre Starter permet-elle de créer une tâche cron qui appelle `https://epiceriefineminiardise.fr/wp-cron.php` toutes les 5 minutes ?
5. **Offre** : merci de confirmer le type exact de mon hébergement (mutualisé Starter ?), la version de PHP active et la possibilité de passer en **PHP 8.3**.
6. Si l'exemption par chemin n'est pas possible : quelles options proposez-vous (liste blanche d'adresses IP, en-tête spécifique, autre offre) ?

Ces chemins resteront protégés côté application (authentification par jeton, limitation du nombre de requêtes, journalisation).

Merci d'avance,

Alexandre — Épicerie Fine MiniarDise
