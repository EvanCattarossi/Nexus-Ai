# Workflow: Marketing Campaign

## Purpose

Cycle d'une campagne de croissance ponctuelle (au-delà du lancement initial d'un produit — voir `launch_product.md`), pilotée par le Marketing Manager sur un produit déjà en production.

## Trigger

Le Marketing Manager identifie une opportunité de croissance (saisonnalité, nouvelle fonctionnalité à mettre en avant, objectif de conversion non atteint).

## Chain

```
Marketing Manager (objectif de campagne, canaux, calendrier)
        │
        ├──▶ Content Creator (contenu de campagne)
        ├──▶ Community Manager (diffusion communautaire)
        └──▶ Sales Manager (funnel de conversion associé)
                │
                ▼
        Marketing Manager (mesure des résultats)
                │
                ▼
        Product Manager (retours transmis si la campagne révèle un signal produit)
```

## Participating Agents

Marketing Manager, Content Creator, Community Manager, Sales Manager, Product Manager (destinataire des signaux).

## Notes

- Toute campagne s'appuie sur des fonctionnalités confirmées disponibles — jamais sur une promesse non confirmée par le Software Architect ou le DevOps Engineer (voir `MARKETING_MANAGER.md`).
- Les résultats de campagne (qualitatifs si les données quantitatives manquent) sont systématiquement rapportés, pas seulement les actions menées.
