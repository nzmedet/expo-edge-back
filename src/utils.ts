export function clamp(value: number, min: number, max: number): number {
  'worklet';

  return Math.min(Math.max(value, min), max);
}

export function getRevealProgress(
  translationX: number,
  revealDistance: number
): number {
  'worklet';

  if (revealDistance <= 0) {
    return 1;
  }

  return clamp(translationX / revealDistance, 0, 1);
}

export function shouldTriggerBack(
  translationX: number,
  activationDistance: number
): boolean {
  'worklet';

  return translationX >= activationDistance;
}

export function getDragHapticDistance(
  activationDistance: number,
  dragHapticDistance?: number
): number {
  'worklet';

  if (typeof dragHapticDistance === 'number') {
    return dragHapticDistance;
  }

  return Math.min(14, activationDistance);
}
