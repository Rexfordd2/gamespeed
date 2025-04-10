import { Target } from '../types/game';

interface GenerateTargetsParams {
  screenSize: { width: number; height: number };
  existingTargets: Target[];
  currentTime: number;
}

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

export const generateTargets = ({ screenSize, existingTargets, currentTime }: GenerateTargetsParams): Target[] => {
  // If we're in the middle of showing a sequence or waiting for input, return existing targets
  if (sequenceState.isShowingSequence || sequenceState.isWaitingForInput) {
    return existingTargets;
  }

  // Generate new sequence
  const numTargets = Math.floor(Math.random() * 3) + 3; // Random number between 3 and 5
  const newSequence: Target[] = [];

  for (let i = 0; i < numTargets; i++) {
    const target: Target = {
      id: `sequence-${i}-${currentTime}`,
      x: Math.random() * (screenSize.width - 100) + 50,
      y: Math.random() * (screenSize.height - 100) + 50,
      type: 'sequence',
      createdAt: currentTime,
      duration: 0, // Will be controlled by sequence state
      sequenceIndex: i,
      isActive: false,
    };
    newSequence.push(target);
  }

  // Update sequence state
  sequenceState = {
    sequence: newSequence,
    currentIndex: 0,
    isShowingSequence: true,
    isWaitingForInput: false,
    replayAvailable: true,
  };

  // Start showing the sequence
  return showNextInSequence();
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