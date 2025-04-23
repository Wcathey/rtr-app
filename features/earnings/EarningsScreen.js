// features/earnings/EarningsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import dayjs from 'dayjs';
import { getEarnings } from './earningsService';

const screenWidth = Dimensions.get('window').width - 32; // account for padding

export default function EarningsScreen() {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getEarnings();
        setEarnings(data);
      } catch (err) {
        console.error('Failed to load earnings:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000433" />
        </View>
      </SafeAreaView>
    );
  }

  // Totals
  const balance = earnings.reduce((sum, e) => sum + e.total, 0);
  const base = earnings.reduce((sum, e) => sum + e.base, 0);
  const tips = earnings.reduce((sum, e) => sum + e.tips, 0);
  const totalAssignments = earnings.length;

  // Hours worked
  let totalSeconds = 0;
  earnings.forEach(e => {
    if (e.start && e.end) {
      totalSeconds += (new Date(e.end) - new Date(e.start)) / 1000;
    }
  });
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  // Bar chart data: sum by weekday
  const weekdayTotals = [0,0,0,0,0,0,0]; // Sun=0 ... Sat=6
  earnings.forEach(e => {
    const w = dayjs(e.date).day();
    weekdayTotals[w] += e.total;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <View>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawText}>WITHDRAW</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Earnings Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.dateRange}>This Week</Text>
          <BarChart
            data={{
              labels: ['S','M','T','W','T','F','S'],
              datasets: [{ data: weekdayTotals }]
            }}
            width={screenWidth}
            height={180}
            fromZero
            chartConfig={{
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: opacity => `rgba(59, 130, 246, ${opacity})`,
              labelColor: () => '#374151',
              style: { borderRadius: 12 },
              propsForBackgroundLines: { stroke: '#E5E7EB', strokeDasharray: '' }
            }}
            style={{ marginVertical: 8, borderRadius: 12 }}
          />

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalAssignments}</Text>
              <Text style={styles.statLabel}>Assignments</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{hours}h {minutes}m</Text>
              <Text style={styles.statLabel}>Hours Worked</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>—</Text>
              <Text style={styles.statLabel}>Records Scanned</Text>
            </View>
          </View>
        </View>

        {/* Assignment Earnings Breakdown */}
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Assignment Earnings</Text>
          <Text style={styles.breakdownItem}>
            Base Earnings: <Text style={styles.amount}>${base.toFixed(2)}</Text>
          </Text>
          <Text style={styles.breakdownItem}>
            Tips: <Text style={styles.amount}>${tips.toFixed(2)}</Text>
          </Text>
          <View style={styles.separator} />
          <Text style={[styles.breakdownItem, styles.totalLine]}>
            Total: <Text style={styles.amount}>${(base + tips).toFixed(2)}</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  balanceCard: {
    backgroundColor: '#000433',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: { color: '#cbd5e1', fontSize: 14 },
  balanceValue: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  withdrawButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  withdrawText: { color: '#fff', fontWeight: '600' },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dateRange: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center' },

  breakdown: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  breakdownItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#111827',
  },
  amount: { fontWeight: '600' },
  totalLine: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 8,
  },
});
