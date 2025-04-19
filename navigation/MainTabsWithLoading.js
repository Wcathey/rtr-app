// navigation/MainTabsWithLoading.js
import React, { useState, useRef, useEffect } from 'react';
import { View, InteractionManager }            from 'react-native';
import LoadingScreen                           from '../components/LoadingScreen';
import PreserverTabs                           from './PreserverTabs';

export default function MainTabsWithLoading() {
  const [ready, setReady] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (!ready && !triggered.current) {
      triggered.current = true;
      InteractionManager.runAfterInteractions(() =>
        setTimeout(() => setReady(true), 100)
      );
    }
  }, [ready]);

  return ready
    ? <PreserverTabs />
    : <LoadingScreen onComplete={() => setReady(true)} />;
}
