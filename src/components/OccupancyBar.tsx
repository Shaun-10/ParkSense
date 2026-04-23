import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type OccupancyBarProps = {
  percent: number;
};

export function OccupancyBar({ percent }: OccupancyBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Occupancy</Text>
        <Text style={styles.value}>{Math.round(clampedPercent)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clampedPercent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 143, 183, 0.2)',
    backgroundColor: 'rgba(20, 28, 42, 0.8)'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  label: {
    color: '#a8b6cf',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2
  },
  value: {
    color: '#f4f8ff',
    fontSize: 24,
    fontWeight: '700'
  },
  track: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(126, 142, 170, 0.2)',
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ff4e57',
    shadowColor: '#ff4e57',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 }
  }
});
