// features/settings/SettingsScreen.js
import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const systemScheme = useColorScheme(); // respect device default
  const [darkMode, setDarkMode] = useState(systemScheme === 'dark');
  const nav = useNavigation();

  // dynamically set header style to match theme
  useLayoutEffect(() => {
    nav.setOptions({
      headerStyle: {
        backgroundColor: darkMode ? '#000433' : '#000433',
      },
      headerTintColor: '#fff',
    });
  }, [darkMode]);

  const theme = {
    background: darkMode ? '#1E1E1E' : '#F3F4F6',
    card: darkMode ? '#2A2A2A' : '#FFFFFF',
    text: darkMode ? '#FFFFFF' : '#111827',
    section: darkMode ? '#C5C5C5' : '#374151',
    link: '#3B82F6',
    border: '#E5E7EB',
    logout: '#EF4444',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: theme.section }]}>Appearance</Text>
        <View style={[styles.row, { borderBottomColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.text }]}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            thumbColor={darkMode ? '#3B82F6' : '#f4f3f4'}
            trackColor={{ false: '#ccc', true: '#bbd4fc' }}
          />
        </View>

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: theme.section }]}>Account</Text>
        {['Profile Settings', 'Change Password', 'Linked Accounts'].map(label => (
          <TouchableOpacity
            key={label}
            style={[styles.linkRow, { borderBottomColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            <Text style={[styles.linkLabel, { color: theme.link }]}>{label}</Text>
          </TouchableOpacity>
        ))}

        {/* Map Settings */}
        <Text style={[styles.sectionTitle, { color: theme.section }]}>Map Settings</Text>
        {['Default Map Style', 'Units (Miles / Km)', 'Traffic Layer'].map(label => (
          <TouchableOpacity
            key={label}
            style={[styles.linkRow, { borderBottomColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            <Text style={[styles.linkLabel, { color: theme.link }]}>{label}</Text>
          </TouchableOpacity>
        ))}

        {/* Help & Support */}
        <Text style={[styles.sectionTitle, { color: theme.section }]}>Help & Support</Text>
        {['FAQ', 'Send Feedback', 'Privacy Policy'].map(label => (
          <TouchableOpacity
            key={label}
            style={[styles.linkRow, { borderBottomColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => {}}
          >
            <Text style={[styles.linkLabel, { color: theme.link }]}>{label}</Text>
          </TouchableOpacity>
        ))}

        {/* About */}
        <Text style={[styles.sectionTitle, { color: theme.section }]}>About</Text>
        <View style={[styles.row, { borderBottomColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.text }]}>App Version</Text>
          <Text style={[styles.value, { color: theme.text }]}>1.0.0</Text>
        </View>
        <View style={[styles.row, { borderBottomColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.text }]}>Build Number</Text>
          <Text style={[styles.value, { color: theme.text }]}>100</Text>
        </View>

        {/* Log Out */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.logout }]}
          onPress={() => {}}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    marginTop: 24,
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
  },
  linkRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 32,
    marginHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
