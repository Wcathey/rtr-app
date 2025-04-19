// features/assignments/AssignmentsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import { getOpenAssignments } from './assignmentService';  //  <-- make sure path is correct

// ────────────────────────────────────────────────────────────
// constants
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const FILTER_SHEET_H = 340;              // height of filter drawer
const TAB_BAR_H      = 64;               // approximate bottom‑tab height

export default function AssignmentsScreen() {
  // assignment data
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(false);

  // filter state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [dayFilter,    setDayFilter]    = useState('All');   // Sun…Sat, All
  const [mileFilter,   setMileFilter]   = useState(null);    // 5…100

  // animation
  const translateY = useState(new Animated.Value(FILTER_SHEET_H))[0];

  // ─── fetch open assignments ───────────────────────────────
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await getOpenAssignments();      // service now returns ONLY status='open'
      setAssignments(data);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // ─── helpers ──────────────────────────────────────────────
  const openSheet  = () => {
    setSheetVisible(true);
    Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: false }).start();
  };
  const closeSheet = () => {
    Animated.timing(translateY, { toValue: FILTER_SHEET_H, duration: 250, useNativeDriver: false })
      .start(() => setSheetVisible(false));
  };
  const clearFilters = () => {
    setDayFilter('All');
    setMileFilter(null);
  };
  const applyFilters = () => closeSheet();        // add real filtering logic later

  const totalFor = (a) => ((a.base_price || 0) + (a.tips || 0)).toFixed(2);

  // group by date
  const grouped = assignments.reduce((acc, a) => {
    const key = dayjs(a.start_time).format('dddd, MMM D');
    acc[key] = acc[key] ? [...acc[key], a] : [a];
    return acc;
  }, {});
  const sectionKeys = Object.keys(grouped);

  const renderCard = (item) => {
    const start = dayjs(item.start_time);
    const end   = dayjs(item.end_time);
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.duration}>
            {end.diff(start, 'hour')} hr
          </Text>
          <Text style={styles.price}>${ totalFor(item) }</Text>
        </View>
        <Text style={styles.time}>{`${start.format('h:mm A')}–${end.format('h:mm A')}`}</Text>
        <Text style={styles.sub}>{`Base $${item.base_price?.toFixed(2) || '0.00'} + Tips $${item.tips?.toFixed(2) || '0.00'}`}</Text>
      </View>
    );
  };

  // ─── render ───────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* header row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={openSheet}>
          <Ionicons name="filter-outline" size={18} />
          <Text style={styles.headerTxt}>Filter</Text>
        </TouchableOpacity>
        <Text style={styles.headerRight}>{assignments.length} Open</Text>
      </View>

      {/* list or empty */}
      {assignments.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTxt}>No assignments available at this time.</Text>
        </View>
      ) : (
        <FlatList
          data={sectionKeys}
          keyExtractor={(k) => k}
          renderItem={({ item: dateKey }) => (
            <>
              <View style={styles.dateHdr}><Text style={styles.dateTxt}>{dateKey}</Text></View>
              {grouped[dateKey].map((a) => (
                <View key={a.id} style={{ paddingHorizontal:20, paddingTop:8 }}>
                  {renderCard(a)}
                </View>
              ))}
            </>
          )}
        />
      )}

      {/* refresh button */}
      <Pressable style={styles.refreshBtn} onPress={fetchAssignments}>
        <Text style={styles.refreshTxt}>Refresh</Text>
      </Pressable>

      {/* filter sheet */}
      {sheetVisible && (
        <Animated.View style={[styles.sheet, { transform:[{ translateY }] }]}>
          <View style={styles.drag} />
          <Text style={styles.sheetTitle}>Filter Assignments</Text>

          <Text style={styles.sheetSub}>Day of week</Text>
          <View style={styles.optRow}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat','All'].map(d => (
              <TouchableOpacity
                key={d}
                style={styles.radioRow}
                onPress={() => setDayFilter(d)}
              >
                <View style={[
                  styles.radioOuter,
                  dayFilter===d && styles.radioOuterActive
                ]}>
                  {dayFilter===d && <View style={styles.radioInner} />}
                </View>
                <Text>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sheetSub}>Within miles</Text>
          <View style={styles.optRow}>
            {[5,10,25,50,100].map(m=>(
              <TouchableOpacity
                key={m}
                style={styles.radioRow}
                onPress={() => setMileFilter(m)}
              >
                <View style={[
                  styles.radioOuter,
                  mileFilter===m && styles.radioOuterActive
                ]}>
                  {mileFilter===m && <View style={styles.radioInner} />}
                </View>
                <Text>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={clearFilters}><Text style={styles.clear}>Clear</Text></TouchableOpacity>
            <TouchableOpacity style={styles.apply} onPress={applyFilters}><Text style={styles.applyTxt}>Apply</Text></TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ─── styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#f5f5f5' },

  header:{ flexDirection:'row', alignItems:'center', paddingHorizontal:16, height:48 },
  headerBtn:{ flexDirection:'row', alignItems:'center' },
  headerTxt:{ marginLeft:4, fontWeight:'600' },
  headerRight:{ marginLeft:'auto', fontWeight:'600' },

  dateHdr:{ backgroundColor:'#eee', paddingHorizontal:16, paddingVertical:6 },
  dateTxt:{ fontWeight:'600', color:'#555' },

  card:{
    backgroundColor:'#fff', borderRadius:6, padding:12,
    shadowColor:'#000', shadowOpacity:.05, shadowRadius:3, shadowOffset:{width:0,height:2}, elevation:2,
  },
  row:{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 },
  duration:{ fontWeight:'700', fontSize:16 },
  price:{ fontWeight:'700', fontSize:16, color:'#009B72' },
  time:{ color:'#666', fontSize:12 },
  sub:{ color:'#666', fontSize:12 },

  emptyBox:{ flex:1, justifyContent:'center', alignItems:'center' },
  emptyTxt:{ color:'#666' },

  refreshBtn:{
    position:'absolute', left:0, right:0, bottom:TAB_BAR_H,
    backgroundColor:'#050533', paddingVertical:14, alignItems:'center',
  },
  refreshTxt:{ color:'#fff', fontWeight:'600', fontSize:16 },

  // filter sheet
  sheet:{
    position:'absolute', left:0, right:0, bottom:0,
    height:FILTER_SHEET_H, backgroundColor:'#fff',
    borderTopLeftRadius:16, borderTopRightRadius:16, padding:16,
    zIndex:30,
  },
  drag:{ width:40, height:4, borderRadius:2, backgroundColor:'#ccc', alignSelf:'center', marginBottom:8 },
  sheetTitle:{ fontSize:18, fontWeight:'700', textAlign:'center', marginBottom:12 },
  sheetSub:{ fontWeight:'600', marginTop:8 },
  optRow:{ flexDirection:'row', flexWrap:'wrap', marginTop:8 },
  radioRow:{ flexDirection:'row', alignItems:'center', marginRight:14, marginBottom:10 },
  radioOuter:{ width:18, height:18, borderRadius:9, borderWidth:2, borderColor:'#bbb', justifyContent:'center', alignItems:'center' },
  radioOuterActive:{ borderColor:'#009B72' },
  radioInner:{ width:8, height:8, borderRadius:4, backgroundColor:'#009B72' },
  actionRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:16 },
  clear:{ fontSize:16, color:'#007AFF', fontWeight:'600' },
  apply:{ backgroundColor:'#009B72', paddingVertical:10, paddingHorizontal:24, borderRadius:6 },
  applyTxt:{ fontWeight:'600', color:'#fff' },
});
