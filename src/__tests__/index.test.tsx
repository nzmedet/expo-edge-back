import {
  clamp,
  getDragHapticDistance,
  getRevealProgress,
  shouldTriggerBack,
} from '../utils';

describe('edge back helpers', () => {
  it('clamps values within the configured range', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(52, 0, 100)).toBe(52);
    expect(clamp(140, 0, 100)).toBe(100);
  });

  it('computes reveal progress safely', () => {
    expect(getRevealProgress(0, 96)).toBe(0);
    expect(getRevealProgress(48, 96)).toBe(0.5);
    expect(getRevealProgress(120, 96)).toBe(1);
    expect(getRevealProgress(10, 0)).toBe(1);
  });

  it('decides when the back action should fire', () => {
    expect(shouldTriggerBack(80, 132)).toBe(false);
    expect(shouldTriggerBack(132, 132)).toBe(true);
  });

  it('defaults the drag haptic to the initial reveal threshold', () => {
    expect(getDragHapticDistance(100)).toBe(14);
    expect(getDragHapticDistance(10)).toBe(10);
    expect(getDragHapticDistance(100, 84)).toBe(84);
  });
});
