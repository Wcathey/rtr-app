import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'supabase.auth.token';

export const authStorage = {
  async getItem(key) {
    if (key === TOKEN_KEY) {
      const access = await SecureStore.getItemAsync('access_token');
      const refresh = await SecureStore.getItemAsync('refresh_token');
      return access && refresh ? JSON.stringify({ access_token: access, refresh_token: refresh }) : null;
    }
    return AsyncStorage.getItem(key);
  },

  async setItem(key, value) {
    if (key === TOKEN_KEY) {
      const session = JSON.parse(value);
      await SecureStore.setItemAsync('access_token', session.access_token);
      await SecureStore.setItemAsync('refresh_token', session.refresh_token);
      return;
    }
    return AsyncStorage.setItem(key, value);
  },

  async removeItem(key) {
    if (key === TOKEN_KEY) {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};
