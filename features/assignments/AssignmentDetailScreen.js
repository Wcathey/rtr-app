// features/assignments/AssignmentDetailScreen.js
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { acceptAssignment } from './assignmentService';  // ← our helper
import { supabase } from '../../services/supabase';

dayjs.extend(utc);

// haversine formula in miles
function getDistanceMiles(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AssignmentDetailScreen({ route, navigation }) {
  const { assignment } = route.params || {};

  const [loc, setLoc] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!assignment || !assignment.location_id) {
          throw new Error('Missing assignment or location_id');
        }

        // 1️⃣ Fetch assignment’s location
        const { data: locationRow, error: locErr } = await supabase
          .from('locations')
          .select('*')
          .eq('id', assignment.location_id)
          .single();
        if (locErr) throw locErr;
        setLoc(locationRow);

        // 2️⃣ Get device GPS
        const { status } =
          await Location.requestForegroundPermissionsAsync();
        let pos = null;
        if (status === 'granted') {
          pos = await Location.getCurrentPositionAsync({});
          setUserPos(pos.coords);
        }

        // 3️⃣ Calculate distance
        if (pos?.coords && locationRow) {
          const miles = getDistanceMiles(
            pos.coords.latitude,
            pos.coords.longitude,
            locationRow.latitude,
            locationRow.longitude
          );
          setDistance(miles.toFixed(1));
        }
      } catch (err) {
        console.error('AssignmentDetail load error:', err);
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAccept = async () => {
    setClaiming(true);
    try {
      await acceptAssignment(assignment.id);
      navigation.navigate('Map', {assignment}); // adjust if your route name differs
    } catch (err) {
      console.error('Accept failed:', err);
      Alert.alert('Error', err.message);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#000433" />
      </SafeAreaView>
    );
  }

  if (!assignment || !loc) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ fontSize: 18, color: 'red' }}>
          Unable to load assignment details.
        </Text>
      </SafeAreaView>
    );
  }

  // Format display values
  const start = dayjs.utc(assignment.start_time).local().format('h:mm A');
  const end = dayjs.utc(assignment.end_time).local().format('h:mm A');
  const address = `${loc.address}${
    loc.optional_address_ext ? ` ${loc.optional_address_ext}` : ''
  }, ${loc.city}, ${loc.state} ${loc.zipcode}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price</Text>
          <Text style={styles.line}>
            Base Pay: ${assignment.base_price.toFixed(2)}
          </Text>
          <Text style={styles.line}>
            Tips: ${(assignment.tips || 0).toFixed(2)}
          </Text>
          <Text style={[styles.line, styles.total]}>
            Total: $
            {(assignment.base_price + (assignment.tips || 0)).toFixed(2)}
          </Text>
        </View>

        {/* Date/Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date/Time</Text>
          <Text style={styles.line}>
            Date:{' '}
            {dayjs
              .utc(assignment.start_time)
              .local()
              .format('MMMM D, YYYY')}
          </Text>
          <Text style={styles.line}>Start: {start}</Text>
          <Text style={styles.line}>End (Est.): {end}</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.line}>{address}</Text>
          {distance !== null && (
            <Text style={styles.line}>Distance: {distance} mi</Text>
          )}
        </View>
      </ScrollView>

      {/* Accept Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.acceptBtn, claiming && { opacity: 0.7 }]}
          onPress={handleAccept}
          disabled={claiming}
        >
          {claiming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.acceptText}>Accept Assignment</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inner: { padding: 16, paddingBottom: 100 },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000433',
  },
  line: { fontSize: 16, marginBottom: 4, color: '#333' },
  total: { fontSize: 18, fontWeight: '700', color: '#10B981', marginTop: 8 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  acceptBtn: {
    backgroundColor: '#000433',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
