import { GraphQLError } from 'graphql';

// Types TypeScript correspondants au SDL
export type AgeCategory = 'U9' | 'U11' | 'U13' | 'U15' | 'U18' | 'SENIORS';
export type Equipment = 'CONES' | 'BIBIZ' | 'GOALS_SMALL' | 'HURDLES' | 'BALLS' | 'POLES';
export type TacticalWeakness = 'FINISHING' | 'LOW_BLOCK' | 'TRANSITION_DEFENSE' | 'TRANSITION_ATTACK' | 'BUILD_UP' | 'SET_PIECES' | 'PRESSING_TRIGGER';
export type SessionPhase = 'WARMUP' | 'ANALYTICAL' | 'TACTICAL' | 'THEMATIC_GAME';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  phase: SessionPhase;
  durationMinutes: number;
  ageCategories: AgeCategory[];
  requiredEquipment: Equipment[];
  primaryWeakness: TacticalWeakness;
  coachingCues: string[];
  diagramUrl?: string;
}

export interface SessionExercise {
  exercise: Exercise;
  orderIndex: number;
  durationMinutes: number;
}

export interface TrainingSession {
  id: string;
  title: string;
  ageCategory: AgeCategory;
  weaknesses: TacticalWeakness[];
  totalDurationMinutes: number;
  exercises: SessionExercise[];
  createdAt: string;
}

