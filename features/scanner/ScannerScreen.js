// features/scanner/ScannerScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ScannerScreen({ route, navigation }) {
  const { assignmentId } = route.params;
  const isFocused = useIsFocused();

  const [scannedImages, setScannedImages] = useState([]);
  const [processing, setProcessing]     = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);

  // 1️⃣ Launch scanner when screen first focuses
  useEffect(() => {
    if (!isFocused) return;
    (async () => {
      setProcessing(true);
      try {
        const { scannedImages: results } = await DocumentScanner.scanDocument();
        if (results?.length) {
          setScannedImages(results);
        }
      } catch (err) {
        console.error('Scanner error:', err);
        Alert.alert('Scan failed', 'Could not scan document.');
        navigation.goBack();
      } finally {
        setProcessing(false);
      }
    })();
  }, [isFocused]);

  // 2️⃣ Handlers
  const scanAnother = async () => {
    setProcessing(true);
    try {
      const { scannedImages: results } = await DocumentScanner.scanDocument();
      if (results?.length) {
        setScannedImages(prev => [...prev, ...results]);
      }
    } catch (err) {
      console.error('Scan error:', err);
      Alert.alert('Scan failed', 'Could not scan document.');
    } finally {
      setProcessing(false);
    }
  };

  const finishScanning = () => {
    Alert.alert(
      'Done Scanning',
      `You have scanned ${scannedImages.length} documents. Finish?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () =>
            navigation.navigate('ScanReview', {
              scans: scannedImages,
              assignmentId
            }),
        },
      ]
    );
  };

  // 3️⃣ Render loading
  if (processing) {
    return (
      <View style={styles.centered}>
        <Ionicons name="scan-outline" size={48} color="#10B981" />
        <Text style={styles.loadingText}>Scanning…</Text>
      </View>
    );
  }

  // 4️⃣ Main UI
  return (
    <View style={styles.container}>
      {/* Dropdown menu toggle */}
      <TouchableOpacity
        style={styles.menuToggle}
        onPress={() => setMenuOpen(open => !open)}
      >
        <Ionicons name="list-outline" size={28} color="#000" />
        <Text style={styles.menuText}>Scans ({scannedImages.length})</Text>
        <Ionicons
          name={menuOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={20}
          color="#000"
        />
      </TouchableOpacity>

      {menuOpen && (
        <FlatList
          style={styles.menuList}
          data={scannedImages}
          keyExtractor={uri => uri}
          renderItem={({ item, index }) => (
            <Text style={styles.menuItem}>Scan {index + 1}</Text>
          )}
        />
      )}

      {/* Preview of last scan */}
      {scannedImages.length > 0 && (
        <Image
          source={{ uri: scannedImages[scannedImages.length - 1] }}
          style={styles.preview}
          resizeMode="contain"
        />
      )}

      {/* Buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.button} onPress={scanAnother}>
          <Text style={styles.buttonText}>Scan Another Document</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.finish]} onPress={finishScanning}>
          <Text style={styles.buttonText}>Finish Scanning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff', padding: 16 },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:  { marginTop: 12, fontSize: 16, color: '#555' },

  menuToggle:   {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  menuText:     { marginHorizontal: 8, fontSize: 16, fontWeight: '600' },
  menuList:     {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
  },
  menuItem:     {
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
    fontSize: 14,
  },

  preview:      {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
    marginBottom: 12,
  },

  buttonsRow:   {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button:       {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
    alignItems: 'center',
  },
  finish:       {
    backgroundColor: '#000433',
  },
  buttonText:   {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
