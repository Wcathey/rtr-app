// features/auth/PendingApprovalScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase }     from '../../services/supabase';

export default function PendingApprovalScreen({ navigation }) {
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef(null);

  const checkApproval = async () => {
    try {
      setChecking(true);

      const {
        data: { user },
        error: uErr,
      } = await supabase.auth.getUser();
      if (uErr || !user) throw uErr || new Error('Not authenticated');

      const { data: pres, error: pErr } = await supabase
        .from('preservers')
        .select('clearance')
        .eq('id', user.id)
        .maybeSingle();

      const { data: app, error: aErr } = await supabase
        .from('applications')
        .select('status')
        .eq('preserver_id', user.id)
        .maybeSingle();

      console.log(
        '[Poll] clearance=', pres?.clearance,
        'status=', app?.status,
        'pErr?', pErr?.message,
        'aErr?', aErr?.message
      );

      if (pres?.clearance === true && app?.status === 'approved') {
        clearInterval(intervalRef.current);
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (err) {
      console.warn('Approval check error:', err.message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkApproval();
    intervalRef.current = setInterval(checkApproval, 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Pending Approval</Text>
        <Text style={styles.subtitle}>
          Your application is under review. You’ll gain access once approved.
        </Text>

        {checking && (
          <ActivityIndicator
            style={{ marginVertical: 20 }}
            size="large"
            color="#10B981"
          />
        )}

        <Pressable
          style={styles.button}
          onPress={async () => {
            try {
              await checkApproval();
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }}
        >
          <Text style={styles.buttonText}>Refresh Status</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1a2f',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  inner: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1e3a8a',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
