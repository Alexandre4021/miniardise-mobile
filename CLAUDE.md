# Consignes pour les agents (Claude Code)

- Lire `docs/00_cadrage.md` (règles du projet) et `docs/architecture/architecture-phase2.md` (ADR) avant toute modification.
- App : voir `apps/mobile/AGENTS.md` (Expo SDK 58 — consulter la doc versionnée, installer avec `npx expo install`).
- Ne jamais toucher à la production ; ne jamais committer de secret ni de donnée client.
- Avant de déclarer une tâche finie : `npm run typecheck && npm run lint && npm test` (app) et `composer test` (extension).
- Ne jamais déclarer un test exécuté s'il ne l'a pas été.
