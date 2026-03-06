import type { PropsWithChildren, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import type { GestureType, PanGesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

export type EdgeBackContentEffect = 'none' | 'dim' | 'scale';
export type EdgeBackSide = 'left' | 'right';
export type EdgeBackEdges = EdgeBackSide | 'both';

export type EdgeBackAnchorRenderProps = {
  progress: SharedValue<number>;
  translateX: SharedValue<number>;
  isTriggered: SharedValue<boolean>;
  activeEdge: SharedValue<EdgeBackSide>;
  anchorY: SharedValue<number>;
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  side: EdgeBackSide;
  size: number;
  color: string;
  backgroundColor: string;
};

export type EdgeBackOverlayRenderProps = {
  activeEdge: SharedValue<EdgeBackSide>;
  isVisible: SharedValue<number>;
  progress: SharedValue<number>;
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
};

export type EdgeBackGestureOptions = {
  enabled?: boolean;
  enabledOnAndroid?: boolean;
  edge?: EdgeBackEdges;
  edgeWidth?: number;
  revealDistance?: number;
  activationDistance?: number;
  dragHapticDistance?: number;
  maxDragDistance?: number;
  anchorSize?: number;
  anchorColor?: string;
  anchorBackgroundColor?: string;
  contentEffect?: EdgeBackContentEffect;
  contentScaleTo?: number;
  dimMaxOpacity?: number;
  onBack: () => void;
  onDragHaptic?: () => void;
  onReleaseHaptic?: (didTrigger: boolean) => void;
  renderAnchor?: (props: EdgeBackAnchorRenderProps) => ReactNode;
  renderOverlay?: (props: EdgeBackOverlayRenderProps) => ReactNode;
};

export type EdgeBackGestureViewProps = PropsWithChildren<
  EdgeBackGestureOptions & {
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
  }
>;

export type EdgeBackGestureHookResult = {
  gesture: GestureType | PanGesture | ReturnType<typeof Gesture.Race>;
  progress: SharedValue<number>;
  translateX: SharedValue<number>;
  isVisible: SharedValue<number>;
  isTriggered: SharedValue<boolean>;
  activeEdge: SharedValue<EdgeBackSide>;
  anchorY: SharedValue<number>;
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
};
