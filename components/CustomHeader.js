import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CustomHeader({ title }) {
  const navigation = useNavigation();
  const route = useRoute();

  const noBackOn = ['AssignmentsMain', 'Map', 'Earnings', 'Settings', 'Profile'];
  const showBackButton = !noBackOn.includes(route.name);

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <View style={styles.row}>
          {showBackButton && (
            <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;
const HEADER_HEIGHT = 56; // visible height of header excluding status bar

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#000433',
    paddingTop: STATUS_BAR_HEIGHT, // adds space for Android status bar
  },
  inner: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomColor: '#1a1a1a',
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
});
