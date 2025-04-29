// features/map/MapScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Alert,
  Platform,
  ActionSheetIOS,
  Linking,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import {
  getAssignedAssignment,
  startAssignment,
} from '../assignments/assignmentService';
import { fetchUserDetails } from '../profile/dashboardService';
import { getEarnings } from '../earnings/earningsService';
import { supabase } from '../../services/supabase';
import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '@env';

MapboxGL.setAccessToken(PUBLIC_MAPBOX_ACCESS_TOKEN);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT   = SCREEN_HEIGHT / 1.9;
const BOTTOM_MARGIN = 30;
const THRESHOLD_MI  = 0.01;

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapScreen({ route, navigation }) {
  const assignmentParam = route?.params?.assignment ?? null;

  const [hasLocation, setHasLocation]     = useState(false);
  const [initLoading, setInitLoading]     = useState(true);
  const [origin, setOrigin]               = useState(null);
  const [assigned, setAssigned]           = useState(assignmentParam);
  const [earningsToday, setEarningsToday] = useState(0);
  const [firstName, setFirstName]         = useState('');
  const [distance, setDistance]           = useState(null);

  const [arrived, setArrived] = useState(false);
  const [started, setStarted] = useState(false);

  const cameraRef = useRef(null);

  // 1️⃣ Request permissions
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') setHasLocation(true);
      else {
        Alert.alert('Location required', 'We need your location to proceed.');
        setHasLocation(false);
      }
      setInitLoading(false);
    })();
  }, []);

  // 2️⃣ Load user, earnings, assignment
  useEffect(() => {
    if (!hasLocation) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const details = await fetchUserDetails(user.id);
      setFirstName(details.first_name || '');

      const allEarnings = await getEarnings();
      const today = new Date().toDateString();
      setEarningsToday(
        allEarnings
          .filter(e => new Date(e.date).toDateString() === today)
          .reduce((sum, e) => sum + e.total, 0)
      );

      if (!assignmentParam) {
        const a = await getAssignedAssignment();
        setAssigned(a);
      }
    })();
  }, [hasLocation, assignmentParam]);

  // 3️⃣ Initial GPS fix
  useEffect(() => {
    if (!hasLocation) return;
    (async () => {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setOrigin([pos.coords.longitude, pos.coords.latitude]);
    })();
  }, [hasLocation]);

  // 4️⃣ Watch GPS
  useEffect(() => {
    if (!hasLocation) return;
    let sub;
    (async () => {
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, distanceInterval: 5 },
        pos => {
          const coords = [pos.coords.longitude, pos.coords.latitude];
          setOrigin(coords);
          cameraRef.current?.setCamera({
            centerCoordinate: coords,
            zoomLevel: 14,
            animationDuration: 400,
          });
          if (assigned?.location) {
            const d = haversineMiles(
              pos.coords.latitude,
              pos.coords.longitude,
              assigned.location.latitude,
              assigned.location.longitude
            );
            setDistance(d);
          }
        }
      );
    })();
    return () => sub && sub.remove();
  }, [hasLocation, assigned]);

  // 5️⃣ Navigation chooser (unchanged)
  const launchExternalNavigation = () => {
    if (!assigned?.location) return;
    const { latitude, longitude } = assigned.location;
    const label = encodeURIComponent(assigned.description || 'Destination');

    if (Platform.OS === 'android') {
      Alert.alert('Navigate with…', null, [
        {
          text: 'Google Maps',
          onPress: () =>
            Linking.openURL(
              `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`
            ),
        },
        {
          text: 'Waze',
          onPress: () =>
            Linking.openURL(
              `waze://?ll=${latitude},${longitude}&navigate=yes`
            ).catch(() =>
              Alert.alert('Waze not installed', 'Please install Waze.')
            ),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Apple Maps', 'Google Maps', 'Waze', 'Cancel'],
          cancelButtonIndex: 3,
        },
        idx => {
          let url = '';
          if (idx === 0) {
            url = `maps://?daddr=${latitude},${longitude}&dirflg=d`;
          } else if (idx === 1) {
            url = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
          } else if (idx === 2) {
            url = `waze://?ll=${latitude},${longitude}&navigate=yes`;
          } else {
            return;
          }
          Linking.canOpenURL(url).then(supported =>
            supported
              ? Linking.openURL(url)
              : Alert.alert('App not installed', 'Please install the selected app.')
          );
        }
      );
    }
  };

  // Handlers
  const onArrive = () => {
    console.log('🛬 Arrive button tapped');
    setArrived(true);
  };
  const onStart = async () => {
    if (!assigned?.id) return;
    try {
      await startAssignment(assigned.id);
      // navigate into your MapStack’s StartedAssignment screen:
      navigation.navigate('StartedAssignment', {
        assignmentId: assigned.id,
      });
    } catch {
      Alert.alert('Error', 'Could not start assignment.');
    }
  };

  // Guards
  if (initLoading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }
  if (!hasLocation) {
    return (
      <SafeAreaView style={styles.loader}>
        <Text style={{ padding: 20, textAlign: 'center' }}>
          Location permission is required.
        </Text>
      </SafeAreaView>
    );
  }

  // greeting
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <SafeAreaView style={styles.container}>
      {/* Map */}
      <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Street}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={origin}
        />
        {origin && (
          <MapboxGL.ShapeSource
            id="me"
            shape={{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: origin },
            }}
          >
            <MapboxGL.SymbolLayer
              id="meDot"
              style={{
                iconImage: 'circle-15',
                iconColor: '#007AFF',
                iconSize: 1.2,
              }}
            />
          </MapboxGL.ShapeSource>
        )}
        {assigned?.location && (
          <MapboxGL.ShapeSource
            id="pin"
            shape={{
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [
                      assigned.location.longitude,
                      assigned.location.latitude,
                    ],
                  },
                },
              ],
            }}
          >
            <MapboxGL.SymbolLayer
              id="pinLayer"
              style={{
                iconImage: 'marker-15',
                iconSize: 1.5,
                iconAllowOverlap: true,
              }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      {/* Assignment Card */}
      <View style={styles.card}>
        <Text style={styles.greeting}>
          {greet}, {firstName}
        </Text>

        <View style={styles.earningsBox}>
          <Text style={styles.earningsTitle}>Today's Earnings:</Text>
          <Text style={styles.earningsAmount}>
            ${earningsToday.toFixed(2)}
          </Text>
        </View>

        {assigned && (
          <View style={styles.upcomingBox}>
            <Text style={styles.upcomingTitle}>Your Assignment:</Text>
            <Text style={styles.line}>{assigned.description}</Text>
            <Text style={styles.line}>
              {new Date(assigned.start_time).toLocaleString()} –{' '}
              {new Date(assigned.end_time).toLocaleTimeString()}
            </Text>
            <Text style={styles.total}>
              ${(assigned.base_price + (assigned.tips || 0)).toFixed(2)}
            </Text>
          </View>
        )}

        {/* Single-Button Flow */}
        {!started && assigned && (
          <>
            {distance > THRESHOLD_MI && !arrived && (
              <TouchableOpacity
                style={styles.startBtn}
                onPress={launchExternalNavigation}
              >
                <Text style={styles.startText}>Navigate</Text>
              </TouchableOpacity>
            )}
            {distance != null &&
              distance <= THRESHOLD_MI &&
              !arrived && (
                <TouchableOpacity style={styles.startBtn} onPress={onArrive}>
                  <Text style={styles.startText}>Arrive</Text>
                </TouchableOpacity>
              )}
            {arrived && (
              <TouchableOpacity style={styles.startBtn} onPress={onStart}>
                <Text style={styles.startText}>Start Assignment</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, width: SCREEN_WIDTH },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    position: 'absolute',
    bottom: BOTTOM_MARGIN,
    left: 16,
    right: 16,
    height: CARD_HEIGHT,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  greeting:      { fontSize: 18, fontWeight: '700', color: '#000433', marginBottom: 12 },
  earningsBox:   { backgroundColor: '#DDE4FF', borderRadius: 8, padding: 12, marginBottom: 12 },
  earningsTitle: { fontWeight: '600', marginBottom: 4 },
  earningsAmount:{ fontSize: 16, fontWeight: '700', color: '#10B981' },

  upcomingBox:   { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 },
  upcomingTitle: { fontWeight: '600', marginBottom: 8 },
  line:          { fontSize: 14, marginBottom: 4, color: '#333' },
  total:         { fontSize: 16, fontWeight: '700', color: '#10B981' },

  startBtn:  {
    backgroundColor: '#000433',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  startText: { color: '#fff', fontWeight: '600' },
});
