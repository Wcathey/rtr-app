// features/assignments/StartedAssignment.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  ActionSheetIOS,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAssignmentById } from './assignmentService';

export default function AssignmentDetailScreen({ route, navigation }) {
  const { assignmentId } = route.params;
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const asn = await getAssignmentById(assignmentId);
        setAssignment(asn);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Could not load assignment details.');
        navigation.goBack();
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
    },
    client: { first_name, last_name, phone_number },
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
    Linking.canOpenURL(url).then(supported => {
      supported
        ? Linking.openURL(url)
        : Alert.alert('Error', 'Phone call not supported on this device');
    });
  };

  const sendSMS = () => {
    const url = Platform.select({
      ios: `sms:${phone_number}`,
      android: `sms:${phone_number}?body=`,
    });
    Linking.canOpenURL(url).then(supported => {
      supported
        ? Linking.openURL(url)
        : Alert.alert('Error', 'SMS not supported on this device');
    });
  };

  const onPressPhone = () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        'Contact client',
        null,
        [
          { text: 'Call', onPress: dialCall },
          { text: 'Text', onPress: sendSMS },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    } else {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Call', 'Text', 'Cancel'], cancelButtonIndex: 2 },
        buttonIndex => {
          if (buttonIndex === 0) dialCall();
          else if (buttonIndex === 1) sendSMS();
        }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Assignment Details</Text>
        <TouchableOpacity onPress={onPressPhone} style={styles.phoneBtn}>
          <Ionicons name="call-outline" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Client</Text>
        <Text style={styles.value}>{first_name} {last_name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>When</Text>
        <Text style={styles.value}>
          {new Date(start_time).toLocaleString()} – {new Date(end_time).toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Where</Text>
        <Text style={styles.value}>{fullAddress}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>What</Text>
        <Text style={styles.value}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, padding: 16, backgroundColor: '#fff' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title:      { fontSize: 20, fontWeight: '700', color: '#000433' },
  phoneBtn:   { padding: 8 },

  section:    { marginBottom: 20 },
  label:      { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
  value:      { fontSize: 16, color: '#000' },
});
