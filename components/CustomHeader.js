import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';

export default function CustomHeader({ title }) {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1e3a8a',
    borderBottomWidth: Platform.OS === 'ios' ? 0 : 1,
    borderBottomColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  headerText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'left',
  },
});
