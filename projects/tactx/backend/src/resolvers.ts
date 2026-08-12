import { GraphQLError } from 'graphql';
import {
  EXERCISES_CATALOG,
  sessionsStore,
  filterExercises,
  generate90MinStructure,
  selectBestExerciseForPhase,
  TrainingSession,
  AgeCategory,
  TacticalWeakness,
  Equipment
} from './resolversData.js';

export const resolvers = {
  Query: {
    exercises: (_: any, args: { ageCategory?: AgeCategory; weakness?: TacticalWeakness }) => {
      let result = EXERCISES_CATALOG;

      // Validation et filtrage sécurisé
      if (args.ageCategory) {
        result = result.filter((ex) => ex.ageCategories.includes(args.ageCategory!));
      }
      if (args.weakness) {
        result = result.filter((ex) => ex.primaryWeakness === args.weakness);
      }

      return result;
    },

    session: (_: any, args: { id: string }) => {
      if (!args.id || typeof args.id !== 'string') {
        throw new GraphQLError('Identifiant de séance invalide.', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const session = sessionsStore.get(args.id);
      if (!session) {
        throw new GraphQLError(`Séance introuvable pour l'identifiant ${args.id}`, {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      return session;
    }
  },

  Mutation: {
    generateSession: (
      _: any,
      args: {
        input: {
          ageCategory: AgeCategory;
          weaknesses: TacticalWeakness[];
          availableEquipment: Equipment[];
        }
      }
    ) => {
      const { ageCategory, weaknesses, availableEquipment } = args.input;

      // 1. Validation stricte des entrées (Contrat d'interface et Sécurité)
      if (!ageCategory) {
        throw new GraphQLError('La catégorie d’âge est obligatoire.', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      if (!weaknesses || weaknesses.length === 0 || weaknesses.length > 3) {
        throw new GraphQLError('Veuillez cocher entre 1 et 3 faiblesses tactiques.', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      if (!availableEquipment) {
        throw new GraphQLError('La liste du matériel disponible est requise.', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // 2. Génération de la structure 90 min (15% - 25% - 30% - 30%)
      const sessionExercises = generate90MinStructure(ageCategory, weaknesses, availableEquipment);
      const totalDurationMinutes = sessionExercises.reduce((sum, item) => sum + item.durationMinutes, 0);

      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newSession: TrainingSession = {
        id: sessionId,
        title: `Séance TactX - ${ageCategory} (${weaknesses.join(', ')})`,
        ageCategory,
        weaknesses,
        totalDurationMinutes,
        exercises: sessionExercises,
        createdAt: new Date().toISOString()
      };

      // 3. Persistance en mémoire (store partagé)
      sessionsStore.set(sessionId, newSession);

      return newSession;
    },

    swapExercise: (
      _: any,
      args: {
        input: {
          sessionId: string;
          exerciseIdToReplace: string;
          ageCategory: AgeCategory;
          availableEquipment: Equipment[];
        }
      }
    ) => {
      const { sessionId, exerciseIdToReplace, ageCategory, availableEquipment } = args.input;

      // 1. Validation de l'existence de la session
      const session = sessionsStore.get(sessionId);
      if (!session) {
        throw new GraphQLError(`Séance introuvable (ID: ${sessionId})`, {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // 2. Trouver l'exercice à remplacer
      const targetIndex = session.exercises.findIndex(
        (se) => se.exercise.id === exerciseIdToReplace
      );
      if (targetIndex === -1) {
        throw new GraphQLError(`Exercice ${exerciseIdToReplace} absent de cette séance.`, {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const currentItem = session.exercises[targetIndex];
      const phaseToReplace = currentItem.exercise.phase;

      // 3. Filtrer les exercices éligibles pour cette phase (excluant l'exercice actuel)
      const eligible = filterExercises(EXERCISES_CATALOG, ageCategory, availableEquipment).filter(
        (ex) => ex.phase === phaseToReplace && ex.id !== exerciseIdToReplace
      );

      // 4. Sélectionner un nouvel exercice de remplacement
      let replacementExercise = eligible.length > 0 ? eligible[0] : null;
      if (!replacementExercise) {
        // Fallback si aucun autre n'est dispo dans le catalogue avec ce filtre
        replacementExercise = selectBestExerciseForPhase(
          filterExercises(EXERCISES_CATALOG, ageCategory, availableEquipment),
          phaseToReplace,
          session.weaknesses[0] || 'FINISHING',
          ageCategory
        );
      }

      // 5. Mettre à jour l'exercice dans la session
      session.exercises[targetIndex] = {
        ...currentItem,
        exercise: replacementExercise
      };

      sessionsStore.set(sessionId, session);

      return session;
    }
  }
};
