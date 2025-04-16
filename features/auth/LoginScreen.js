import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loginUser } from '../../features/auth/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const validate = () => {
    let newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required.';
    if (!password.trim()) newErrors.password = 'Password is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleLogin() {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await loginUser({ email, password });

      Alert.alert("✅ Success", result.message, [
        {
          text: 'Continue',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View className="flex-1 justify-center p-5" style={{ opacity: fadeAnim }}>
        <Text className="text-3xl font-bold text-center mb-16 text-gray-800">
          Records to Remember
        </Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          className="border border-gray-300 rounded p-3 mb-2 text-base"
        />
        {errors.email && (
          <Text className="text-red-500 text-sm mb-2">{errors.email}</Text>
        )}

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          className="border border-gray-300 rounded p-3 mb-2 text-base"
        />
        {errors.password && (
          <Text className="text-red-500 text-sm mb-2">{errors.password}</Text>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#1e3a8a" className="mt-4" />
        ) : (
          <>
            <Pressable
              onPress={handleLogin}
              className="bg-blue-900 py-3 rounded mb-3 mt-3"
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
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
