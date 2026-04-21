import { CoachChallengeTemplate, CoachChallengeTemplateId } from '../types/coach';

export const COACH_CHALLENGE_TEMPLATES: Record<CoachChallengeTemplateId, CoachChallengeTemplate> = {
  noScroll7Day: {
    id: 'noScroll7Day',
    title: '7-Day No Pre-Practice Scrolling',
    description: 'Log one clean no-scroll day before practice for 7 days.',
    targetCount: 7,
  },
  runwayCompletion: {
    id: 'runwayCompletion',
    title: 'Pre-Game Runway Completion',
    description: 'Complete the pre-game runway 5 times this week.',
    targetCount: 5,
  },
};

const toDayKey = (ts: number) => {
  const date = new Date(ts);
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const d = `${date.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getChallengeUnitKey = (templateId: CoachChallengeTemplateId, ts: number) => {
  if (templateId === 'noScroll7Day') {
    return toDayKey(ts);
  }
  return `${ts}`;
};

export const getChallengeStatus = (templateId: CoachChallengeTemplateId, completedUnits: string[]) => {
  const target = COACH_CHALLENGE_TEMPLATES[templateId].targetCount;
  const done = completedUnits.length;
  return {
    done,
    target,
    remaining: Math.max(0, target - done),
    completed: done >= target,
  };
};
