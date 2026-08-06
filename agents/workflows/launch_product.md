# Workflow: Launch Product

## Purpose

Détaille l'étape "Lancement" de `agents/workflows/BUILD_APPLICATION.md` : le jour J et les jours qui suivent la mise en production d'un nouveau produit, quand la coordination entre branches technique et marketing est la plus critique.

## Trigger

Le `DEVOPS_ENGINEER.md` confirme la disponibilité du produit en production, et le `CEO.md` a validé le lancement public (décision à fort enjeu, voir `CEO.md`).

## Chain

```
DevOps Engineer (confirmation de disponibilité)
        │
        ▼
CEO (validation finale du lancement public)
        │
        ▼
Marketing Manager (coordination du lancement)
        │
        ├──▶ Content Creator (contenu de lancement publié)
        ├──▶ Community Manager (diffusion sur les canaux communautaires)
        ├──▶ Sales Manager (activation du funnel de conversion)
        └──▶ Customer Support (préparation à l'afflux de demandes post-lancement)
```

## Participating Agents

DevOps Engineer, CEO, Marketing Manager, Content Creator, Community Manager, Sales Manager, Customer Support.

## Notes

- Aucune communication de lancement n'est publiée avant confirmation explicite de disponibilité en production par le DevOps Engineer (voir `MARKETING_MANAGER.md`).
- Le Customer Support est informé et préparé avant le lancement, pas après les premières demandes.
- Les premiers signaux post-lancement (retours communautaires, tickets de support) alimentent directement `agents/workflows/PRODUCT_IMPROVEMENT.md`.
