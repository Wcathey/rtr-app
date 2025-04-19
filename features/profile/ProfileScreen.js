// features/profile/ProfileScreen.js

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
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    (async () => {
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
    })();
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
    }
  }

  async function uploadImage(uri) {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `${userDetails.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase
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
      Alert.alert('Success', 'Profile picture updated successfully.');
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
      {/* Avatar + Update Profile Picture */}
      <View style={styles.avatarContainer}>
        {profileImageUri ? (
          <Image source={{ uri: profileImageUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={80} color="#ccc" />
          </View>
        )}

        <Pressable style={styles.updatePicBtn} onPress={handlePickImage}>
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.updatePicTxt}>Update Profile Picture</Text>
          )}
        </Pressable>
      </View>

      {/* Role */}
      <Text style={styles.roleText}>{userDetails.user_type || 'User'}</Text>

      {/* Phone */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{userDetails.phone_number || 'N/A'}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={[styles.card, styles.detailsCard]}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{fullName || 'No name provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text
            style={[styles.value, { flexShrink: 1 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {userDetails.email}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Joined:</Text>
          <Text style={styles.value}>{joinedDate}</Text>
        </View>
      </View>

      {/* (Optional) additional profile actions below… */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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

  avatarContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updatePicBtn: {
    marginTop: 12,
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  updatePicTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  roleText: {
    fontSize: 16,
    color: 'grey',
    textAlign: 'center',
    marginVertical: 16,
  },

  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginVertical: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    fontWeight: '500',
  },
});
