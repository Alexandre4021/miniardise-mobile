# MiniarDise Mobile

Application iOS / Android d'**Épicerie Fine MiniarDise**, connectée à la boutique WooCommerce existante (source de vérité unique).

| Dossier | Contenu |
|---|---|
| `apps/mobile` | App Expo (SDK 58, TypeScript strict, Expo Router) |
| `wordpress/miniardise-mobile` | Extension WordPress : API sécurisée de l'app (`miniardise-mobile/v1`) |
| `docs/` | Cadrage, audit, architecture (ADR), déploiement |

## Démarrer

```bash
# App
cd apps/mobile
npm ci
cp .env.example .env.local     # URL de l'API : recette par défaut
npm run typecheck && npm run lint && npm test
npx expo start                 # puis « i » (simulateur iOS) ou « a » (émulateur Android)

# Extension WordPress
cd wordpress/miniardise-mobile
composer install && composer test
```

## Règles du dépôt

- Aucun secret, identifiant, dump de base ni donnée client dans Git (voir `.gitignore`).
- Toute modification passe par une branche + pull request ; la CI doit être verte.
- La production n'est jamais modifiée sans validation explicite ; tout est d'abord installé sur la recette.
- Décisions techniques : `docs/architecture/`.

## Avancement

| Phase | État |
|---|---|
| 1. Audit | ✅ validé |
| 2. Architecture | ✅ validée |
| 3. Fondations | 🟡 en cours — dépôt, CI, app (catalogue), extension (config + authentification) livrés ; preuves de faisabilité LWS / recette en attente |
| 4. V1 | à venir |
