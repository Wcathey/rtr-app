import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../services/supabase';
import RequiredTextField from '../../components/RequiredTextField';
import { createLocation } from '../../features/locations/locationService';
import { createAssignment } from '../../features/assignments/assignmentService';

const PRICE_PER_BOX = 20;

export default function AssignmentFormScreen() {
  const [description, setDescription] = useState('');
  const [boxes, setBoxes] = useState('');
  const [address, setAddress] = useState('');
  const [optionalExt, setOptionalExt] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState(''); // renamed to avoid conflict with 'state'
  const [zipcode, setZipcode] = useState('');
  const [loading, setLoading] = useState(false);

  const estimatedPrice = boxes.trim()
    ? (parseInt(boxes, 10) * PRICE_PER_BOX).toFixed(2)
    : '0.00';

  async function handleCreate() {
    // Validate required fields for assignment and location
    if (!description.trim() || !boxes.trim() || !address.trim() || !city.trim() || !stateValue.trim() || !zipcode.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const newLocation = await createLocation({
        address,
        optional_address_ext: optionalExt,
        city,
        state: stateValue,
        zipcode,
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Unable to retrieve logged‑in user');

      await createAssignment({
        client_id: user.id,
        description,
        location_id: newLocation.id,
        base_price: parseFloat(estimatedPrice),
        // Optionally remove status if handled in createAssignment by default
        status: 'pending',
      });

      Alert.alert('Success', 'Assignment created successfully');
      // Reset the form fields
      setDescription('');
      setBoxes('');
      setAddress('');
      setOptionalExt('');
      setCity('');
      setStateValue('');
      setZipcode('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-4">New Assignment</Text>

      <RequiredTextField label="Description" value={description} onChange={setDescription} />

      <Text className="mb-1 font-semibold">Number of Boxes *</Text>
      <TextInput
        placeholder="Enter number of boxes"
        className="border border-gray-300 p-2 mb-2 rounded"
        keyboardType="numeric"
        value={boxes}
        onChangeText={setBoxes}
        onBlur={() => boxes.trim() === '' && setBoxes('')}
      />
      <Text className="mb-4 text-gray-700">Estimated Price: ${estimatedPrice}</Text>

      <TextInput
        placeholder="Street Address *"
        className="border border-gray-300 p-2 mb-4 rounded"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        placeholder="Unit / Apt (optional)"
        className="border border-gray-300 p-2 mb-4 rounded"
        value={optionalExt}
        onChangeText={setOptionalExt}
      />
      <TextInput
        placeholder="City *"
        className="border border-gray-300 p-2 mb-4 rounded"
        value={city}
        onChangeText={setCity}
      />
      <TextInput
        placeholder="State *"
        className="border border-gray-300 p-2 mb-4 rounded"
        value={stateValue}
        onChangeText={setStateValue}
      />
      <TextInput
        placeholder="Zipcode *"
        className="border border-gray-300 p-2 mb-4 rounded"
        keyboardType="numeric"
        value={zipcode}
        onChangeText={setZipcode}
      />

      <Pressable
        onPress={handleCreate}
        disabled={loading || !description.trim() || !boxes.trim()}
        className={`py-3 rounded mt-4 ${
          loading || !description.trim() || !boxes.trim() ? 'bg-gray-400' : 'bg-blue-500'
        }`}
      >
        <Text className="text-white text-center">{loading ? 'Creating…' : 'Create Assignment'}</Text>
      </Pressable>
    </View>
  );
}
