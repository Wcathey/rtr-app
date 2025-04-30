// navigation/MapStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MapScreen from '../features/map/MapScreen';
import StartedAssignmentScreen from '../features/assignments/StartedAssignmentScreen';
import ScannerScreen from '../features/scanner/ScannerScreen';
import ScanReviewScreen from '../features/scanner/ScanReviewScreen';

const Stack = createNativeStackNavigator();

export default function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapMain"       component={MapScreen} />
      <Stack.Screen
        name="StartedAssignment"
        component={StartedAssignmentScreen}
      />
      <Stack.Screen
        name="DocumentScanner"
        component={ScannerScreen}
      />
      <Stack.Screen
        name="ScanReview"
        component={ScanReviewScreen}
        options={{ headerShown: true, title: 'Review Scans' }}
      />
    </Stack.Navigator>
  );
}
