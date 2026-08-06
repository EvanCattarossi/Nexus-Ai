# Nexus AI

Nexus AI est une entreprise interne pilotée par des agents IA qui créent des produits numériques. Le projet a deux couches distinctes :

1. **Une application opérationnelle** (Next.js + Prisma/SQLite + Anthropic SDK) qui gère des projets, des tâches et une mémoire, et fait tourner un premier agent exécutable : le **Project Manager**.
2. **Une organisation documentée de 20 agents** (`agents/*.md`), organisés en hiérarchie (CEO → 3 branches → agents d'exécution), avec 13 workflows décrivant comment ils collaborent. À ce stade, seul le Project Manager est câblé au code — les 19 autres sont des définitions prêtes à l'emploi (system prompt inclus) en attente d'intégration.

Cette distinction est importante et reprise plus bas dans [État d'implémentation](#état-dimplémentation) : ne pas confondre "documenté" et "opérationnel".

---

## Vue d'ensemble

```
Idée / brief de projet
        │
        ▼
   Dashboard Nexus AI (Next.js)
        │
        ▼
   Project Manager (agent IA, opérationnel)
        │  décompose le brief en tâches, tient la mémoire du projet à jour
        ▼
   Tâches suivies dans le dashboard (board par statut)
```

À terme (voir [Prochaines étapes](#prochaines-étapes)), le Project Manager n'est que le premier maillon d'une chaîne documentée dans `agents/workflows/BUILD_APPLICATION.md` : CEO → Business Analyst/Finance Analyst → Product Manager/UX-UI Designer → Software Architect/Security Engineer → développeurs → QA/Security → DevOps → Marketing.

---

## Arborescence du projet

```
Nexus-AI/
├── agents/                    # Organisation documentée des 20 agents (voir plus bas)
│   ├── PROJECT_MANAGER.md     # Seul agent opérationnel — câblé à lib/agents/manager.ts
│   ├── CEO.md
│   ├── BUSINESS_ANALYST.md
│   ├── PRODUCT_MANAGER.md
│   ├── FINANCE_ANALYST.md
│   ├── SOFTWARE_ARCHITECT.md
│   ├── BACKEND_DEVELOPER.md
│   ├── FRONTEND_DEVELOPER.md
│   ├── MOBILE_DEVELOPER.md
│   ├── AI_ENGINEER.md
│   ├── DATABASE_ENGINEER.md
│   ├── SECURITY_ENGINEER.md
│   ├── DEVOPS_ENGINEER.md
│   ├── QA_ENGINEER.md
│   ├── UX_UI_DESIGNER.md
│   ├── MARKETING_MANAGER.md
│   ├── CONTENT_CREATOR.md
│   ├── COMMUNITY_MANAGER.md
│   ├── SALES_MANAGER.md
│   ├── CUSTOMER_SUPPORT.md
│   └── workflows/              # 13 cartes de workflow (cycle de vie produit, bug fix, amélioration continue, procédures techniques)
│       ├── BUILD_APPLICATION.md   # Workflow de référence : idée → lancement
│       ├── BUG_FIX.md
│       ├── PRODUCT_IMPROVEMENT.md
│       ├── create_app.md          # alias court vers BUILD_APPLICATION.md
│       ├── fix_bug.md             # alias court vers BUG_FIX.md
│       ├── create_api.md          # sous-procédure technique (création d'API)
│       ├── create_database.md     # sous-procédure technique (schéma de données)
│       ├── code_review.md         # procédure transverse (revue de code)
│       ├── deploy.md              # procédure transverse (mise en production)
│       ├── sprint.md              # cadence d'exécution technique
│       ├── meeting.md             # synchronisation inter-branches
│       ├── launch_product.md      # détail de l'étape "Lancement"
│       └── marketing_campaign.md  # campagne de croissance post-lancement
│
├── app/                        # Next.js App Router : dashboard + API
│   ├── (dashboard)/             # UI : liste des projets, détail projet (board, mémoire, Run Manager)
│   └── api/                     # Routes API : projects, tasks, memory, agents/manager/run
│
├── components/                 # Composants React (dashboard) + components/ui (shadcn/ui)
│
├── lib/
│   ├── agents/
│   │   ├── manager.ts           # Boucle d'exécution de l'agent Manager (Anthropic SDK, tool use)
│   │   └── loadAgentDefinition.ts  # Parseur des fichiers agents/*.md (front-matter + system prompt)
│   ├── services/                 # Accès Prisma partagé entre routes API et agent Manager
│   ├── validators.ts             # Schémas Zod (source de vérité des statuts/priorités)
│   └── db.ts                     # Client Prisma singleton
│
├── prisma/
│   ├── schema.prisma             # Modèle de données : Project, Task, Agent, AgentRun, Memory
│   ├── seed.ts                   # Seed l'agent "manager" depuis agents/PROJECT_MANAGER.md
│   └── migrations/
│
├── docs/                        # Réservé à la documentation projet future (ADRs, etc.)
├── memory/                      # Réservé à un futur système de mémoire globale Nexus AI (hors mémoire assistant)
├── projects/                    # Espace de travail : livrables réels produits par les agents (distinct des métadonnées en base)
├── prompts/                     # Prompts d'entrée (START.md : mission fondatrice de Nexus AI)
│
├── .env.example                 # Variables d'environnement attendues (DATABASE_URL, ANTHROPIC_API_KEY)
└── package.json
```

---

## Organisation : les 20 agents

### Hiérarchie

```
CEO (Vision Stratégique & Arbitrage)
│
├── PROJECT_MANAGER (Gestion de Projet & Coordination)          ← opérationnel
│   ├── BUSINESS_ANALYST (Besoins & Étude de Marché)
│   ├── PRODUCT_MANAGER (Roadmap & Spécifications)
│   └── FINANCE_ANALYST (Budget, RoI & Viabilité)
│
├── SOFTWARE_ARCHITECT (Architecture Technique & Normes)
│   ├── BACKEND_DEVELOPER (APIs & Logique Métier)
│   ├── FRONTEND_DEVELOPER (Web UI & Intégration)
│   ├── MOBILE_DEVELOPER (Applications iOS/Android)
│   ├── AI_ENGINEER (Modèles LLM, RAG & Prompts)
│   ├── DATABASE_ENGINEER (Schémas, Indexation & Performances)
│   ├── SECURITY_ENGINEER (Audit, OWASP & Conformité)
│   ├── DEVOPS_ENGINEER (CI/CD, Cloud & Infrastructure)
│   ├── QA_ENGINEER (Tests, Recette & Qualité)
│   └── UX_UI_DESIGNER (Design System, Wireframes & UX)
│
└── MARKETING_MANAGER (Croissance & Acquisition)
    ├── CONTENT_CREATOR (Copywriting & Documentation externe)
    ├── COMMUNITY_MANAGER (Réseaux sociaux & Réputation)
    ├── SALES_MANAGER (Stratégie Commerciale & Funnel)
    └── CUSTOMER_SUPPORT (Feedback Utilisateurs & Support)
```

### Format des fichiers d'agent

Chaque fichier `agents/*.md` suit la même structure en 9 sections : `# Role`, `# Mission`, `# System Prompt`, `# Expertise`, `# Responsibilities`, `# Workflow & Interactions`, `# Input`, `# Output`, `# Rules & Constraints`. La section `# System Prompt` est rédigée pour être utilisable telle quelle par un LLM.

`agents/PROJECT_MANAGER.md` a une particularité : il porte un en-tête YAML (front-matter) avant les sections Markdown, car c'est le seul fichier lu par du code réel :

```yaml
---
name: manager
model: claude-opus-5
maxTokens: 8000
effort: medium
maxToolIterations: 8
---
```

`lib/agents/loadAgentDefinition.ts` parse ce front-matter pour la configuration (modèle, budget de tokens, effort, plafond d'itérations) et extrait le contenu de la section `# System Prompt` comme prompt système envoyé au modèle — le reste du fichier (Role, Mission, Expertise...) est de la documentation, pas transmis au modèle. Cette convention est uniforme sur les 20 fichiers ; elle permet de câbler n'importe quel autre agent plus tard sans changer le format.

---

## État d'implémentation

| Composant | Statut |
|---|---|
| Dashboard (projets, tâches, mémoire) | ✅ Opérationnel |
| Agent **Project Manager** | ✅ Opérationnel (décompose les briefs, met à jour les tâches et la mémoire via `POST /api/agents/manager/run`) |
| 19 autres agents (CEO, Software Architect, développeurs, marketing...) | 📄 Documentés (system prompt prêt à l'emploi, non câblés à une boucle d'exécution) |
| 13 workflows | 📄 Documentés (décrivent la collaboration cible entre agents) |
| Orchestrateur multi-agent (exécution automatique de la chaîne CEO → ... → Marketing) | ❌ Non implémenté |

Construire l'orchestrateur multi-agent est un chantier distinct et volumineux (câblage de 19 agents supplémentaires, gestion des dépendances entre étapes, état partagé entre agents) — voir [Prochaines étapes](#prochaines-étapes).

---

## Démarrage rapide

```bash
npm install
cp .env.example .env   # puis renseigner ANTHROPIC_API_KEY
npx prisma migrate dev
npx prisma db seed     # crée l'agent "manager" en base depuis agents/PROJECT_MANAGER.md
npm run dev
```

→ http://localhost:3000

---

## Orchestrer les agents — étape par étape

### Ce qui fonctionne aujourd'hui (Project Manager)

1. Ouvrir le dashboard, cliquer **"Nouveau projet"**, renseigner un nom et un brief (description libre).
2. Ouvrir la page du projet créé, cliquer **"Run Manager"**.
3. L'agent Project Manager (`lib/agents/manager.ts`) :
   - lit le brief du projet,
   - décompose le brief en 3 à 12 tâches via l'outil `create_task` (ou relit l'état existant via `list_tasks` si des tâches existent déjà),
   - signale les blocages ou consigne des décisions via `write_memory`,
   - journalise son exécution dans `AgentRun` (visible dans le "Journal d'exécution" de la page projet).
4. Les tâches créées apparaissent dans le board (colonnes À faire / En cours / Bloqué / À valider / Terminé), modifiables manuellement.

### Comment câbler un agent supplémentaire (ex. Software Architect)

Le Project Manager sert de modèle. Pour rendre un autre agent opérationnel :

1. Ajouter un en-tête front-matter à son fichier (`agents/SOFTWARE_ARCHITECT.md`) : `name`, `model`, `maxTokens`, `effort`, `maxToolIterations`.
2. Créer un module `lib/agents/<nom>.ts` sur le modèle de `lib/agents/manager.ts` : charger la définition via `loadAgentDefinition()`, définir les outils spécifiques à l'agent (ex. pour le Software Architect : lire les tâches du Project Manager, créer des sous-tâches assignées par lot technique), implémenter la boucle d'appel au modèle.
3. Ajouter une ligne `Agent` en base (via `prisma/seed.ts` ou un script dédié) et une route API (`app/api/agents/<nom>/run/route.ts`) suivant le même schéma que `app/api/agents/manager/run/route.ts`.
4. Ajouter un déclencheur dans le dashboard (bouton, ou automatisation) suivant l'étape correspondante dans `agents/workflows/BUILD_APPLICATION.md`.

### Comment suivre un workflow documenté manuellement

En attendant l'orchestrateur automatique, un opérateur humain peut suivre une carte de workflow (`agents/workflows/*.md`) comme une checklist : ouvrir le fichier du workflow concerné, exécuter chaque étape dans l'ordre en s'appuyant sur le system prompt de l'agent listé (copié dans un outil LLM externe si l'agent n'est pas encore câblé), et faire circuler les livrables (dossier de besoin, spécifications, code...) manuellement entre les étapes.

---

## Exemple concret de bout en bout

**Scénario : lancer un mini-site vitrine pour un client fictif.**

1. **Brief.** Sur le dashboard, création du projet "Site vitrine Acme" avec pour description : *"Site vitrine 5 pages (accueil, à propos, services, blog, contact) avec formulaire de contact et intégration analytics. Deadline 3 semaines."*
2. **Run Manager.** Clic sur "Run Manager". L'agent lit le brief, appelle `create_task` plusieurs fois :
   - "Concevoir la structure des 5 pages" (priorité `high`)
   - "Intégrer le formulaire de contact" (priorité `high`)
   - "Configurer l'intégration analytics" (priorité `medium`)
   - "Rédiger le contenu des pages" (priorité `medium`)
   - "Déployer le site en production" (priorité `high`, échéance à 3 semaines)
   
   Le résumé de l'exécution apparaît dans le Journal d'exécution ; les 5 tâches apparaissent dans la colonne "À faire" du board.
3. **Suivi manuel.** Les tâches sont déplacées dans le board au fur et à mesure (`À faire` → `En cours` → `Terminé`) par les personnes ou agents qui les exécutent réellement (aujourd'hui : manuellement, faute d'agents d'exécution câblés).
4. **Relance du Manager.** Une fois certaines tâches avancées, un second clic sur "Run Manager" relit l'état (`list_tasks`), détecte par exemple qu'une tâche est bloquée, et écrit une entrée Memory de type `note` documentant le blocage — visible dans l'onglet Mémoire de la page projet.
5. **Suite documentée (non automatisée).** Selon `agents/workflows/BUILD_APPLICATION.md`, l'étape suivante serait la revue technique par le `SOFTWARE_ARCHITECT.md` puis l'attribution aux développeurs concernés (`FRONTEND_DEVELOPER.md`, `BACKEND_DEVELOPER.md`) — réalisable dès aujourd'hui en copiant le system prompt de l'agent concerné dans un outil LLM, en attendant son câblage.

---

## Stack technique

- **Application** : Next.js 16 (App Router, TypeScript), Tailwind CSS + shadcn/ui, SQLite via Prisma ORM, Zod pour la validation.
- **Agent Manager** : Anthropic SDK TypeScript (`claude-opus-5`), boucle d'appel d'outils manuelle (pas de dépendance beta), thinking adaptatif laissé actif par défaut.
- **Définitions d'agent** : Markdown + front-matter YAML, parsées via `gray-matter`.

---

## Prochaines étapes

- Câbler progressivement les agents de la branche technique (`SOFTWARE_ARCHITECT.md` en premier, car il orchestre les 9 agents d'exécution) en suivant la procédure décrite plus haut.
- Construire un orchestrateur qui enchaîne automatiquement les étapes de `agents/workflows/BUILD_APPLICATION.md` plutôt que de s'appuyer sur des déclenchements manuels bouton par bouton.
- Étendre le modèle de données (`prisma/schema.prisma`) si de nouveaux agents nécessitent des entités au-delà de `Project`/`Task`/`Memory` (ex. `Budget` pour le Finance Analyst, `Deployment` pour le DevOps Engineer).
