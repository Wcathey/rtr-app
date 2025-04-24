// features/assignments/AssignmentsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { getOpenAssignments } from './assignmentService';

dayjs.extend(utc);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 55;

const WEEKDAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export default function AssignmentsScreen({ navigation }) {
  const [allSections, setAllSections] = useState([]);   // grouped full data
  const [sections, setSections] = useState([]);   // what we render
  const [loading, setLoading] = useState(true);

  // which days are _really_ applied
  const [appliedDays, setAppliedDays] = useState([]);

  // UI temp state in the overlay
  const [tempDays, setTempDays] = useState([]);

  const [filterVisible, setFilterVisible] = useState(false);

  // fetch & group
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const open = await getOpenAssignments();
      const grouped = open.reduce((acc, a) => {
        const dow = dayjs.utc(a.start_time).local().day();
        const dayLabel = WEEKDAYS.find(w => w.value === dow).label;
        if (!acc[dayLabel]) acc[dayLabel] = [];
        acc[dayLabel].push(a);
        return acc;
      }, {});
      const secs = Object.entries(grouped).map(([title, data]) => ({ title, data }));
      setAllSections(secs);
      // when fresh data arrives, re‑apply the currently active filter
      applyFilterToSections(secs, appliedDays);
    } catch (err) {
      console.error('Error fetching open assignments:', err);
      setAllSections([]);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [appliedDays]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // filter logic extracted
  const applyFilterToSections = (sourceSections, days) => {
    if (days.length === 0) {
      setSections(sourceSections);
      return;
    }
    const filtered = sourceSections
      .map(({ title, data }) => {
        const d = data.filter(a => {
          const dow = dayjs.utc(a.start_time).local().day();
          return days.includes(dow);
        });
        return { title, data: d };
      })
      .filter(sec => sec.data.length > 0);
    setSections(filtered);
  };

  // open the overlay and seed tempDays from appliedDays
  const openFilter = () => {
    setTempDays(appliedDays);
    setFilterVisible(true);
  };

  // toggle temp selection
  const toggleTempDay = val => {
    setTempDays(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
    );
  };

  // apply: set appliedDays ← tempDays, filter sections, close
  const applyFilters = () => {
    setAppliedDays(tempDays);
    applyFilterToSections(allSections, tempDays);
    setFilterVisible(false);
  };

  // clear all filters
  const clearFilters = () => {
    setAppliedDays([]);
    setTempDays([]);
    setSections(allSections);
    setFilterVisible(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#000433" />
      </SafeAreaView>
    );
  }

  const totalOpen = allSections.reduce((sum, sec) => sum + sec.data.length, 0);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
          <Ionicons name="filter-outline" size={20} color="#000" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
        <Text style={styles.openCount}>{totalOpen} Open</Text>
      </View>

      {/* FILTER OVERLAY */}
      {filterVisible && (
        <View style={styles.filterOverlay}>
          <Text style={styles.filterLabel}>Filter by Day</Text>
          <View style={styles.radioRow}>
            {WEEKDAYS.map(w => (
              <TouchableOpacity
                key={w.value}
                style={[
                  styles.radioBtn,
                  tempDays.includes(w.value) && styles.radioBtnSelected,
                ]}
                onPress={() => toggleTempDay(w.value)}
              >
                <Text
                  style={[
                    styles.radioText,
                    tempDays.includes(w.value) && styles.radioTextSelected,
                  ]}
                >
                  {w.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.filterFooter}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearText}>Clear filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setFilterVisible(false)}
            >
              <Ionicons name="close" size={24} color="#444" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* EMPTY STATE */}
      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No assignments available at this time.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('AssignmentDetail', { assignment: item })}
            >
              <Text style={styles.duration}>
                {Math.round(
                  (new Date(item.end_time) - new Date(item.start_time)) /
                    1000 /
                    60 /
                    60
                )}{' '}
                hr
              </Text>
              <Text style={styles.times}>
                {dayjs.utc(item.start_time).local().format('h:mm A')} –{' '}
                {dayjs.utc(item.end_time).local().format('h:mm A')}
              </Text>
              <Text style={styles.totalPrice}>
                ${(item.base_price + (item.tips || 0)).toFixed(2)}
              </Text>
              <Text style={styles.subText}>
                Base ${item.base_price.toFixed(2)} + Tips ${(
                  item.tips || 0
                ).toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{
            paddingTop: 60,
            paddingBottom: TAB_BAR_HEIGHT + 10,
          }}
        />
      )}

      {/* REFRESH BUTTON */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={fetchAssignments}
      >
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },

  // HEADER
  headerRow: {
    position: 'absolute',
    top: 0, width: SCREEN_WIDTH, height: 60,
    backgroundColor: '#fff', flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  filterBtn: { flexDirection: 'row', alignItems: 'center' },
  filterText: { marginLeft: 6, fontSize: 16, color: '#000' },
  openCount: { fontSize: 16, fontWeight: '600', color: '#000' },

  // FILTER OVERLAY
  filterOverlay: {
    position: 'absolute', top: 60, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    zIndex: 20, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5,
  },
  filterLabel: {
    fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333'
  },
  radioRow: { flexDirection: 'row', flexWrap: 'wrap' },
  radioBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#777',
    borderRadius: 20, marginRight: 8, marginBottom: 8,
  },
  radioBtnSelected: {
    backgroundColor: '#000433', borderColor: '#000433'
  },
  radioText: { color: '#333' },
  radioTextSelected: { color: '#fff' },

  filterFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  clearBtn: {
    paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: '#ddd', borderRadius: 6,
  },
  clearText: { color: '#000', fontWeight: '600' },
  applyBtn: {
    paddingVertical: 8, paddingHorizontal: 16,
    backgroundColor: '#000433', borderRadius: 6,
  },
  applyText: { color: '#fff', fontWeight: '600' },
  closeBtn: { position: 'absolute', top: 12, right: 12 },

  // EMPTY
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingBottom: TAB_BAR_HEIGHT + 10, paddingTop: 60,
  },
  emptyText: { fontSize: 16, color: '#666' },

  // LIST
  sectionHeader: {
    marginTop: 70, paddingHorizontal: 16, paddingVertical: 8,
    fontSize: 14, fontWeight: '600', color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginVertical: 8,
    borderRadius: 8, padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  duration: { fontSize: 18, fontWeight: '600', color: '#000' },
  times: { fontSize: 14, color: '#555', marginVertical: 4 },
  totalPrice: {
    fontSize: 16, fontWeight: '700', color: '#10B981',
    position: 'absolute', top: 16, right: 16,
  },
  subText: { fontSize: 12, color: '#999', marginTop: 8 },

  // REFRESH
  refreshButton: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    height: TAB_BAR_HEIGHT, backgroundColor: '#000433',
    justifyContent: 'center', alignItems: 'center', zIndex: 5,
  },
  refreshText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
