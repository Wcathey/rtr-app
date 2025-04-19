// features/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loginUser } from '../../features/auth/authService';
import { supabase } from '../../services/supabase';

export default function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigation = useNavigation();

  async function handleLogin() {
    setLoading(true);
    try {
      // 1) Sign in
      const { user, session, message } = await loginUser({ email, password });
      Alert.alert('Success', message);

      // 2) Check clearance
      const { data: preserver, error } = await supabase
        .from('preservers')
        .select('clearance')
        .eq('id', user.id)
        .single();
      if (error) throw error;

      // 3) Reset into the correct initial route
      navigation.reset({
        index: 0,
        routes: [
          {
            name: preserver.clearance
              ? 'MainTabs'
              : 'PendingApproval'
          }
        ]
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Login Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 justify-center p-5 bg-white">
      {/* App Title */}
      <Text className="text-4xl font-bold text-center mb-20 text-gray-700">
        Records to Remember
      </Text>

      {/* Email / Password */}
      <TextInput
        placeholder="Email"
        className="border border-gray-300 rounded p-3 mb-3 text-base"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        className="border border-gray-300 rounded p-3 mb-3 text-base"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#1e3a8a" />
      ) : (
        <>
          <Pressable
            onPress={handleLogin}
            className="bg-blue-900 py-3 rounded mb-3"
          >
            <Text className="text-white text-center text-lg font-semibold">
              Login
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('PreserverApplication')}
            className="bg-blue-900 py-3 rounded"
          >
            <Text className="text-white text-center text-lg font-semibold">
              Become a Preserver
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
