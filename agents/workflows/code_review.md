# Workflow: Code Review

## Purpose

Procédure technique transverse déclenchée à chaque livraison de code, indépendamment du workflow métier qui l'a produite (`BUILD_APPLICATION.md`, `BUG_FIX.md` ou `PRODUCT_IMPROVEMENT.md`). Garantit qu'aucun code n'atteint la QA sans avoir été revu.

## Trigger

Un agent d'exécution technique (`BACKEND_DEVELOPER.md`, `FRONTEND_DEVELOPER.md`, `MOBILE_DEVELOPER.md`, `AI_ENGINEER.md`, `DATABASE_ENGINEER.md`) considère un lot de code prêt.

## Chain

```
Agent d'exécution (code prêt)
        │
        ▼
Software Architect (revue de conformité aux normes et à l'architecture)
        │
        ▼
Security Engineer (revue sécurité, si le lot touche l'authentification / données sensibles / exposition publique)
        │
        ▼
QA Engineer (tests fonctionnels — voir agents/workflows/BUILD_APPLICATION.md étape "Validation")
```

## Participating Agents

L'agent d'exécution auteur du code, Software Architect, Security Engineer (conditionnel), QA Engineer.

## Notes

- La revue du Software Architect porte sur la conformité aux normes et contrats d'interface définis — pas sur la logique métier ligne à ligne, qui reste sous la responsabilité de l'auteur.
- La revue du Security Engineer n'est déclenchée que si le lot touche l'authentification, des données sensibles ou une surface d'exposition publique (voir `SECURITY_ENGINEER.md`).
- Un lot rejeté à cette étape retourne à l'agent d'exécution avec les points précis à corriger, pas une simple mention "à revoir".
