import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoadingScreen({ onComplete }) {
  const boxDrop = useSharedValue(-100);
  const paperDrop1 = useSharedValue(-80);
  const paperDrop2 = useSharedValue(-80);
  const paperDrop3 = useSharedValue(-80);
  const textOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    boxDrop.value = withTiming(0, { duration: 800, easing: Easing.bounce });

    paperDrop1.value = withDelay(1000, withTiming(0, { duration: 400 }));
    paperDrop2.value = withDelay(1400, withTiming(0, { duration: 400 }));
    paperDrop3.value = withDelay(1800, withTiming(0, { duration: 400 }));

    textOpacity.value = withDelay(2400, withTiming(1, { duration: 600 }));

    // TEMP: Remove animated fade-out and directly complete after 4s
    runOnJS(() => {
      setTimeout(() => {
        console.log('✅ Manual fallback → calling onComplete()');
        onComplete?.();
      }, 4000);
    })();
  }, []);



  const containerStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: boxDrop.value }],
  }));

  const paperStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: paperDrop1.value }],
  }));

  const paperStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: paperDrop2.value }],
  }));

  const paperStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: paperDrop3.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const BOX_WIDTH = SCREEN_WIDTH * 0.5;
  const PAPER_WIDTH = BOX_WIDTH * 0.85;
  const FONT_WIDTH = SCREEN_WIDTH * 0.9;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.Text
        style={[
          styles.title,
          textStyle,
          { maxWidth: FONT_WIDTH, fontSize: 28, textAlign: 'center' },
        ]}
      >
        Records To Remember
      </Animated.Text>

      <Animated.View
        style={[
          styles.box,
          boxStyle,
          { width: BOX_WIDTH, height: BOX_WIDTH * 0.6 },
        ]}
      >
        <Animated.View
          style={[styles.paper, paperStyle1, { width: PAPER_WIDTH }]}
        />
        <Animated.View
          style={[styles.paper, paperStyle2, { width: PAPER_WIDTH }]}
        />
        <Animated.View
          style={[styles.paper, paperStyle3, { width: PAPER_WIDTH }]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a1a2f',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 40,
    fontSize: 60,
  },
  box: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 10,
  },
  paper: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 6,
  },
});
