import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './services/supabase';
import AppNavigator from './navigation/AppNavigator';
import "./global.css";

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🔍 Checking auth session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Session error:', sessionError);
        }

        if (!session || !session.user) {
          console.log('🚪 No active session. Routing to Login.');
          setInitialRoute('Login');
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user?.id) {
          console.warn('⚠️ Invalid or missing user. Logging out.');
          await supabase.auth.signOut();
          setInitialRoute('Login');
          return;
        }

        console.log(`✅ User authenticated: ${userData.user.id}`);
        setInitialRoute('MainTabs');

      } catch (err) {
        console.error('💥 Unexpected initialization error:', err);
        await supabase.auth.signOut();
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
  placeholder: {
    flex: 1,
    backgroundColor: '#0a1a2f',
  },
});
