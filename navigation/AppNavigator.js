import React, { useState, useEffect, useRef } from 'react';
import { View, InteractionManager } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import CustomHeader from '../components/CustomHeader';
import { supabase } from '../services/supabase';

// Screens
import LoginScreen from '../features/auth/LoginScreen';
import MapScreen from '../features/map/MapScreen';
import AssignmentsScreen from '../features/assignments/AssignmentsScreen';
import AssignmentFormScreen from '../features/assignments/AssignmentFormScreen';
import SettingsScreen from '../features/settings/SettingsScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import LoadingScreen from '../components/LoadingScreen';
import PreserverApplicationScreen from '../features/auth/PreserverApplicationScreen';
import PendingApprovalScreen from '../features/auth/PendingApprovalScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function PreserverTabs({ clearance }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000433',
          borderTopWidth: 0,
          position: 'absolute',
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#aaa',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Assignments':
              iconName = focused ? 'clipboard' : 'clipboard-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {clearance ? (
        <>
          <Tab.Screen
            name="Map"
            component={MapScreen}
            options={{ header: () => <CustomHeader title="Find A Preserver" /> }}
          />
          <Tab.Screen
            name="Assignments"
            component={AssignmentsScreen}
            options={{ header: () => <CustomHeader title="Assignments" /> }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ header: () => <CustomHeader title="Settings" /> }}
          />
        </>
      ) : null}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ header: () => <CustomHeader title="Profile" /> }}
      />
    </Tab.Navigator>
  );
}

function MainTabsWithLoading() {
  const [loadingDone, setLoadingDone] = useState(false);
  const [readyToRenderTabs, setReadyToRenderTabs] = useState(false);
  const [clearance, setClearance] = useState(false);
  const hasTriggered = useRef(false);

  // 🔒 Check clearance status from Supabase
  useEffect(() => {
    const fetchClearance = async () => {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user?.id) return;

      const { data: preserver, error: preserverError } = await supabase
        .from('preservers')
        .select('clearance')
        .eq('id', userData.user.id)
        .single();

      if (!preserverError && preserver?.clearance === true) {
        setClearance(true);
      } else {
        setClearance(false);
      }
    };

    fetchClearance();
  }, []);

  // ✅ Wait for animation and interaction to complete before rendering tabs
  useEffect(() => {
    if (loadingDone && !hasTriggered.current) {
      hasTriggered.current = true;
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          setReadyToRenderTabs(true);
        }, 100);
      });
    }
  }, [loadingDone]);

  return (
    <View style={{ flex: 1 }}>
      {readyToRenderTabs ? (
        <PreserverTabs clearance={clearance} />
      ) : (
        <LoadingScreen onComplete={() => setLoadingDone(true)} />
      )}
    </View>
  );
}

export default function AppNavigator({ initialRouteName }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          header: () => <CustomHeader title="Login" />,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PreserverApplication"
        component={PreserverApplicationScreen}
        options={{
          header: () => <CustomHeader title="Preserver Application" />,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PendingApproval"
        component={PendingApprovalScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabsWithLoading}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AssignmentForm"
        component={AssignmentFormScreen}
        options={{
          header: () => <CustomHeader title="New Assignment" />,
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}
