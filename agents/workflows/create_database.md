# Workflow: Create Database

## Purpose

Procédure technique pour la conception et la mise en place d'un nouveau schéma de données, ou une évolution significative d'un schéma existant. Sous-procédure de l'étape "Devs" de `agents/workflows/BUILD_APPLICATION.md`.

## Trigger

Le Software Architect assigne un lot technique nécessitant un nouveau modèle de données ou une migration de schéma existant.

## Chain

```
Software Architect (entités et relations attendues, à partir des spécifications produit)
        │
        ▼
Database Engineer (conception du schéma, index, migration versionnée)
        │
        ▼
Security Engineer (revue si champs de données sensibles)
        │
        ▼
Backend Developer (intégration du schéma dans la logique applicative)
        │
        ▼
DevOps Engineer (application de la migration en production, avec rollback prêt)
```

## Participating Agents

Software Architect, Database Engineer, Security Engineer (conditionnel), Backend Developer, DevOps Engineer.

## Notes

- Toute migration sur une base contenant déjà des données est versionnée et accompagnée d'un plan de rollback avant application (voir `DATABASE_ENGINEER.md`).
- Les champs contenant des données sensibles sont identifiés dès la conception du schéma, pas ajoutés au chiffrement après coup.
