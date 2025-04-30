// components/LoadingScreen.js

import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
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
  // Shared values for each piece
  const boxDrop     = useSharedValue(-100);
  const paper1Drop  = useSharedValue(-80);
  const paper2Drop  = useSharedValue(-80);
  const paper3Drop  = useSharedValue(-80);
  const textOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    // 1️⃣ Drop the box
    boxDrop.value = withTiming(0, {
      duration: 800,
      easing: Easing.bounce,
    });

    // 2️⃣ Stagger the pages
    paper1Drop.value = withDelay(
      1000,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
    );
    paper2Drop.value = withDelay(
      1400,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
    );
    paper3Drop.value = withDelay(
      1800,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
    );

    // 3️⃣ Fade in the title
    textOpacity.value = withDelay(
      2400,
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
    );

    // 4️⃣ After everything is visible, fade out the entire screen
    screenOpacity.value = withDelay(
      3200,
      withTiming(
        0,
        { duration: 500, easing: Easing.inOut(Easing.ease) },
        (finished) => {
          if (finished) {
            // once fade-out completes, call onComplete on the JS thread
            runOnJS(onComplete)();
          }
        }
      )
    );
  }, []);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));
  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: boxDrop.value }],
  }));
  const paperStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: paper1Drop.value }],
  }));
  const paperStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: paper2Drop.value }],
  }));
  const paperStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: paper3Drop.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  // Layout constants
  const BOX_WIDTH   = SCREEN_WIDTH * 0.5;
  const PAPER_WIDTH = BOX_WIDTH * 0.85;
  const FONT_WIDTH  = SCREEN_WIDTH * 0.9;

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
