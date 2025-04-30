// features/scanner/ScanReviewScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { submitAssignmentForReview } from '../assignments/assignmentService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ScanReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { scans = [], assignmentId } = route.params || {};

  const [submitted, setSubmitted] = useState(false);
  const [completedAt, setCompletedAt] = useState('');

  useEffect(() => {
    // record the moment the user lands on this screen
    const now = new Date();
    setCompletedAt(now.toLocaleString());
  }, []);

  const onSubmit = async () => {
    try {
      await submitAssignmentForReview(assignmentId);
      setSubmitted(true);
      Alert.alert('Success', 'Assignment submitted for review!', [
        {
          text: 'OK',
          onPress: () => {
            // pop back to your main flow (e.g. Map or Assignments)
            navigation.popToTop();
          },
        },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not submit assignment.');
    }
  };

  const renderThumb = ({ item }) => (
    <Image source={{ uri: item }} style={styles.thumb} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Review Your Scans</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Documents scanned: <Text style={styles.bold}>{scans.length}</Text>
        </Text>
        <Text style={styles.summaryText}>
          Completed at: <Text style={styles.bold}>{completedAt}</Text>
        </Text>
      </View>

      <FlatList
        data={scans}
        keyExtractor={(uri, idx) => uri + idx}
        renderItem={renderThumb}
        horizontal
        contentContainerStyle={styles.thumbsContainer}
        showsHorizontalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[styles.button, submitted && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={submitted}
      >
        <Text style={styles.buttonText}>
          {submitted ? 'Submitted' : 'Submit for Review'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const THUMB_SIZE = SCREEN_WIDTH * 0.3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#000433',
  },
  summary: {
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  bold: {
    fontWeight: '700',
    color: '#000',
  },
  thumbsContainer: {
    paddingVertical: 8,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
