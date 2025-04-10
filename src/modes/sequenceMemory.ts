import { Target, GenerateTargetsParams } from '../types/game';

interface SequenceState {
  sequence: Target[];
  currentIndex: number;
  isShowingSequence: boolean;
  isWaitingForInput: boolean;
  replayAvailable: boolean;
}

let sequenceState: SequenceState = {
  sequence: [],
  currentIndex: 0,
  isShowingSequence: false,
  isWaitingForInput: false,
  replayAvailable: true,
};

export const generateTargets = ({ 
  screenSize, 
  existingTargets,
  sequenceLength = 3 
}: Omit<GenerateTargetsParams, 'currentTime'> & { sequenceLength?: number }): Target[] => {
  // If we already have targets, return them
  if (existingTargets.length > 0) {
    return existingTargets;
  }

  const currentTime = Date.now();
  const newTargets: Target[] = [];

  // Generate sequence of targets
  for (let i = 0; i < sequenceLength; i++) {
    const x = Math.random() * (screenSize.width - 100);
    const y = Math.random() * (screenSize.height - 100);

    const target: Target = {
      id: `target-${currentTime}-${i}`,
      x,
      y,
      type: 'sequence',
      createdAt: currentTime,
      duration: 1.0,
      lifespan: 1.0,
      sequenceIndex: i,
      isActive: false
    };

    newTargets.push(target);
  }

  return newTargets;
};

const showNextInSequence = (): Target[] => {
  if (!sequenceState.isShowingSequence) return sequenceState.sequence;

  const currentTargets = sequenceState.sequence.map((target, index) => ({
    ...target,
    isActive: index === sequenceState.currentIndex,
  }));

  // Move to next target in sequence after delay
  setTimeout(() => {
    if (sequenceState.currentIndex < sequenceState.sequence.length - 1) {
      sequenceState.currentIndex++;
      showNextInSequence();
    } else {
      // Sequence complete, wait for input
      sequenceState.isShowingSequence = false;
      sequenceState.isWaitingForInput = true;
      sequenceState.currentIndex = 0;
    }
  }, 1000); // Show each target for 1 second

  return currentTargets;
};

export const handleSequenceInput = (targetId: string): { success: boolean; sequenceComplete: boolean } => {
  if (!sequenceState.isWaitingForInput) return { success: false, sequenceComplete: false };

  const currentTarget = sequenceState.sequence[sequenceState.currentIndex];
  const success = currentTarget.id === targetId;

  if (success) {
    sequenceState.currentIndex++;
    if (sequenceState.currentIndex >= sequenceState.sequence.length) {
      // Sequence completed successfully
      sequenceState.isWaitingForInput = false;
      return { success: true, sequenceComplete: true };
    }
    return { success: true, sequenceComplete: false };
  } else {
    // Wrong target clicked
    sequenceState.isWaitingForInput = false;
    return { success: false, sequenceComplete: false };
  }
};

export const replaySequence = (): Target[] => {
  if (!sequenceState.replayAvailable) return sequenceState.sequence;

  sequenceState.isShowingSequence = true;
  sequenceState.isWaitingForInput = false;
  sequenceState.currentIndex = 0;
  sequenceState.replayAvailable = false;

  return showNextInSequence();
}; 