# Workflow: Sprint

## Purpose

Cadence de travail récurrente pour l'exécution technique d'un projet en cours, pilotée par le Project Manager et le Software Architect. Complémentaire à `agents/workflows/BUILD_APPLICATION.md` (qui décrit le cycle complet d'un produit) : le sprint est l'unité de temps répétée pendant la phase "Devs".

## Trigger

Un projet est entré en phase d'exécution technique (après validation du Tech Design par le Software Architect et le Security Engineer).

## Chain

```
Project Manager (relecture d'état, priorités du cycle — via list_tasks / update_task)
        │
        ▼
Software Architect (répartition des tâches du cycle entre agents d'exécution)
        │
        ▼
Devs (Backend / Frontend / Mobile / AI / Database — exécution)
        │
        ▼
QA Engineer (validation continue des livraisons du cycle)
        │
        ▼
Project Manager (clôture : tâches terminées, blocages signalés en mémoire)
```

## Participating Agents

Project Manager, Software Architect, agents d'exécution technique concernés, QA Engineer.

## Notes

- Le Project Manager relit l'état du projet en début et fin de cycle (voir `PROJECT_MANAGER.md`, méthode `list_tasks`) plutôt qu'en continu, pour laisser les agents d'exécution travailler sans interruption.
- Tout blocage détecté en cours de cycle est consigné en mémoire (`write_memory`, type `note`) pour visibilité, sans attendre la clôture du cycle si le blocage est bloquant.
- Ce workflow ne remplace pas `agents/workflows/meeting.md` : le sprint est une cadence d'exécution, le meeting est une synchronisation inter-branches.
