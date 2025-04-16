import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getAssignments } from './assignmentService';

import dayjs from 'dayjs';

export default function AssignmentsScreen() {
  const navigation = useNavigation();
  const [assignments, setAssignments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // State for error messages

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getAssignments();
        setAssignments(result);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setError('Unable to load assignments. Please try again later.');
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* "Create New Assignment" button placed within the content */}
        <Pressable
          style={styles.createButton}
          onPress={() => navigation.navigate('AssignmentForm')}
        >
          <Text style={styles.createButtonText}>Create New Assignment</Text>
        </Pressable>

        {(!assignments || assignments.length === 0) ? (
          <Text style={styles.noAssignmentsText}>
            You currently have no open assignments.
          </Text>
        ) : (
          <FlatList
            data={assignments}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.flatListContent}
            renderItem={({ item }) => (
              <View style={styles.assignmentItem}>
                <Text style={styles.assignmentTitle}>
                  {item.title || 'Assignment'}
                </Text>
                <Text style={styles.assignmentDescription}>
                  {item.description || 'No description provided.'}
                </Text>
                <Text style={styles.assignmentStatus}>
                  {item.status || 'Status Unavailable.'}
                </Text>
                <Text style={styles.assignmentDate}>
                  Created: {dayjs(item.created_at).format('MMM D, YYYY')}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  createButton: {
    backgroundColor: '#10B981', // Green
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  noAssignmentsText: {
    textAlign: 'center',
    color: '#6b7280',
  },
  flatListContent: {
    paddingBottom: 16,
  },
  assignmentItem: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  assignmentDescription: {
    marginTop: 4,
    color: '#374151',
  },
  assignmentStatus: {
    marginTop: 4,
    color: '#374151',
  },
  assignmentDate: {
    marginTop: 4,
    color: '#6b7280',
  },
});
