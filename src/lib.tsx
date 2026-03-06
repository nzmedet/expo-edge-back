import { Platform, StyleSheet, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  type PanGesture,
  type PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import type {
  EdgeBackAnchorRenderProps,
  EdgeBackGestureHookResult,
  EdgeBackGestureOptions,
  EdgeBackGestureViewProps,
  EdgeBackSide,
} from './types';
import {
  clamp,
  getDragHapticDistance,
  getRevealProgress,
  shouldTriggerBack,
} from './utils';

const AnimatedLine = Animated.createAnimatedComponent(Line);

const DEFAULT_EDGE_WIDTH = 24;
const DEFAULT_REVEAL_DISTANCE = 96;
const DEFAULT_ACTIVATION_DISTANCE = 132;
const DEFAULT_MAX_DRAG_DISTANCE = 180;
const DEFAULT_ANCHOR_SIZE = 56;
const DEFAULT_DIM_MAX_OPACITY = 0.12;
const DEFAULT_CONTENT_SCALE_TO = 0.97;
const DEFAULT_ANCHOR_Y = 240;
const DEFAULT_FINGER_OFFSET_MULTIPLIER = 2.35;
const TIMING_CONFIG = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
};

function resetGestureState(
  isVisible: { value: number },
  translateX: { value: number },
  isTriggered: { value: boolean },
  dragHapticFired: { value: boolean },
  anchorY: { value: number },
  touchX: { value: number },
  touchY: { value: number }
) {
  'worklet';

  translateX.value = withTiming(0, TIMING_CONFIG);
  isVisible.value = withTiming(0, TIMING_CONFIG);
  isTriggered.value = false;
  dragHapticFired.value = false;
  anchorY.value = withTiming(anchorY.value, TIMING_CONFIG);
  touchX.value = withTiming(touchX.value, TIMING_CONFIG);
  touchY.value = withTiming(touchY.value, TIMING_CONFIG);
}

function applyDragUpdate(
  translation: number,
  touchLocalX: number,
  touchLocalY: number,
  side: EdgeBackSide,
  anchorSize: number,
  maxDragDistance: number,
  activationDistance: number,
  dragHapticDistance: number,
  translateX: { value: number },
  isVisible: { value: number },
  isTriggered: { value: boolean },
  dragHapticFired: { value: boolean },
  activeEdge: { value: EdgeBackSide },
  anchorY: { value: number },
  touchX: { value: number },
  touchY: { value: number },
  onDragHaptic?: () => void
) {
  'worklet';

  const nextTranslation = clamp(translation, 0, maxDragDistance);
  translateX.value = nextTranslation;

  if (nextTranslation > 2) {
    isVisible.value = 1;
    activeEdge.value = side;
    touchX.value = touchLocalX;
    touchY.value = touchLocalY;
    anchorY.value = Math.max(
      touchLocalY - anchorSize * DEFAULT_FINGER_OFFSET_MULTIPLIER,
      12
    );
  }

  isTriggered.value = shouldTriggerBack(nextTranslation, activationDistance);

  if (
    onDragHaptic &&
    !dragHapticFired.value &&
    nextTranslation >= dragHapticDistance
  ) {
    dragHapticFired.value = true;
    runOnJS(onDragHaptic)();
  }
}

