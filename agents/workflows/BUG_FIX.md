# Workflow: Bug Fix

## Purpose

Résolution rapide d'un bug ou d'un incident signalé, du signalement initial au correctif déployé. Volontairement plus court que `BUILD_APPLICATION.md` : pas d'étude de marché ni de design en amont, juste triage → correctif → validation → déploiement.

## Trigger

Un bug ou un incident est signalé, soit par un utilisateur via le `CUSTOMER_SUPPORT.md`, soit détecté directement (monitoring, `DEVOPS_ENGINEER.md`, `QA_ENGINEER.md`).

## Chain

```
Customer Support / Utilisateur
        │
        ▼
Project Manager (Triage & Priorité)
        │
        ▼
Software Architect (Attribution)
        │
        ▼
Dev concerné (Backend / Frontend / Mobile / AI / Database — Correctif)
        │
        ▼
QA Engineer (Validation)
        │
        ▼
DevOps Engineer (Hotfix Release)
```

## Steps

1. **Signalement — `CUSTOMER_SUPPORT.md`** (ou détection directe). Un problème est confirmé comme bug (pas un usage documenté ni une confusion utilisateur), avec description et étapes de reproduction si connues. *Output :* signalement structuré transmis au Project Manager.
2. **Triage & Priorité — `PROJECT_MANAGER.md`.** Évalue l'impact (nombre d'utilisateurs affectés, sévérité fonctionnelle) et fixe la priorité (`urgent` pour un incident bloquant en production, `high`/`medium` sinon). *Output :* tâche de correction créée, priorisée.
3. **Attribution — `SOFTWARE_ARCHITECT.md`.** Identifie le lot technique concerné et assigne le correctif à l'agent d'exécution pertinent (Backend, Frontend, Mobile, AI ou Database Engineer selon la nature du bug).
4. **Correctif — agent d'exécution concerné.** Corrige le bug, avec un test qui aurait dû le détecter (non-régression). *Output :* correctif prêt à valider.
5. **Validation — `QA_ENGINEER.md`.** Vérifie explicitement que le bug est résolu ET qu'aucune fonctionnalité adjacente n'a régressé. *Output :* verdict validé / rejeté.
6. **Hotfix Release — `DEVOPS_ENGINEER.md`.** Déploie le correctif validé, en procédure accélérée si l'incident est bloquant en production, avec rollback prêt.

## Participating Agents

Customer Support, Project Manager, Software Architect, un agent d'exécution technique (Backend/Frontend/Mobile/AI/Database Developer), QA Engineer, DevOps Engineer.

## Notes

- Pour un incident critique en production, les étapes 2 et 3 peuvent être compressées (le Project Manager et le Software Architect arbitrent en direct) mais jamais sautées : un correctif attribué sans triage risque de traiter le mauvais problème.
- Le Security Engineer est intégré à l'étape de validation dès lors que le bug touche l'authentification, des données sensibles, ou une surface d'exposition publique — voir `SECURITY_ENGINEER.md`.
- Toute correction de bug doit inclure un test de non-régression, pas seulement une résolution manuelle ponctuelle.
