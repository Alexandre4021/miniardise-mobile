import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

import { LOGO } from '@/theme/assets';
import { BRAND_NAME } from '@/theme/brand';
import { colors, spacing } from '@/theme/tokens';

/**
 * Écran d'ouverture animé : logo (fondu + léger zoom), nom (glissé), filet or, puis fondu
 * vers l'accueil, qui se charge pendant ce temps. ~2,2 s ; version courte sans mouvement si
 * « Réduire les animations » est activé. Animations sur le fil natif (useNativeDriver).
 */
export function LaunchAnimation({ onReady, onDone }: { onReady: () => void; onDone: () => void }) {
  const [logo] = useState(() => new Animated.Value(0));
  const [name] = useState(() => new Animated.Value(0));
  const [line] = useState(() => new Animated.Value(0));
  const [out] = useState(() => new Animated.Value(1));
  const [reduce, setReduce] = useState<boolean | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduce)
      .catch(() => setReduce(false));
  }, []);

  useEffect(() => {
    if (reduce === null) return;
    const ease = Easing.out(Easing.cubic);
    const t = (v: Animated.Value, duration: number, delay = 0) =>
      Animated.timing(v, { toValue: 1, duration, delay, easing: ease, useNativeDriver: true });
    const seq = reduce
      ? Animated.sequence([
          Animated.parallel([t(logo, 250), t(name, 250), t(line, 250)]),
          Animated.delay(500),
          Animated.timing(out, { toValue: 0, duration: 250, useNativeDriver: true }),
        ])
      : Animated.sequence([
          t(logo, 700),
          Animated.parallel([t(name, 550), t(line, 650, 150)]),
          Animated.delay(550),
          Animated.timing(out, { toValue: 0, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]);
    seq.start(({ finished }) => finished && onDone());
    return () => seq.stop();
  }, [reduce, logo, name, line, out, onDone]);

  const scale = reduce ? 1 : logo.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const nameY = reduce ? 0 : name.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, { opacity: out }]}
      onLayout={onReady}
      accessible
      accessibilityLabel={`${BRAND_NAME}, chargement`}
      pointerEvents="none">
      <LinearGradient colors={['#FFFAF0', '#F8EED6', '#F1E2BD']} start={{ x: 0.8, y: 0 }} end={{ x: 0.2, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Animated.Image source={LOGO} resizeMode="contain" style={[styles.logo, { opacity: logo, transform: [{ scale }] }]} />
        <Animated.Text style={[styles.name, { opacity: name, transform: [{ translateY: nameY }] }]}>{BRAND_NAME}</Animated.Text>
        <Animated.View style={[styles.line, { opacity: line, transform: [{ scaleX: line }] }]} />
        <Animated.Text style={[styles.tagline, { opacity: name }]}>Fruits secs premium</Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 1000, elevation: 1000, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  logo: { width: 168, height: 168 },
  name: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.goldText, textAlign: 'center', letterSpacing: 0.3 },
  line: { width: 120, height: 2, borderRadius: 1, backgroundColor: colors.gold },
  tagline: { fontSize: 13, letterSpacing: 2.5, color: colors.muted, textTransform: 'uppercase' },
});