function createPanGesture(
  side: EdgeBackSide,
  isGestureEnabled: boolean,
  edgeWidth: number,
  anchorSize: number,
  maxDragDistance: number,
  activationDistance: number,
  dragHapticDistance: number,
  onBack: () => void,
  onDragHaptic: (() => void) | undefined,
  onReleaseHaptic: ((didTrigger: boolean) => void) | undefined,
  translateX: { value: number },
  isVisible: { value: number },
  isTriggered: { value: boolean },
  dragHapticFired: { value: boolean },
  activeEdge: { value: EdgeBackSide },
  anchorY: { value: number },
  touchX: { value: number },
  touchY: { value: number }
): PanGesture {
  const hitSlop =
    side === 'left'
      ? { left: 0, width: edgeWidth }
      : { right: 0, width: edgeWidth };
  const activeOffsetX: [number, number] =
    side === 'left' ? [12, 999] : [-999, -12];

  return Gesture.Pan()
    .enabled(isGestureEnabled)
    .hitSlop(hitSlop)
    .activeOffsetX(activeOffsetX)
    .failOffsetY([-14, 14])
    .onUpdate((event: PanGestureHandlerEventPayload) => {
      const translation =
        side === 'left' ? event.translationX : -event.translationX;

      applyDragUpdate(
        translation,
        event.x,
        event.y,
        side,
        anchorSize,
        maxDragDistance,
        activationDistance,
        dragHapticDistance,
        translateX,
        isVisible,
        isTriggered,
        dragHapticFired,
        activeEdge,
        anchorY,
        touchX,
        touchY,
        onDragHaptic
      );
    })
    .onEnd(() => {
      const didTrigger = shouldTriggerBack(
        translateX.value,
        activationDistance
      );

      if (onReleaseHaptic) {
        runOnJS(onReleaseHaptic)(didTrigger);
      }

      if (didTrigger) {
        runOnJS(onBack)();
      }

      resetGestureState(
        isVisible,
        translateX,
        isTriggered,
        dragHapticFired,
        anchorY,
        touchX,
        touchY
      );
    })
    .onFinalize(() => {
      if (translateX.value <= 0) {
        resetGestureState(
          isVisible,
          translateX,
          isTriggered,
          dragHapticFired,
          anchorY,
          touchX,
          touchY
        );
      }
    });
}

function getArrowGeometry(
  progress: number,
  size: number,
  side: EdgeBackSide
): {
  pivotX: number;
  outerX: number;
  topY: number;
  centerY: number;
  bottomY: number;
} {
  'worklet';

  const morph = clamp(progress, 0, 1);
  const input = [0, 0.16, 0.34, 0.56, 0.78, 1];
  const centerY = size * 0.5;
  const spreadY = interpolate(morph, input, [
    size * 0.235,
    size * 0.235,
    size * 0.228,
    size * 0.222,
    size * 0.228,
    size * 0.235,
  ]);
  const stemX = size * 0.5;
  const pivotX =
    side === 'left'
      ? interpolate(morph, input, [
          stemX,
          stemX,
          size * 0.53,
          size * 0.56,
          size * 0.61,
          size * 0.655,
          size * 0.685,
        ])
      : interpolate(morph, input, [
          stemX,
          stemX,
          size * 0.47,
          size * 0.44,
          size * 0.39,
          size * 0.345,
          size * 0.315,
        ]);
  const outerX =
    side === 'left'
      ? interpolate(morph, input, [
          stemX,
          stemX,
          size * 0.47,
          size * 0.43,
          size * 0.4,
          size * 0.38,
          size * 0.36,
        ])
      : interpolate(morph, input, [
          stemX,
          stemX,
          size * 0.53,
          size * 0.57,
          size * 0.6,
          size * 0.62,
          size * 0.64,
        ]);
  const topY = centerY - spreadY;
  const bottomY = centerY + spreadY;

  return {
    pivotX,
    outerX,
    topY,
    centerY,
    bottomY,
  };
}

