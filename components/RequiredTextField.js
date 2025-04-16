import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';

export default function RequiredTextField({ label, value, onChange, errorMessage = "This field is required" }) {
  const [touched, setTouched] = useState(false);
  const isError = touched && value.trim() === '';

  return (
    <View className="mb-4">
      <Text className="mb-1 font-semibold">{label} *</Text>
      <TextInput
        className={`border p-2 rounded ${isError ? 'border-red-500' : 'border-gray-300'}`}
        placeholder={label}
        value={value}
        onChangeText={text => {
          onChange(text);
          if (isError) setTouched(false);
        }}
        onBlur={() => setTouched(true)}
        accessible
        accessibilityLabel={label}
      />
      {isError && <Text className="text-red-500 mt-1">{errorMessage}</Text>}
    </View>
  );
}
