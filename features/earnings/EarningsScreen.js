// features/earnings/EarningsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { getEarnings } from './earningsService';
import dayjs from 'dayjs';

export default function EarningsScreen() {
  const [loading, setLoading]   = useState(true);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const earnings = await getEarnings();
        const byMonth = earnings.reduce((acc, e) => {
          const month = dayjs(e.date).format('MMMM');
          (acc[month] = acc[month] || []).push(e);
          return acc;
        }, {});

        const secs = Object.entries(byMonth).map(([title, data]) => ({
          title,
          data,
        }));
        setSections(secs);
      } catch (err) {
        console.error('Error loading earnings', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // total balance
  const balance = sections
    .flatMap((s) => s.data)
    .reduce((sum, e) => sum + e.total, 0);

  // next Tuesday calculation
  let nextTuesday = null;
  if (balance > 0) {
    const today = dayjs();
    const dow   = today.day();            // Sunday=0, Monday=1, Tuesday=2...
    let daysAhead = (2 - dow + 7) % 7;    // how many days until Tuesday
    if (daysAhead === 0) daysAhead = 7;   // if today is Tuesday, schedule next week
    nextTuesday = today.add(daysAhead, 'day');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.balanceLabel}>Current balance</Text>
        <Text style={styles.balance}>${balance.toFixed(2)}</Text>

        {/* only show if there’s money to pay */}
        {balance > 0 && nextTuesday && (
          <Text style={styles.nextPay}>
            Payment scheduled for {nextTuesday.format('ddd, MMM D')}
          </Text>
        )}
      </View>

      {/* Earnings List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.monthHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemDate}>
                {dayjs(item.date).format('ddd, MMM D')}
              </Text>
              <Text style={styles.itemTime}>
                {item.start} – {item.end}
              </Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemTotal}>
                ${item.total.toFixed(2)}
              </Text>
              <Text style={styles.itemBreakdown}>
                Base: ${item.base.toFixed(2)}  |  Tips: ${item.tips.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F9FAFB' },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  balance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    marginVertical: 8,
  },
  nextPay: {
    fontSize: 14,
    color: '#6B7280',
  },

  monthHeader: {
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    color: '#111827',
  },

  listContent: {
    paddingBottom: 32,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  itemLeft: {
    flex: 1,
  },
  itemDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  itemTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  itemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemBreakdown: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
