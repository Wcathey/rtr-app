import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { fetchUserDetails } from './dashboardService';

export default function ProfileScreen({ navigation }) {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found.');
        const details = await fetchUserDetails(user.id);
        setUserDetails({ ...details, id: user.id });
      } catch (err) {
        console.error('Error loading user details:', err);
        setError(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need permission to access your media library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['Images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      await uploadImage(result.assets[0].uri);
    } else {
      Alert.alert('No image selected');
    }
  }

  async function uploadImage(uri) {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `${userDetails.id}-${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase
        .storage
        .from('profile-images')
        .upload(fileName, blob, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { publicURL, error: urlError } = supabase
        .storage
        .from('profile-images')
        .getPublicUrl(fileName);
      if (urlError) throw urlError;

      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture: publicURL })
        .eq('id', userDetails.id);
      if (updateError) throw updateError;

      setUserDetails(prev => ({ ...prev, profile_picture: publicURL }));
      Alert.alert('Success', 'Profile image updated successfully.');
    } catch (err) {
      console.error('Error uploading image:', err);
      Alert.alert('Upload error', err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  const fullName = `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim();
  const joinedDate = userDetails.created_at
    ? new Date(userDetails.created_at).toLocaleDateString()
    : 'N/A';
  const profileImageUri = userDetails.profile_picture;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileImageWrapper}>
        {profileImageUri ? (
          <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.defaultIconContainer}>
            <Ionicons name="person" size={80} color="#ccc" />
          </View>
        )}
        <Pressable style={styles.uploadButton} onPress={handlePickImage}>
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Edit</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.userTypeText}>{userDetails.user_type || 'User'}</Text>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{userDetails.phone_number || 'N/A'}</Text>
        </View>
      </View>

      <View style={[styles.card, styles.detailsCard]}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{fullName || 'No name provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{userDetails.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Joined:</Text>
          <Text style={styles.value}>{joinedDate}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.uploadButton, { marginTop: 10, paddingVertical: 8, paddingHorizontal: 20 }]}
        onPress={() => Alert.alert('Edit Profile Coming Soon')}
      >
        <Text style={styles.uploadButtonText}>Edit Profile</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 20,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  profileImageWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  defaultIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userTypeText: {
    fontSize: 16,
    color: 'grey',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsCard: {},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'left',
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    textAlign: 'right',
  },
});