export function useEdgeBackGesture(
  options: EdgeBackGestureOptions
): EdgeBackGestureHookResult {
  const {
    activationDistance = DEFAULT_ACTIVATION_DISTANCE,
    dragHapticDistance: customDragHapticDistance,
    edge = 'both',
    edgeWidth = DEFAULT_EDGE_WIDTH,
    enabled = true,
    enabledOnAndroid = false,
    maxDragDistance = DEFAULT_MAX_DRAG_DISTANCE,
    onBack,
    onDragHaptic,
    onReleaseHaptic,
    revealDistance = DEFAULT_REVEAL_DISTANCE,
  } = options;

  const isVisible = useSharedValue(0);
  const isTriggered = useSharedValue(false);
  const translateX = useSharedValue(0);
  const dragHapticFired = useSharedValue(false);
  const activeEdge = useSharedValue<EdgeBackSide>('left');
  const anchorY = useSharedValue(DEFAULT_ANCHOR_Y);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const isGestureEnabled =
    enabled && (Platform.OS === 'ios' || enabledOnAndroid);
  const dragHapticDistance = getDragHapticDistance(
    activationDistance,
    customDragHapticDistance
  );

  const progress = useDerivedValue(() =>
    getRevealProgress(translateX.value, revealDistance)
  );

  const leftGesture = createPanGesture(
    'left',
    isGestureEnabled && edge !== 'right',
    edgeWidth,
    options.anchorSize ?? DEFAULT_ANCHOR_SIZE,
    maxDragDistance,
    activationDistance,
    dragHapticDistance,
    onBack,
    onDragHaptic,
    onReleaseHaptic,
    translateX,
    isVisible,
    isTriggered,
    dragHapticFired,
    activeEdge,
    anchorY,
    touchX,
    touchY
  );

  const rightGesture = createPanGesture(
    'right',
    isGestureEnabled && edge !== 'left',
    edgeWidth,
    options.anchorSize ?? DEFAULT_ANCHOR_SIZE,
    maxDragDistance,
    activationDistance,
    dragHapticDistance,
    onBack,
    onDragHaptic,
    onReleaseHaptic,
    translateX,
    isVisible,
    isTriggered,
    dragHapticFired,
    activeEdge,
    anchorY,
    touchX,
    touchY
  );

  const gesture =
    edge === 'left'
      ? leftGesture
      : edge === 'right'
        ? rightGesture
        : Gesture.Race(leftGesture, rightGesture);

  return {
    gesture,
    progress,
    translateX,
    isVisible,
    isTriggered,
    activeEdge,
    anchorY,
    touchX,
    touchY,
  };
}

