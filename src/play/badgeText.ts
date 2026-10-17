import type { StringKey } from '@/lib/i18n'
import type { BadgeId } from '@/lib/rules'

/** Each badge's name and description in the strings file (used by Results and Me). */
export const BADGE_TEXT: Record<BadgeId, { name: StringKey; about: StringKey }> = {
  'first-steps': { name: 'badge.firstSteps', about: 'badge.firstStepsAbout' },
  'kind-helper': { name: 'badge.kindHelper', about: 'badge.kindHelperAbout' },
  'quiz-whiz': { name: 'badge.quizWhiz', about: 'badge.quizWhizAbout' },
  'right-first-time': { name: 'badge.rightFirstTime', about: 'badge.rightFirstTimeAbout' },
  'all-buildings': { name: 'badge.allBuildings', about: 'badge.allBuildingsAbout' },
}
