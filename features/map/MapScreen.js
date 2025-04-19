// features/map/MapScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapboxGL, { UserLocation } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNearbyAssignments } from '../assignments/assignmentService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Either import your token from @env or hard‑code here (but keep it out of source control)
import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '@env';
MapboxGL.setAccessToken(PUBLIC_MAPBOX_ACCESS_TOKEN);

export default function MapScreen() {
  const [coords, setCoords]             = useState(null);
  const [assignments, setAssignments]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [mapReady, setMapReady]         = useState(false);
  const cameraRef                       = useRef(null);

  // 1️⃣ Get user’s current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync();
      setCoords(coords);
    })();
  }, []);

  // 2️⃣ Once we have coords, fetch nearby assignments (e.g. within 25 mi)
  useEffect(() => {
    if (!coords) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getNearbyAssignments({
          userLongitude: coords.longitude,
          userLatitude:  coords.latitude,
          radiusMiles:    25,
        });
        setAssignments(data);
      } catch (err) {
        console.error('Error fetching nearby assignments:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [coords]);

  // 3️⃣ When map is ready and we have points, fit camera to show all
  useEffect(() => {
    if (!mapReady || !coords || assignments.length === 0) return;

    const lons = assignments.map(a => a.longitude).concat(coords.longitude);
    const lats = assignments.map(a => a.latitude).concat(coords.latitude);

    const west  = Math.min(...lons);
    const east  = Math.max(...lons);
    const south = Math.min(...lats);
    const north = Math.max(...lats);

    cameraRef.current.fitBounds(
      [west, south],
      [east, north],
      40,    // padding in pts
      1000   // animation duration ms
    );
  }, [mapReady, coords, assignments]);

  //  Loading placeholder
  if (loading || !coords) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  //  Build GeoJSON for each assignment pin
  const geojson = {
    type: 'FeatureCollection',
    features: assignments.map(item => ({
      type: 'Feature',
      id:   item.assignment_id,
      geometry: {
        type: 'Point',
        coordinates: [item.longitude, item.latitude],
      },
      properties: { title: item.assignment_id },
    })),
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        logoEnabled={true}           // default Logo position respected
        attributionEnabled={true}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { flex: 1, width: SCREEN_WIDTH },
  loader:    {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
  },
});
