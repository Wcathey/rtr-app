// navigation/AssignmentsStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AssignmentsScreen from '../features/assignments/AssignmentsScreen';
import AssignmentDetailScreen from '../features/assignments/AssignmentDetailScreen';
import CustomHeader from '../components/CustomHeader';

const Stack = createNativeStackNavigator();

export default function AssignmentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AssignmentsMain"
        component={AssignmentsScreen}
        options={{ header: () => <CustomHeader title="Assignments" /> }}
      />
      <Stack.Screen
        name="AssignmentDetail"
        component={AssignmentDetailScreen}
        options={{ header: () => <CustomHeader title="Assignment Details" /> }}
      />
    </Stack.Navigator>
  );
}
