# Workflow: Create API

## Purpose

Procédure technique pour la création d'un nouvel endpoint ou d'une nouvelle surface d'API. Sous-procédure de l'étape "Devs" de `agents/workflows/BUILD_APPLICATION.md`, détaillée ici parce qu'elle implique systématiquement plusieurs agents techniques en coordination.

## Trigger

Le Software Architect assigne un lot technique nécessitant une nouvelle API ou l'extension d'une API existante.

## Chain

```
Software Architect (contrat d'interface : routes, formats, codes d'erreur)
        │
        ▼
Database Engineer (schéma de données nécessaire, si applicable)
        │
        ▼
Backend Developer (implémentation des endpoints + tests)
        │
        ▼
Security Engineer (revue si authentification / données sensibles)
        │
        ▼
Frontend Developer / Mobile Developer / AI Engineer (consommation de l'API)
```

## Participating Agents

Software Architect, Database Engineer, Backend Developer, Security Engineer (conditionnel), Frontend Developer, Mobile Developer, AI Engineer (consommateurs).

## Notes

- Le contrat d'interface (routes, formats de requête/réponse, codes d'erreur) est défini avant le début de l'implémentation — jamais découvert a posteriori par les équipes consommatrices.
- Toute évolution ultérieure du contrat est communiquée explicitement aux agents consommateurs, pas seulement documentée après coup.
