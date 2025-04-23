// navigation/PreserverTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons }                 from '@expo/vector-icons';
import CustomHeader                 from '../components/CustomHeader';
import AssignmentsStack from './AssignmentsStack';
import MapScreen         from '../features/map/MapScreen';
import EarningsScreen    from '../features/earnings/EarningsScreen';
import SettingsScreen    from '../features/settings/SettingsScreen';
import ProfileScreen     from '../features/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function PreserverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: { backgroundColor: '#000433', borderTopWidth: 0 },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#aaa',
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          switch (route.name) {
            case 'Map':         icon = focused ? 'map'         : 'map-outline';       break;
            case 'Assignments': icon = focused ? 'clipboard'   : 'clipboard-outline'; break;
            case 'Earnings':    icon = focused ? 'cash'        : 'cash-outline';      break;
            case 'Settings':    icon = focused ? 'settings'    : 'settings-outline';  break;
            case 'Profile':     icon = focused ? 'person'      : 'person-outline';    break;
          }
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ headerShown: false }}
      />
       <Tab.Screen
        name="Assignments"
        component={AssignmentsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ header: () => <CustomHeader title="Earnings" /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ header: () => <CustomHeader title="Settings" /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
