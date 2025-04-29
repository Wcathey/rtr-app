// navigation/MapStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MapScreen from '../features/map/MapScreen';
import StartedAssignmentScreen from '../features/assignments/StartedAssignmentScreen';

const Stack = createNativeStackNavigator();

export default function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapMain" component={MapScreen} />
      <Stack.Screen
        name="StartedAssignment"
        component={StartedAssignmentScreen}
        options={{ headerShown: true, title: 'Your Assignment' }}
      />
    </Stack.Navigator>
  );
}