// Catalogue initial d'exercices tactiques (Mock robuste validé par le Product Manager)
export const EXERCISES_CATALOG: Exercise[] = [
  // WARMUP (13-15 min total)
  {
    id: 'ex-warm-1',
    title: 'Rondo dynamique 4v2 + transitions',
    description: 'Échauffement technique avec conservation de balle et transition rapide à la perte.',
    phase: 'WARMUP',
    durationMinutes: 15,
    ageCategories: ['U13', 'U15', 'U18', 'SENIORS'],
    requiredEquipment: ['CONES', 'BIBIZ', 'BALLS'],
    primaryWeakness: 'TRANSITION_DEFENSE',
    coachingCues: ['Qualité de passe', 'Réactivité à la perte', 'Mobilité constante'],
    diagramUrl: 'https://tactx.app/diagrams/warm-1.svg'
  },
  {
    id: 'ex-warm-2',
    title: 'Activation technique et coordination U9-U11',
    description: 'Parcours de passes courtes, conduite de balle et duels 1v1 ludiques.',
    phase: 'WARMUP',
    durationMinutes: 15,
    ageCategories: ['U9', 'U11'],
    requiredEquipment: ['CONES', 'BALLS'],
    primaryWeakness: 'BUILD_UP',
    coachingCues: ['Utilisation des deux pieds', 'Levée de tête', 'Plaisir et rythme'],
    diagramUrl: 'https://tactx.app/diagrams/warm-2.svg'
  },

  // ANALYTICAL (20-25 min total)
  {
    id: 'ex-analyt-1',
    title: 'Finition clinique aux 18 mètres (Frappes en pivot)',
    description: 'Exercice analytique de remise axiale et frappe instantanée sous pression légère.',
    phase: 'ANALYTICAL',
    durationMinutes: 22,
    ageCategories: ['U13', 'U15', 'U18', 'SENIORS'],
    requiredEquipment: ['CONES', 'GOALS_SMALL', 'BALLS'],
    primaryWeakness: 'FINISHING',
    coachingCues: ['Frappe tendue au sol', 'Fixation du gardien', 'Placement du corps armé'],
    diagramUrl: 'https://tactx.app/diagrams/analyt-1.svg'
  },
  {
    id: 'ex-analyt-2',
    title: 'Débordement et centre-retrait chronométré',
    description: 'Travail spécifique des couloirs, timing des courses dans la surface et tirs en première intention.',
    phase: 'ANALYTICAL',
    durationMinutes: 22,
    ageCategories: ['U15', 'U18', 'SENIORS'],
    requiredEquipment: ['CONES', 'BIBIZ', 'BALLS'],
    primaryWeakness: 'FINISHING',
    coachingCues: ['Vitesse du centre', 'Course décroisée', 'Présence massive dans la boîte'],
    diagramUrl: 'https://tactx.app/diagrams/analyt-2.svg'
  },
  {
    id: 'ex-analyt-3',
    title: 'Désorganisation de bloc bas par double appel',
    description: 'Séquence de passes doublées pour trouver l’intervalle entre la défense et le milieu adverse.',
    phase: 'ANALYTICAL',
    durationMinutes: 22,
    ageCategories: ['U13', 'U15', 'U18', 'SENIORS'],
    requiredEquipment: ['CONES', 'BIBIZ', 'BALLS', 'POLES'],
    primaryWeakness: 'LOW_BLOCK',
    coachingCues: ['Patience dans la circulation', 'Jeu en troisième homme', 'Verticalité'],
    diagramUrl: 'https://tactx.app/diagrams/analyt-3.svg'
  },

  // TACTICAL (25-30 min total)
  {
    id: 'ex-tact-1',
    title: 'Situation 7v7 : Attaquer un bloc bas compact',
    description: 'Mise en situation tactique sur demi-terrain avec un bloc adverse retranché en 4-4-0.',
    phase: 'TACTICAL',
    durationMinutes: 28,
    ageCategories: ['U13', 'U15', 'U18', 'SENIORS'],
    requiredEquipment: ['CONES', 'BIBIZ', 'BALLS'],
    primaryWeakness: 'LOW_BLOCK',
    coachingCues: ['Élargir le terrain', 'Fixer d’un côté pour changer de jeu', 'Frappes de loin si fermé'],
    diagramUrl: 'https://tactx.app/diagrams/tact-1.svg'
  },
  {
    id: 'ex-tact-2',
    title: 'Transition offensive éclair après récupération haute',
    description: 'Situation de contre-attaque rapide 4v3 suite à un déclenchement de pressing au milieu.',
    phase: 'TACTICAL',
    durationMinutes: 28,
    ageCategories: ['U15', 'U18', 'SENIORS'],
    requiredEquipment: ['CONES', 'BIBIZ', 'BALLS', 'GOALS_SMALL'],
    primaryWeakness: 'TRANSITION_ATTACK',
    coachingCues: ['Projoction vers l’avant en 3 touches max', 'Courses en profondeur synchronisées'],
    diagramUrl: 'https://tactx.app/diagrams/tact-2.svg'
  },
  {
    id: 'ex-tact-3',
    title: 'Jeu de position pour sortir de la pression (Relance courte)',
    description: 'Exercice tactique pour s’extraire proprement d’un pressing haut adverse.',
    phase: 'TACTICAL',
    durationMinutes: 28,
    ageCategories: ['U13', 'U15', 'U18', 'SENIORS'],
    requiredEquipment: ['CONES', 'BIBIZ', 'BALLS'],
    primaryWeakness: 'BUILD_UP',
    coachingCues: ['Disponibilité du gardien ou sentinelle', 'Sécurité de la première passe'],
    diagramUrl: 'https://tactx.app/diagrams/tact-3.svg'
  },

  // THEMATIC GAME (25-30 min total)
  {
    id: 'ex-game-1',
    title: 'Match à thèmes conditionné : Buts en 2 touches max dans les 30 derniers mètres',
    description: 'Opposition 8v8 ou 11v11 favorisant la finition immédiate et la spontanéité offensive.',
    phase: 'THEMATIC_GAME',
    durationMinutes: 25,
    ageCategories: ['U13', 'U15', 'U18', 'SENIORS'],
    requiredEquipment: ['CONES', 'BIBIZ', 'BALLS'],
    primaryWeakness: 'FINISHING',
    coachingCues: ['Intensité maximale', 'Pas de touches de balle superflues devant le but'],
    diagramUrl: 'https://tactx.app/diagrams/game-1.svg'
  },
  {
    id: 'ex-game-2',
    title: 'Match conditionné : Double bonus si but consécutif à une reconversion rapide',
    description: 'Jeu libre avec règle spéciale récompensant les transitions offensives foudroyantes.',
    phase: 'THEMATIC_GAME',
    durationMinutes: 25,
    ageCategories: ['U11', 'U13', 'U15', 'U18', 'SENIORS'],
    requiredEquipment: ['CONES', 'BIBIZ', 'BALLS'],
    primaryWeakness: 'TRANSITION_ATTACK',
    coachingCues: ['Faire basculer le surnombre', 'Réactivité générale'],
    diagramUrl: 'https://tactx.app/diagrams/game-2.svg'
  },
  {
    id: 'ex-game-3',
    title: 'Match d’application : Contournement de bloc bas et jeu dans les couloirs',
    description: 'Opposition avec zones neutres latérales bonifiant les centres et le jeu de tête.',
    phase: 'THEMATIC_GAME',
    durationMinutes: 25,
    ageCategories: ['U13', 'U15', 'U18', 'SENIORS'],
    requiredEquipment: ['CONES', 'BIBIZ', 'BALLS'],
    primaryWeakness: 'LOW_BLOCK',
    coachingCues: ['Occupation de la surface', 'Jeu en appui-soutien'],
    diagramUrl: 'https://tactx.app/diagrams/game-3.svg'
  }
];

