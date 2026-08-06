# Workflow: Product Improvement

## Purpose

Amélioration continue d'un produit déjà en production, à partir de signaux réels (analytics, retours communautaires, tickets de support) plutôt que d'une nouvelle idée business. Distinct de `BUILD_APPLICATION.md` (nouveau produit/fonctionnalité majeure) et de `BUG_FIX.md` (correction d'un dysfonctionnement) : ici, le produit fonctionne, mais peut être amélioré.

## Trigger

Un signal d'amélioration potentielle est identifié : tendance dans les analytics, demande récurrente remontée par le `COMMUNITY_MANAGER.md`, ou insatisfaction répétée signalée par le `CUSTOMER_SUPPORT.md`.

## Chain

```
Analytics / Community Manager / Customer Support
        │
        ▼
Business Analyst (Analyse du signal)
        │
        ▼
Product Manager (Priorisation & Spec)
        │
        ▼
Équipe Dev (Backend / Frontend / Mobile / AI / Database)
        │
        ▼
QA Engineer (Validation)
        │
        ▼
DevOps Engineer (Déploiement)
```

## Steps

1. **Signal — `COMMUNITY_MANAGER.md` / `CUSTOMER_SUPPORT.md` / analytics produit.** Un signal d'amélioration est identifié et synthétisé (pas un ticket isolé, mais une tendance ou un problème récurrent). *Output :* signal transmis au Marketing Manager puis au Business Analyst (via `PROJECT_MANAGER.md`).
2. **Analyse du signal — `BUSINESS_ANALYST.md`.** Vérifie si le signal correspond à un besoin réel et non déjà couvert, distingue fait et hypothèse. *Output :* analyse courte (le signal justifie-t-il une action, et laquelle).
3. **Priorisation & Spec — `PRODUCT_MANAGER.md`.** Décide si l'amélioration entre dans la roadmap, à quelle priorité, et rédige une spécification si l'ampleur le justifie (sinon, une simple tâche suffit).
4. **Équipe Dev — agent(s) d'exécution concerné(s).** Implémente l'amélioration selon la spécification ou la tâche définie.
5. **Validation — `QA_ENGINEER.md`.** Vérifie que l'amélioration répond au signal initial sans régression.
6. **Déploiement — `DEVOPS_ENGINEER.md`.** Met en production ; le `MARKETING_MANAGER.md` est informé pour clore la boucle avec la communauté ou le support à l'origine du signal si pertinent.

## Participating Agents

Community Manager, Customer Support, Business Analyst, Product Manager, un ou plusieurs agents d'exécution technique, QA Engineer, DevOps Engineer, Marketing Manager (en clôture de boucle).

## Notes

- Ce workflow est cyclique par nature : la boucle "signal → amélioration → nouveau signal" est le mécanisme d'amélioration continue de Nexus AI, à ne pas confondre avec un cycle de développement de produit neuf.
- Un signal isolé (un seul utilisateur, un seul cas) ne déclenche pas automatiquement ce workflow — c'est la récurrence ou l'impact qui justifie l'analyse du Business Analyst.
- Fermer la boucle avec la source du signal (répondre au community/support qui a fait remonter le besoin) fait partie du workflow, pas une étape optionnelle.
