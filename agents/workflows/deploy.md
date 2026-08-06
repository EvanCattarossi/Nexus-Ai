# Workflow: Deploy

## Purpose

Procédure de mise en production, commune aux trois workflows métier (`BUILD_APPLICATION.md`, `BUG_FIX.md`, `PRODUCT_IMPROVEMENT.md`). Détaille ce qui se passe une fois qu'un lot de code est validé.

## Trigger

Le QA Engineer (et le Security Engineer si applicable) a validé un lot de code prêt à être mis en production.

## Chain

```
QA Engineer (validation fonctionnelle)
Security Engineer (validation sécurité, si requise)
        │
        ▼
DevOps Engineer
  1. Build via le pipeline CI/CD
  2. Préparation de la procédure de rollback
  3. Déploiement en production
  4. Surveillance post-déploiement (métriques, erreurs)
        │
        ▼
Software Architect (informé du statut de déploiement)
Marketing Manager (informé si le déploiement conditionne un lancement)
```

## Participating Agents

QA Engineer, Security Engineer (conditionnel), DevOps Engineer, Software Architect (destinataire du statut), Marketing Manager (destinataire si lancement associé).

## Notes

- Aucun déploiement sans validation QA préalable ; validation sécurité obligatoire si la fonctionnalité le requiert (voir `DEVOPS_ENGINEER.md`).
- Une procédure de rollback est prête avant tout déploiement significatif, pas improvisée après un incident.
- Pour un hotfix urgent (voir `agents/workflows/BUG_FIX.md`), cette procédure est accélérée mais jamais court-circuitée sur la validation QA.
