// features/assignments/StartedAssignmentScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAssignmentById } from './assignmentService';

export default function StartedAssignmentScreen({ route, navigation }) {
  const assignmentId = route.params?.assignmentId;
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const asn = await getAssignmentById(assignmentId);
        setAssignment(asn);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Could not load assignment details.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [assignmentId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }
  if (!assignment) return null;

  const {
    description,
    start_time,
    end_time,
    location: {
      address,
      optional_address_ext,
      city,
      state,
      zipcode,
    } = {},
    client: { first_name, last_name, phone_number } = {},
  } = assignment;

  const fullAddress = [
    address,
    optional_address_ext,
    city,
    state,
    zipcode,
  ]
    .filter(Boolean)
    .join(', ');

  const dialCall = () => {
    const url = `tel:${phone_number}`;
    Linking.canOpenURL(url).then(supported =>
      supported
        ? Linking.openURL(url)
        : Alert.alert('Error', 'Phone calls are not supported on this device.')
    );
  };

  const sendSMS = () => {
    const url = `sms:${phone_number}`;
    Linking.canOpenURL(url).then(supported =>
      supported
        ? Linking.openURL(url)
        : Alert.alert('Error', 'SMS is not supported on this device.')
    );
  };

  const openContactOptions = () => {
    const options = ['Call', 'Text', 'Cancel'];
    const cancelIndex = 2;

    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: cancelIndex },
      idx => {
        if (idx === 0) dialCall();
        else if (idx === 1) sendSMS();
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Assignment Details</Text>
        <TouchableOpacity onPress={openContactOptions} style={styles.phoneBtn}>
          <Ionicons name="call-outline" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Client */}
      <View style={styles.section}>
        <Text style={styles.label}>Client</Text>
        <Text style={styles.value}>{first_name} {last_name}</Text>
      </View>

      {/* When */}
      <View style={styles.section}>
        <Text style={styles.label}>When</Text>
        <Text style={styles.value}>
          {new Date(start_time).toLocaleString()} – {' '}
          {new Date(end_time).toLocaleTimeString()}
        </Text>
      </View>

      {/* Address */}
      <View style={styles.section}>
        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{fullAddress}</Text>
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.label}>Client Notes</Text>
        <Text style={styles.value}>{description}</Text>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.label}>Instructions</Text>
        <Text style={styles.value}>
          Please meet the client for debrief and estimate of total boxes to be scanned.
        </Text>
        <Text style={styles.value}>
          If unable to locate the address or client is unavailable, contact them above.
        </Text>
        <Text style={styles.value}>
          Ensure your phone is charged; portable charger recommended.
        </Text>
      </View>

      {/* Scan Documents */}
      <TouchableOpacity
        style={styles.scanBtn}
        onPress={() =>
          navigation.navigate('DocumentScanner', { assignmentId })
        }
      >
        <Text style={styles.scanText}>Scan Documents</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, padding: 16, backgroundColor: '#fff' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerRow:   {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  title:       { fontSize: 20, fontWeight: '700', color: '#000433' },
  phoneBtn:    { padding: 8 },

  section:     { marginBottom: 20 },
  label:       {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6
  },
  value:       { fontSize: 16, color: '#000', lineHeight: 22 },

  scanBtn:     {
    backgroundColor: '#000433',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  scanText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
});
