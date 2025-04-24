// features/map/MapScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
  Text,
  TouchableOpacity,
} from 'react-native';
import MapboxGL, { UserLocation } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getNearbyAssignments,
  getAssignedAssignment,
  startAssignment,
} from '../assignments/assignmentService';
import { fetchUserDetails } from '../profile/dashboardService';
import { getEarnings } from '../earnings/earningsService';
import { getDrivingRoute } from '../locations/locationService';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// half-screen card
const CARD_HEIGHT   = SCREEN_HEIGHT / 1.9;
const BOTTOM_MARGIN = 30;
const HIDDEN_Y      = CARD_HEIGHT + BOTTOM_MARGIN;

import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '@env';
MapboxGL.setAccessToken(PUBLIC_MAPBOX_ACCESS_TOKEN);

export default function MapScreen({ route }) {
  const assignmentParam = route?.params?.assignment ?? null;

  const [coords, setCoords]               = useState(null);
  const [assignments, setAssignments]     = useState([]);
  const [assigned, setAssigned]           = useState(assignmentParam);
  const [earningsToday, setEarningsToday] = useState(0);
  const [routeInfo, setRouteInfo]         = useState({ distance: null, duration: null });
  const [loading, setLoading]             = useState(true);
  const [mapReady, setMapReady]           = useState(false);
  const [firstName, setFirstName]         = useState('');
  const [mapVisible, setMapVisible]       = useState(false);

  const cameraRef    = useRef(null);
  const translateY   = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(true);

  // guards so we only fetch once
  const routeFetched = useRef(false);
  const cameraFitted = useRef(false);

  // mount gate for MapView
  useEffect(() => {
    setMapVisible(true);
  }, []);

  // 1️⃣ load profile, earnings, fallback-assignment
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const details = await fetchUserDetails(user.id);
        setFirstName(details.first_name);

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
      } catch (err) {
        console.error('Init load error:', err);
      }
    })();
  }, [assignmentParam]);

  // 2️⃣ get device location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setCoords(pos.coords);
    })();
  }, []);

  // 3️⃣ fetch driving route once
  useEffect(() => {
    if (routeFetched.current) return;
    if (!coords || !assigned?.location) return;
    routeFetched.current = true;
    (async () => {
      try {
        const { distance_miles, duration_min } = await getDrivingRoute(
          coords.latitude,
          coords.longitude,
          assigned.location.latitude,
          assigned.location.longitude
        );
        setRouteInfo({
          distance: distance_miles.toFixed(1),
          duration: Math.round(duration_min),
        });
      } catch (err) {
        console.error('Routing error:', err);
      }
    })();
  }, [coords, assigned]);

  // 4️⃣ fetch nearby assignments
  useEffect(() => {
    if (!coords) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getNearbyAssignments({
          userLongitude: coords.longitude,
          userLatitude:  coords.latitude,
          radiusMiles:   25,
        });
        setAssignments(data || []);
      } catch (err) {
        console.error('Error fetching nearby assignments:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [coords]);

  // 5️⃣ fit camera only once
  useEffect(() => {
    if (!mapReady || cameraFitted.current) return;
    if (!coords || !assignments.length) return;
    cameraFitted.current = true;
    const lons = assignments.map(a => a.longitude).concat(coords.longitude);
    const lats = assignments.map(a => a.latitude).concat(coords.latitude);
    cameraRef.current.fitBounds(
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
      40,
      1000
    );
  }, [mapReady, coords, assignments]);

  if (loading || !coords) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  // greeting
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? 'Good Morning' :
    hour < 17 ? 'Good Afternoon' :
    'Good Evening';

  // animate card in/out
  const toggleCard = () => {
    Animated.spring(translateY, {
      toValue: expanded ? HIDDEN_Y : 0,
      useNativeDriver: true,
    }).start(() => setExpanded(!expanded));
  };

  // hide content button handler is the same as toggle
  const onHideContent = () => toggleCard();

  // start assignment
  const onStart = async () => {
    if (!assigned?.id) return;
    await startAssignment(assigned.id).catch(console.error);
    setAssigned(null);
  };

  const geojson = {
    type: 'FeatureCollection',
    features: assignments.map(a => ({
      type: 'Feature',
      id: a.assignment_id,
      geometry: {
        type: 'Point',
        coordinates: [a.longitude, a.latitude],
      },
    })),
  };

  return (
    <SafeAreaView style={styles.container}>
      {mapVisible && (
        <View style={styles.mapContainer}>
          <MapboxGL.MapView
            style={styles.map}
            styleURL={MapboxGL.StyleURL.Street}
            logoEnabled
            onDidFinishLoadingMap={() => setMapReady(true)}
          >
            <MapboxGL.Camera
              ref={cameraRef}
              zoomLevel={12}
              centerCoordinate={[coords.longitude, coords.latitude]}
            />
            <UserLocation visible />
            <MapboxGL.ShapeSource id="assignments" shape={geojson}>
              <MapboxGL.SymbolLayer
                id="pins"
                style={{
                  iconImage: 'marker-15',
                  iconAllowOverlap: true,
                  iconSize: 1.5,
                }}
              />
            </MapboxGL.ShapeSource>
          </MapboxGL.MapView>
        </View>
      )}

      {/* Animated Card */}
      <Animated.View style={[styles.card, { transform: [{ translateY }] }]}>
        {/* Hide Content button (only when expanded) */}
        {expanded && (
          <TouchableOpacity
            style={styles.hideContentBtn}
            onPress={onHideContent}
          >
            <Text style={styles.hideText}>Hide Content</Text>
          </TouchableOpacity>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.greeting}>{greet}, {firstName}</Text>

          <View style={styles.earningsBox}>
            <Text style={styles.earningsTitle}>Today's Earnings:</Text>
            <Text style={styles.earningsAmount}>${earningsToday.toFixed(2)}</Text>
          </View>

          {assigned ? (
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

              <View style={styles.locationDetails}>
                <Text style={styles.locationTitle}>Location Details:</Text>
                <Text style={styles.locationLine1}>
                  {assigned.location.address}
                </Text>
                <Text style={styles.locationLine2}>
                  {assigned.location.city}, {assigned.location.state}{' '}
                  {assigned.location.zipcode}
                </Text>
                {routeInfo.distance != null && (
                  <Text style={styles.distanceText}>
                    {routeInfo.distance} mi ({routeInfo.duration} min)
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.startBtn} onPress={onStart}>
                <Text style={styles.startText}>Start</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.noAssign}>No assignment assigned</Text>
          )}
        </View>
      </Animated.View>

      {/* Toggle Box (only when hidden) */}
      {!expanded && (
        <TouchableOpacity style={styles.toggleBox} onPress={toggleCard}>
          <Ionicons name="menu-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  mapContainer: { flex: 1 },
  map:          { flex: 1, width: SCREEN_WIDTH },
  loader:       { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    position: 'absolute',
    bottom: BOTTOM_MARGIN,
    left: 10,
    right: 10,
    height: CARD_HEIGHT,
    backgroundColor: '#000433',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  hideContentBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
    padding: 6,
    zIndex: 2,
  },
  hideText: {
    color: '#fff',
    fontSize: 14,
  },
  cardContent:     { flex: 1, justifyContent: 'flex-start', padding: 16 },
  greeting:        { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },

  earningsBox:     { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, marginBottom: 12 },
  earningsTitle:   { fontWeight: '600', marginBottom: 4 },
  earningsAmount:  { fontSize: 16, fontWeight: '700', color: '#10B981' },

  upcomingBox:     { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, marginTop: 8 },
  upcomingTitle:   { fontWeight: '600', marginBottom: 8 },
  line:            { fontSize: 14, marginBottom: 4, color: '#333' },
  total:           { fontSize: 16, fontWeight: '700', color: '#10B981', marginBottom: 12 },

  locationDetails: { marginBottom: 12 },
  locationTitle:   { fontWeight: '600', marginBottom: 4 },
  locationLine1:   { fontSize: 14, color: '#333' },
  locationLine2:   { fontSize: 14, color: '#333', marginBottom: 4 },
  distanceText:    { fontSize: 14, color: '#666' },

  startBtn: {
    backgroundColor: '#000433',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  startText: { color: '#fff', fontWeight: '600' },

  noAssign:  { color: '#777', fontStyle: 'italic' },

  toggleBox:{
    position:'absolute',
    bottom:1,
    alignSelf:'center',
    width:100,
    height:36,
    backgroundColor:'#000433',
    borderRadius:5,
    justifyContent:'center',
    alignItems:'center',
  },
});
