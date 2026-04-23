import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { STATUS_META } from '../data/mockParking';
import { ParkingSlot } from '../types/parking';

type SlotCardProps = {
  slot: ParkingSlot;
  index: number;
};

export function SlotCard({ slot, index }: SlotCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  const meta = STATUS_META[slot.status];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        delay: index * 45,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 9,
        tension: 80,
        delay: index * 45,
        useNativeDriver: true
      })
    ]).start();
  }, [fadeAnim, index, scaleAnim]);

  const isAvailable = slot.status === 'available';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderColor: meta.color,
          shadowColor: meta.glow,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.dot}>
        <View style={[styles.dotInner, { backgroundColor: meta.color }]} />
      </View>

      <Text style={styles.slotId}>{slot.id}</Text>

      <View style={styles.iconWrap}>
        {isAvailable ? (
          <Ionicons name="checkmark-circle-outline" size={28} color={meta.color} />
        ) : (
          <MaterialCommunityIcons name="car-outline" size={30} color={meta.color} />
        )}
      </View>

      <Text style={[styles.status, { color: meta.color }]}>{meta.label}</Text>
      <Text style={styles.subLabel}>{`SR-${slot.id}`}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 152,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(18, 27, 41, 0.94)',
    marginRight: 12,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 11,
    elevation: 8,
    alignItems: 'center'
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dotInner: {
    width: 5,
    height: 5,
    borderRadius: 999
  },
  slotId: {
    color: '#f4f8ff',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  iconWrap: {
    marginTop: 10,
    marginBottom: 6,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center'
  },
  status: {
    fontSize: 20,
    fontWeight: '700'
  },
  subLabel: {
    marginTop: 6,
    color: '#8193ae',
    fontSize: 13,
    marginBottom: 6
  }
});
