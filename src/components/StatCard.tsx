import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
};

export function StatCard({ label, value, icon, accentColor }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>{icon}</View>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Text style={[styles.label, { color: accentColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(23, 31, 48, 0.85)',
    borderColor: 'rgba(120, 143, 183, 0.22)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconWrap: {
    width: 30,
    alignItems: 'center'
  },
  value: {
    fontSize: 34,
    fontWeight: '700',
    color: '#f4f8ff'
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    opacity: 0.92
  }
});
