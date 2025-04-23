// navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomHeader from '../components/CustomHeader';

import LoginScreen from '../features/auth/LoginScreen';
import PreserverApplicationScreen from '../features/auth/PreserverApplicationScreen';
import PendingApprovalScreen from '../features/auth/PendingApprovalScreen';
import MainTabsWithLoading from './MainTabsWithLoading';
import AssignmentFormScreen from '../features/assignments/AssignmentFormScreen';
// ❌ Remove this line since AssignmentDetail is now inside the tab stack
// import AssignmentDetailScreen from '../features/assignments/AssignmentDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator({ initialRouteName }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />

      <Stack.Screen
        name="PreserverApplication"
        component={PreserverApplicationScreen}
      />

      <Stack.Screen
        name="PendingApproval"
        component={PendingApprovalScreen}
      />

      <Stack.Screen
        name="MainTabs"
        component={MainTabsWithLoading}
      />

      <Stack.Screen
        name="AssignmentForm"
        component={AssignmentFormScreen}
        options={{
          headerShown: true,
          header: () => <CustomHeader title="New Assignment" />,
        }}
      />
    </Stack.Navigator>
  );
}
