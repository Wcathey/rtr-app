import React, { useState } from 'react';
import {
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerUser } from '../../features/auth/authService';
import { createLocation } from '../../features/locations/locationService';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';

export default function PreserverApplicationScreen() {
  const navigation = useNavigation();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    address: '',
    optionalAddressExt: '',
    city: '',
    state: '',
    zipcode: '',
    experience: '',
    reason: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      confirmPassword,
      address,
      city,
      state,
      zipcode,
      experience,
      reason,
    } = form;

    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword ||
        !address || !city || !state || !zipcode || !experience || !reason) {
      Alert.alert('Missing Fields', 'Please fill out all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      // 1. Create the user in auth + users table
      const { user } = await registerUser({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
      });

      // 2. Create location and link to user
      const location = await createLocation({
        address: form.address,
        optional_address_ext: form.optionalAddressExt,
        city: form.city,
        state: form.state,
        zipcode: form.zipcode,
      });

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ location_id: location.id })
        .eq('id', user.id);

      if (userUpdateError) {
        throw new Error(userUpdateError.message);
      }

      // 3. Create preserver entry
      const { error: preserverInsertError } = await supabase.from('preservers').insert([{
        id: user.id,
        clearance: false,
      }]);

      if (preserverInsertError) {
        throw new Error(preserverInsertError.message);
      }

      // 4. Fetch preserver to confirm
      const { data: preserver, error: preserverFetchError } = await supabase
        .from('preservers')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!preserver || preserverFetchError) {
        throw new Error('Could not retrieve preserver record.');
      }

      // 5. Create application entry
      const { error: applicationError } = await supabase.from('applications').insert([{
        preserver_id: preserver.id,
        experience: form.experience,
        reason: form.reason,
        status: 'pending',
      }]);

      if (applicationError) {
        throw new Error(applicationError.message);
      }

      // 6. Navigate to pending approval screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'PendingApproval' }],
      });

    } catch (err) {
      console.error('❌ Application error:', err);
      Alert.alert('Error', err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-center mb-5 text-blue-900">
          Become a Preserver
        </Text>

        {[
          { label: 'First Name', key: 'firstName' },
          { label: 'Last Name', key: 'lastName' },
          { label: 'Email', key: 'email', keyboard: 'email-address' },
          { label: 'Phone Number', key: 'phoneNumber', keyboard: 'phone-pad' },
          { label: 'Password', key: 'password', secure: true },
          { label: 'Confirm Password', key: 'confirmPassword', secure: true },
          { label: 'Address', key: 'address' },
          { label: 'Extension (Apt, Unit, etc)', key: 'optionalAddressExt', optional: true },
          { label: 'City', key: 'city' },
          { label: 'State', key: 'state' },
          { label: 'Zipcode', key: 'zipcode', keyboard: 'numeric' },
          { label: 'Experience', key: 'experience', multiline: true },
          { label: 'Why do you want to be a preserver?', key: 'reason', multiline: true },
        ].map(({ label, key, keyboard, secure, optional, multiline }) => (
          <TextInput
            key={key}
            placeholder={`${label}${optional ? ' (Optional)' : ''}`}
            value={form[key]}
            onChangeText={(value) => handleChange(key, value)}
            secureTextEntry={secure}
            keyboardType={keyboard || 'default'}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            className="border border-gray-300 rounded p-3 text-base mb-4"
          />
        ))}

        {loading ? (
          <ActivityIndicator size="large" color="#1e3a8a" />
        ) : (
          <Pressable onPress={handleSubmit} className="bg-blue-900 py-3 rounded">
            <Text className="text-white text-center text-lg font-semibold">
              Submit Application
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
