import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  PanResponder,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import MapboxGL, { UserLocation } from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PUBLIC_MAPBOX_ACCESS_TOKEN } from '@env';
import { getAssignments } from '../assignments/assignmentService';
import { supabase } from '../../services/supabase';
import { fetchUserDetails } from '../profile/dashboardService';
import dayjs from 'dayjs';

MapboxGL.setAccessToken(PUBLIC_MAPBOX_ACCESS_TOKEN);

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOTTOM_SHEET_HEIGHT = 400;

const getGreeting = () => {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function MapScreen({ onComplete, navigation }) {
  const [location, setLocation] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const translateY = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
  const currentOffset = useRef(BOTTOM_SHEET_HEIGHT);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.setOffset(currentOffset.current);
        translateY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        translateY.flattenOffset();
        let target;
        if (gestureState.dy < -50) target = 0;
        else if (gestureState.dy > 50) target = BOTTOM_SHEET_HEIGHT;
        else target = currentOffset.current;

        currentOffset.current = target;
        Animated.spring(translateY, {
          toValue: target,
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAssignments();
        setAssignments(data);
      } catch (err) {
        console.error('Error fetching assignments:', err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user?.id) {
        console.warn('⚠️ Skipping fetchUserDetails – no valid user.');
        setLoading(false);
        return;
      }

      const details = await fetchUserDetails(data.user.id);
      setUserDetails(details);
      setLoading(false);
    })();
  }, []);

  const defaultCoordinates = [-122.4324, 37.78825];
  const centerCoordinates = location
    ? [location.longitude, location.latitude]
    : defaultCoordinates;

  const incompleteAssignments = assignments.filter(a => a.status !== 'completed');

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  if (!userDetails?.clearance) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.pendingTitle}>Pending Approval</Text>
        <Text style={styles.pendingSubtitle}>
          Your application is under review. You’ll gain access once approved.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapWrapper}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Street}
          logoEnabled
          attributionEnabled
          onDidFinishLoadingMap={() => {
            setMapReady(true);
            Animated.spring(translateY, {
              toValue: 150,
              useNativeDriver: false,
            }).start();
            currentOffset.current = 150;
            setTimeout(() => onComplete?.(), 200);
          }}
        >
          <MapboxGL.Camera
            zoomLevel={14}
            centerCoordinate={centerCoordinates}
            animationMode="flyTo"
            animationDuration={2000}
          />
          <UserLocation visible={mapReady} />
        </MapboxGL.MapView>
      </View>

      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        {incompleteAssignments.length > 0 ? (
          <View style={styles.sheetContent}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsHeaderText}>
                {userDetails ? `${getGreeting()}, ${userDetails.first_name}` : getGreeting()}
              </Text>
            </View>
            <View style={styles.detailsContent}>
              <FlatList
                data={incompleteAssignments}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.flatListContent}
                renderItem={({ item }) => (
                  <View style={styles.assignmentItem}>
                    <Text style={styles.assignmentTitle}>{item.title || 'Assignment'}</Text>
                    <Text style={styles.assignmentDescription}>
                      {item.description || 'No description provided.'}
                    </Text>
                    <Text style={styles.assignmentStatus}>
                      Status: {item.status || 'Status Unavailable.'}
                    </Text>
                    <Text style={styles.assignmentDate}>
                      Created: {dayjs(item.created_at).format('MMM D, YYYY')}
                    </Text>
                  </View>
                )}
              />
            </View>
          </View>
        ) : (
          <View style={styles.sheetContent}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsHeaderText}>
                {userDetails ? `${getGreeting()}, ${userDetails.first_name}` : getGreeting()}
              </Text>
            </View>
            <View style={styles.detailsContent}>
              <Text style={styles.sheetTitle}>Preservers are available</Text>
              <Text style={styles.sheetSubtitle}>Create an assignment to hire a preserver</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('AssignmentForm')}
              >
                <Text style={styles.buttonText}>Create Assignment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pendingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 8,
    textAlign: 'center',
  },
  pendingSubtitle: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: '#151945',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    paddingBottom: 40,
  },
  sheetContent: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
  },
  detailsHeader: {
    width: '100%',
    backgroundColor: '#000433',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  detailsHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailsContent: {
    width: '100%',
    backgroundColor: '#000433',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  flatListContent: {
    paddingBottom: 8,
  },
  assignmentItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDD22A',
    paddingBottom: 8,
  },
  assignmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  assignmentDescription: {
    fontSize: 16,
    color: '#DBDBDB',
    marginBottom: 4,
    marginTop: 2,
  },
  assignmentStatus: {
    fontSize: 16,
    color: '#4a90e2',
    marginBottom: 4,
    marginTop: 10,
  },
  assignmentDate: {
    fontSize: 14,
    color: '#fff',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