export function DefaultEdgeBackAnchor({
  activeEdge,
  anchorY: _anchorY,
  touchX: _touchX,
  touchY: _touchY,
  color,
  isTriggered,
  progress,
  side,
  size,
}: EdgeBackAnchorRenderProps) {
  const anchorStyle = useAnimatedStyle(() => {
    const opacity =
      activeEdge.value === side
        ? interpolate(progress.value, [0, 0.12, 1], [0, 0.72, 1])
        : 0;
    const scale = interpolate(
      progress.value,
      [0, 1],
      [1, isTriggered.value ? 1.04 : 1],
      Extrapolate.CLAMP
    );

    return {
      width: size * 0.92,
      height: size,
      opacity,
      transform: [{ scale }],
    };
  });

  const topLineProps = useAnimatedProps(() => {
    const strokeWidth = interpolate(progress.value, [0, 1], [2.2, 3]);
    const { centerY, outerX, pivotX, topY } = getArrowGeometry(
      progress.value,
      size,
      side
    );

    return {
      x1: pivotX,
      y1: centerY,
      x2: outerX,
      y2: topY,
      strokeWidth,
    };
  });

  const bottomLineProps = useAnimatedProps(() => {
    const strokeWidth = interpolate(progress.value, [0, 1], [2.2, 3]);
    const { bottomY, centerY, outerX, pivotX } = getArrowGeometry(
      progress.value,
      size,
      side
    );

    return {
      x1: pivotX,
      y1: centerY,
      x2: outerX,
      y2: bottomY,
      strokeWidth,
    };
  });

  return (
    <Animated.View style={[styles.anchorGlyph, anchorStyle]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        <AnimatedLine
          animatedProps={topLineProps}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <AnimatedLine
          animatedProps={bottomLineProps}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

export function EdgeBackGestureView({
  anchorBackgroundColor = '#111111',
  anchorColor = '#f8f8f5',
  anchorSize = DEFAULT_ANCHOR_SIZE,
  children,
  contentContainerStyle,
  contentEffect = 'none',
  contentScaleTo = DEFAULT_CONTENT_SCALE_TO,
  dimMaxOpacity = DEFAULT_DIM_MAX_OPACITY,
  renderAnchor,
  renderOverlay,
  style,
  ...options
}: EdgeBackGestureViewProps) {
  const {
    activeEdge,
    anchorY,
    gesture,
    isTriggered,
    isVisible,
    progress,
    touchX,
    touchY,
    translateX,
  } = useEdgeBackGesture(options);

  const leftAnchorStyle = useAnimatedStyle(() => ({
    opacity: activeEdge.value === 'left' ? isVisible.value : 0,
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [-anchorSize, 0]),
      },
    ],
  }));

  const rightAnchorStyle = useAnimatedStyle(() => ({
    opacity: activeEdge.value === 'right' ? isVisible.value : 0,
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [anchorSize, 0]),
      },
    ],
  }));

  const leftAnchorPositionStyle = useAnimatedStyle(() => ({
    top: anchorY.value,
  }));

  const rightAnchorPositionStyle = useAnimatedStyle(() => ({
    top: anchorY.value,
  }));

  const contentStyle = useAnimatedStyle(() => {
    if (contentEffect !== 'scale') {
      return {};
    }

    return {
      transform: [
        {
          scale: interpolate(progress.value, [0, 1], [1, contentScaleTo]),
        },
      ],
    };
  });

  const dimStyle = useAnimatedStyle(() => ({
    opacity:
      contentEffect === 'dim'
        ? interpolate(progress.value, [0, 1], [0, dimMaxOpacity])
        : 0,
  }));

  const leftAnchor = renderAnchor?.({
    activeEdge,
    anchorY,
    backgroundColor: anchorBackgroundColor,
    color: anchorColor,
    isTriggered,
    progress,
    side: 'left',
    size: anchorSize,
    touchX,
    touchY,
    translateX,
  }) ?? (
    <DefaultEdgeBackAnchor
      activeEdge={activeEdge}
      anchorY={anchorY}
      backgroundColor={anchorBackgroundColor}
      color={anchorColor}
      isTriggered={isTriggered}
      progress={progress}
      side="left"
      size={anchorSize}
      touchX={touchX}
      touchY={touchY}
      translateX={translateX}
    />
  );

  const rightAnchor = renderAnchor?.({
    activeEdge,
    anchorY,
    backgroundColor: anchorBackgroundColor,
    color: anchorColor,
    isTriggered,
    progress,
    side: 'right',
    size: anchorSize,
    touchX,
    touchY,
    translateX,
  }) ?? (
    <DefaultEdgeBackAnchor
      activeEdge={activeEdge}
      anchorY={anchorY}
      backgroundColor={anchorBackgroundColor}
      color={anchorColor}
      isTriggered={isTriggered}
      progress={progress}
      side="right"
      size={anchorSize}
      touchX={touchX}
      touchY={touchY}
      translateX={translateX}
    />
  );

  const overlay = renderOverlay?.({
    activeEdge,
    isVisible,
    progress,
    touchX,
    touchY,
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.root, style]}>
        <Animated.View
          style={[styles.content, contentContainerStyle, contentStyle]}
        >
          {children}
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[styles.dimOverlay, dimStyle]}
        />
        {overlay}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.anchorContainer,
            styles.leftAnchorContainer,
            {
              width: anchorSize * 1.48,
              height: anchorSize,
              marginTop: 0,
            },
            leftAnchorPositionStyle,
            leftAnchorStyle,
          ]}
        >
          {leftAnchor}
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.anchorContainer,
            styles.rightAnchorContainer,
            {
              width: anchorSize * 1.48,
              height: anchorSize,
              marginTop: 0,
            },
            rightAnchorPositionStyle,
            rightAnchorStyle,
          ]}
        >
          {rightAnchor}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  anchorContainer: {
    position: 'absolute',
  },
  leftAnchorContainer: {
    left: 12,
  },
  rightAnchorContainer: {
    right: 12,
  },
  anchorGlyph: {
    justifyContent: 'center',
  },
});
