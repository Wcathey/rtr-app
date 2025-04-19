// App.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet }               from 'react-native';
import { NavigationContainer }            from '@react-navigation/native';
import { SafeAreaProvider }               from 'react-native-safe-area-context';
import { supabase }                       from './services/supabase';
import AppNavigator                       from './navigation/AppNavigator';
import "./global.css";

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Init] session:', !!session);
        if (!session) {
          setInitialRoute('Login');
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        console.log('[Init] user id:', user?.id);
        if (!user) {
          await supabase.auth.signOut();
          setInitialRoute('Login');
          return;
        }

        const { data: application } = await supabase
          .from('applications')
          .select('status')
          .eq('preserver_id', user.id)
          .maybeSingle();
        console.log('[Init] application:', application);
        if (!application) {
          setInitialRoute('PreserverApplication');
          return;
        }
        if (application.status !== 'approved') {
          setInitialRoute('PendingApproval');
          return;
        }

        const { data: preserver } = await supabase
          .from('preservers')
          .select('clearance')
          .eq('id', user.id)
          .maybeSingle();
        console.log('[Init] preserver.clearance:', preserver?.clearance);
        setInitialRoute(
          preserver?.clearance === true
            ? 'MainTabs'
            : 'PendingApproval'
        );
      } catch (err) {
        console.error('Init error:', err);
        setInitialRoute('Login');
      }
    };

    initialize();
  }, []);

  if (!initialRoute) {
    return <View style={styles.placeholder} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator initialRouteName={initialRoute} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, backgroundColor: '#0a1a2f' },
});