// In-memory store pour les sessions générées (persistance temporaire en mémoire pour l'API)
export const sessionsStore = new Map<string, TrainingSession>();

/**
 * Valide et filtre les exercices selon l'âge et le matériel disponible
 */
export function filterExercises(
  exercises: Exercise[],
  ageCategory: AgeCategory,
  availableEquipment: Equipment[]
): Exercise[] {
  return exercises.filter((ex) => {
    // 1. Vérification compatibilité âge
    const matchesAge = ex.ageCategories.includes(ageCategory);
    if (!matchesAge) return false;

    // 2. Vérification matériel disponible (tous les équipements requis doivent être dans le matériel dispo)
    const hasAllEquipment = ex.requiredEquipment.every((eq) =>
      availableEquipment.includes(eq)
    );

    return hasAllEquipment;
  });
}

/**
 * Sélectionne le meilleur exercice pour une phase et une faiblesse donnée, avec fallback robuste
 */
export function selectBestExerciseForPhase(
  eligibleExercises: Exercise[],
  phase: SessionPhase,
  targetWeakness: TacticalWeakness,
  ageCategory: AgeCategory
): Exercise {
  // 1. Chercher un exercice correspondant à la phase ET à la faiblesse principale ciblée
  const exactMatch = eligibleExercises.find(
    (ex) => ex.phase === phase && ex.primaryWeakness === targetWeakness
  );
  if (exactMatch) return exactMatch;

  // 2. Fallback 1 : Chercher n'importe quel exercice de la bonne phase
  const phaseMatch = eligibleExercises.find((ex) => ex.phase === phase);
  if (phaseMatch) return phaseMatch;

  // 3. Fallback 2 ultime : N'importe quel exercice du catalogue éligible
  if (eligibleExercises.length > 0) {
    return eligibleExercises[0];
  }

  // 4. Fallback de secours absolu (si aucun matériel ou aucun filtre ne matche)
  return {
    id: `fallback-${phase.toLowerCase()}`,
    title: `Atelier pédagogique standard (${phase})`,
    description: 'Exercice standard de substitution généré automatiquement.',
    phase,
    durationMinutes: phase === 'WARMUP' ? 15 : phase === 'ANALYTICAL' ? 22 : 28,
    ageCategories: [ageCategory],
    requiredEquipment: [],
    primaryWeakness: targetWeakness,
    coachingCues: ['Rigueur', 'Application', 'Intensité'],
    diagramUrl: 'https://tactx.app/diagrams/default.svg'
  };
}

/**
 * Génère la structure complète de 90 minutes (15% - 25% - 30% - 30%)
 */
export function generate90MinStructure(
  ageCategory: AgeCategory,
  weaknesses: TacticalWeakness[],
  availableEquipment: Equipment[]
): SessionExercise[] {
  const eligible = filterExercises(EXERCISES_CATALOG, ageCategory, availableEquipment);

  // Faiblesse principale (la première cochée)
  const primaryWeakness = weaknesses[0] || 'FINISHING';
  // Faiblesse secondaire (si présente)
  const secondaryWeakness = weaknesses[1] || primaryWeakness;

  const phases: { phase: SessionPhase; duration: number; targetWeakness: TacticalWeakness }[] = [
    { phase: 'WARMUP', duration: 15, targetWeakness: primaryWeakness },
    { phase: 'ANALYTICAL', duration: 22, targetWeakness: primaryWeakness },
    { phase: 'TACTICAL', duration: 28, targetWeakness: secondaryWeakness },
    { phase: 'THEMATIC_GAME', duration: 25, targetWeakness: primaryWeakness }
  ];

  return phases.map((p, index) => {
    const exercise = selectBestExerciseForPhase(eligible, p.phase, p.targetWeakness, ageCategory);
    return {
      exercise,
      orderIndex: index + 1,
      durationMinutes: p.duration
    };
  });
}
