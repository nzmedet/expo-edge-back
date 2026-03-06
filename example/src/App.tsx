import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  EdgeBackGestureView,
  type EdgeBackOverlayRenderProps,
} from 'expo-edge-back';

const screens = [
  {
    title: 'Inbox',
    eyebrow: 'Predictive edge back',
    body: 'Start dragging from the left edge. The anchor stays hidden until the gesture begins, then expands as you commit to the back action.',
    accent: '#ff6a3d',
  },
  {
    title: 'Order Details',
    eyebrow: 'Scroll remains intact',
    body: 'Vertical scrolling should remain usable even with the edge detector wrapping the content, because activation is limited to the edge and a horizontal drag.',
    accent: '#2f80ed',
  },
  {
    title: 'Audio Settings',
    eyebrow: 'Haptics fire later',
    body: 'The drag haptic does not trigger at touch start. It only fires after the pull travels far enough to feel intentional.',
    accent: '#0fa47a',
  },
];

const effects = ['none', 'dim', 'scale'] as const;

type Effect = (typeof effects)[number];

function RecordingTouchIndicator({
  isVisible,
  progress,
  touchX,
  touchY,
}: EdgeBackOverlayRenderProps) {
  const style = useAnimatedStyle(() => ({
    opacity: isVisible.value,
    transform: [
      { translateX: touchX.value - 14 },
      { translateY: touchY.value - 14 },
      { scale: interpolate(progress.value, [0, 1], [0.98, 1]) },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.touchIndicator, style]}>
      <View style={styles.touchDot} />
    </Animated.View>
  );
}

export default function App() {
  const [screenIndex, setScreenIndex] = useState(1);
  const [contentEffect, setContentEffect] = useState<Effect>('dim');

  const currentScreen = screens[screenIndex]!;
  const canGoBack = screenIndex > 0;
  const cards = Array.from({ length: 12 }, (_, index) => ({
    id: `${screenIndex}-${index}`,
    title: `Signal ${index + 1}`,
    body: `This row exists to prove the wrapper does not eat your normal vertical scroll interaction.`,
  }));

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
          <EdgeBackGestureView
            activationDistance={124}
            anchorBackgroundColor={currentScreen.accent}
            contentEffect={contentEffect}
            dimMaxOpacity={0.18}
            edgeWidth={28}
            enabled={canGoBack}
            onBack={() => {
              setScreenIndex((value) => Math.max(0, value - 1));
            }}
            onDragHaptic={() => {
              Haptics.selectionAsync().catch(() => undefined);
            }}
            onReleaseHaptic={(didTrigger) => {
              if (didTrigger) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                  () => undefined
                );
              }
            }}
            renderOverlay={(props) => <RecordingTouchIndicator {...props} />}
            revealDistance={88}
          >
            <View style={styles.background}>
              <View style={styles.hero}>
                <Text style={styles.eyebrow}>{currentScreen.eyebrow}</Text>
                <Text style={styles.title}>{currentScreen.title}</Text>
                <Text style={styles.body}>{currentScreen.body}</Text>
              </View>

              <View style={styles.controls}>
                {effects.map((effect) => {
                  const active = effect === contentEffect;

                  return (
                    <Pressable
                      key={effect}
                      onPress={() => setContentEffect(effect)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {effect}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() =>
                  setScreenIndex((value) =>
                    Math.min(screens.length - 1, value + 1)
                  )
                }
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {screenIndex === screens.length - 1
                    ? 'Stay on last screen'
                    : 'Push next screen'}
                </Text>
              </Pressable>

              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>History depth</Text>
                  <Text style={styles.statusValue}>{screenIndex}</Text>
                </View>

                {cards.map((card) => (
                  <View key={card.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardBody}>{card.body}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </EdgeBackGestureView>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1117',
  },
  background: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#0b1117',
  },
  hero: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  eyebrow: {
    color: '#8da0b3',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 10,
  },
  title: {
    color: '#f5f7fa',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 10,
  },
  body: {
    color: '#b5c0cb',
    fontSize: 16,
    lineHeight: 24,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 14,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipActive: {
    backgroundColor: '#f4f7fb',
    borderColor: '#f4f7fb',
  },
  chipText: {
    color: '#c7d1db',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#091018',
  },
  primaryButton: {
    marginBottom: 18,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f97316',
  },
  primaryButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 48,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusLabel: {
    color: '#93a6b8',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statusValue: {
    color: '#f7fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#121a23',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTitle: {
    color: '#f7fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardBody: {
    color: '#9eb0c1',
    fontSize: 14,
    lineHeight: 21,
  },
  touchIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchDot: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
