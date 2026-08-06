# Workflow: Build Application

## Purpose

Cycle de vie complet de création d'un produit ou d'une fonctionnalité majeure, de l'idée initiale au lancement public. C'est le workflow de référence de Nexus AI — les autres workflows (`BUG_FIX.md`, `PRODUCT_IMPROVEMENT.md`) en sont des variantes plus courtes pour des cas plus ciblés.

## Trigger

Une idée de projet ou de fonctionnalité majeure est soumise au CEO (par un humain, ou remontée par un des managers de branche).

## Chain

```
CEO (Vision)
  │
  ▼
Business Analyst  ──┐
Finance Analyst   ──┤  (Étude & Budget — en parallèle)
                     ▼
Product Manager   ──┐
UX/UI Designer    ──┤  (Specs & Design — en parallèle, à partir du même dossier de besoin)
                     ▼
Software Architect ──┐
Security Engineer  ──┤  (Tech Design — revue sécurité en amont de toute implémentation sensible)
                      ▼
Backend / Frontend / Mobile / AI Engineer / Database Engineer   (Devs — lots parallèles assignés par le Software Architect)
                      │
                      ▼
QA Engineer  ──┐
Security Engineer ──┤  (Validation — fonctionnelle et sécurité)
                     ▼
DevOps Engineer (Déploiement)
                     │
                     ▼
Marketing Manager ──┐
Content Creator   ──┤  (Lancement)
                     ▼
Community Manager / Sales Manager / Customer Support (diffusion & écoute post-lancement)
```

## Steps

1. **Vision — `CEO.md`.** Évalue l'idée (valeur, faisabilité grossière, alignement stratégique). Décision : Go / No-Go / Go conditionnel. *Input :* proposition de projet. *Output :* décision motivée, transmise au Project Manager.
2. **Étude & Budget — `BUSINESS_ANALYST.md` + `FINANCE_ANALYST.md`** (en parallèle, coordonnés par `PROJECT_MANAGER.md`). Le Business Analyst produit le dossier de besoin (problème, cible, alternatives, risques) ; le Finance Analyst évalue le coût et le RoI. *Output :* dossier de besoin + avis de viabilité budgétaire.
3. **Specs & Design — `PRODUCT_MANAGER.md` + `UX_UI_DESIGNER.md`** (en parallèle, à partir du dossier de besoin). Le Product Manager définit la roadmap et les spécifications fonctionnelles ; l'UX/UI Designer conçoit les wireframes et le design system correspondants. *Output :* spécifications produit + maquettes/design system.
4. **Tech Design — `SOFTWARE_ARCHITECT.md` + `SECURITY_ENGINEER.md`.** Le Software Architect découpe les spécifications en lots techniques et définit les contrats d'interface ; le Security Engineer revoit toute architecture touchant l'authentification ou des données sensibles avant que l'implémentation ne démarre. *Output :* découpage technique assigné, contrats d'interface, verdict de sécurité préliminaire.
5. **Devs — `BACKEND_DEVELOPER.md`, `FRONTEND_DEVELOPER.md`, `MOBILE_DEVELOPER.md`, `AI_ENGINEER.md`, `DATABASE_ENGINEER.md`** (lots parallèles, selon le découpage du Software Architect). Chaque agent livre son lot avec ses tests. *Output :* code prêt à valider par lot.
6. **Validation — `QA_ENGINEER.md` + `SECURITY_ENGINEER.md`.** Le QA Engineer teste chaque livraison contre les critères d'acceptation ; le Security Engineer valide (ou bloque) sur les vulnérabilités critiques/élevées. *Output :* verdict validé / rejeté par lot.
7. **Déploiement — `DEVOPS_ENGINEER.md`.** Déploie uniquement le code validé, avec procédure de rollback prête. *Output :* produit disponible en production, confirmation transmise au Marketing Manager.
8. **Lancement — `MARKETING_MANAGER.md` + `CONTENT_CREATOR.md`.** Le Marketing Manager valide le lancement (disponibilité confirmée), coordonne la communication ; le Content Creator produit le contenu de lancement. Le Community Manager, le Sales Manager et le Customer Support prennent le relais pour la diffusion, la conversion et l'écoute post-lancement.

## Participating Agents

CEO, Business Analyst, Finance Analyst, Product Manager, UX/UI Designer, Software Architect, Security Engineer, Backend/Frontend/Mobile/AI/Database Developer, QA Engineer, DevOps Engineer, Marketing Manager, Content Creator, Community Manager, Sales Manager, Customer Support. Coordination transverse assurée par `PROJECT_MANAGER.md` du début à la fin.

## Notes

- Les étapes 2, 3 et 6 sont volontairement parallélisées : pas de raison d'attendre séquentiellement quand deux agents travaillent sur le même input sans dépendance entre eux.
- Une étape ne démarre que si l'étape précédente a produit un output explicite (décision, dossier, spec, verdict) — pas de travail commencé sur une hypothèse non actée.
- Le Project Manager assure le suivi d'avancement de bout en bout (voir `PROJECT_MANAGER.md`) mais ne remplace la décision d'aucun agent spécialisé de la chaîne.
