import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons
} from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { OccupancyBar } from '../components/OccupancyBar';
import { SlotCard } from '../components/SlotCard';
import { StatCard } from '../components/StatCard';
import { initialParkingSlots } from '../data/mockParking';
import {
  connectToHc05,
  disconnectHc05,
  ensureHc05Ready,
  getPairedHc05Devices,
  isHc05Supported,
} from '../services/hc05';
import { ParkingSlot } from '../types/parking';

const HC05_DEVICE_NAME = 'HC-05';

export function DashboardScreen() {
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>(initialParkingSlots);
  const [bluetoothSupported, setBluetoothSupported] = useState(true);
  const [bluetoothReady, setBluetoothReady] = useState(false);
  const [bluetoothLoading, setBluetoothLoading] = useState(false);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [pairedDeviceCount, setPairedDeviceCount] = useState(0);
  const [lastBluetoothMessage, setLastBluetoothMessage] = useState('Connect HC-05 to begin live control.');

  const stats = useMemo(() => {
    const total = parkingSlots.length;
    const available = parkingSlots.filter((slot) => slot.status === 'available').length;
    const occupied = parkingSlots.filter((slot) => slot.status === 'occupied').length;
    const free = total - occupied;
    const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, available, occupied, free, occupancy };
  }, [parkingSlots]);

  useEffect(() => {
    let cancelled = false;

    const requestBluetoothPermissions = async (): Promise<boolean> => {
      if (Platform.OS !== 'android') {
        return true;
      }

      try {
        if (Platform.Version >= 31) {
          // Android 12+
          const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]);
          const allGranted = Object.values(result).every(
            (perm) => perm === PermissionsAndroid.RESULTS.GRANTED
          );
          return allGranted;
        } else {
          // Android 11 and below
          const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          const allGranted = Object.values(result).every(
            (perm) => perm === PermissionsAndroid.RESULTS.GRANTED
          );
          return allGranted;
        }
      } catch (err) {
        console.warn('Permission request failed:', err);
        return false;
      }
    };

    const initializeBluetooth = async () => {
      try {
        const permissionsGranted = await requestBluetoothPermissions();
        if (!permissionsGranted) {
          if (!cancelled) {
            setBluetoothReady(false);
            setLastBluetoothMessage('Bluetooth permissions not granted. Please enable in Settings.');
          }
          return;
        }

        const supported = await isHc05Supported();

        if (cancelled) {
          return;
        }

        setBluetoothSupported(supported);

        if (!supported) {
          setBluetoothReady(false);
          setLastBluetoothMessage('HC-05 requires an Android development build, not Expo Go.');
          return;
        }

        await ensureHc05Ready();

        if (cancelled) {
          return;
        }

        const pairedDevices = await getPairedHc05Devices();

        if (cancelled) {
          return;
        }

        setPairedDeviceCount(pairedDevices.length);
        setBluetoothReady(true);

        if (pairedDevices.length > 0) {
          setLastBluetoothMessage('Paired device found. Tap Connect HC-05 to open the serial link.');
        } else {
          setLastBluetoothMessage('Pair HC-05 in Android Bluetooth settings first.');
        }
      } catch (error) {
        if (!cancelled) {
          setBluetoothReady(false);
          setLastBluetoothMessage(error instanceof Error ? error.message : 'Bluetooth is unavailable.');
        }
      }
    };

    initializeBluetooth();

    return () => {
      cancelled = true;
      disconnectHc05().catch(() => undefined);
    };
  }, []);

  const handleRefresh = () => {
    console.log('Refreshing...');
    setParkingSlots((prev) => [...prev]);
  };

  const handleToggleConnection = async () => {
    if (bluetoothLoading) {
      return;
    }

    setBluetoothLoading(true);

    try {
      if (connectedDeviceName) {
        await disconnectHc05();
        setConnectedDeviceName(null);
        setLastBluetoothMessage('Disconnected from HC-05.');
        return;
      }

      const connection = await connectToHc05(HC05_DEVICE_NAME, (message) => {
        setLastBluetoothMessage(`HC-05: ${message}`);
      });

      setConnectedDeviceName(connection.deviceName);
      setBluetoothReady(true);
      setLastBluetoothMessage(`Connected to ${connection.deviceName} (${connection.deviceAddress}).`);
    } catch (error) {
      setLastBluetoothMessage(error instanceof Error ? error.message : 'Unable to connect to HC-05.');
    } finally {
      setBluetoothLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>ParkSense</Text>
            <View style={styles.subtitleWrap}>
              <Ionicons name="radio-outline" size={14} color="#2cd97f" />
              <Text style={styles.subtitle}>Live sensor feed</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.refreshBtn, pressed && styles.refreshBtnPressed]}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh-outline" size={20} color="#d8e2f1" />
            <Text style={styles.refreshLabel}>Refresh</Text>
          </Pressable>
        </View>

        <View style={styles.bluetoothCard}>
          <View style={styles.bluetoothHeader}>
            <View style={styles.bluetoothHeaderLeft}>
              <View
                style={[
                  styles.bluetoothDot,
                  {
                    backgroundColor: connectedDeviceName
                      ? '#2cd97f'
                      : bluetoothSupported && bluetoothReady
                        ? '#ffd23d'
                        : '#ff4e57'
                  }
                ]}
              />
              <View>
                <Text style={styles.bluetoothTitle}>HC-05 Bluetooth</Text>
                <Text style={styles.bluetoothSubtitle}>
                  {connectedDeviceName ? `Connected to ${connectedDeviceName}` : 'Android development build required'}
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.bluetoothAction,
                connectedDeviceName ? styles.bluetoothActionDisconnect : styles.bluetoothActionConnect,
                pressed && styles.bluetoothActionPressed,
                bluetoothLoading && styles.bluetoothActionDisabled
              ]}
              onPress={handleToggleConnection}
              disabled={bluetoothLoading || (!bluetoothSupported && !connectedDeviceName)}
            >
              <Text style={styles.bluetoothActionText}>
                {bluetoothLoading ? 'Working...' : connectedDeviceName ? 'Disconnect' : 'Connect HC-05'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.bluetoothBody}>
            Pair the HC-05 in Android settings first, then open a dev build with Expo Dev Client. Expo Go cannot load Classic Bluetooth.
          </Text>

          <View style={styles.bluetoothMetaRow}>
            <BluetoothMeta label="Supported" value={bluetoothSupported ? 'Yes' : 'No'} />
            <BluetoothMeta label="Ready" value={bluetoothReady ? 'Yes' : 'No'} />
            <BluetoothMeta label="Paired" value={`${pairedDeviceCount}`} />
          </View>

          <Text style={styles.bluetoothMessage}>{lastBluetoothMessage}</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Total Slots"
            value={stats.total}
            accentColor="#98a8c3"
            icon={<MaterialCommunityIcons name="view-grid-outline" size={20} color="#98a8c3" />}
          />
          <StatCard
            label="Available"
            value={stats.available}
            accentColor="#2cd97f"
            icon={<Ionicons name="checkmark-circle-outline" size={20} color="#2cd97f" />}
          />
          <StatCard
            label="Occupied"
            value={stats.occupied}
            accentColor="#ff4e57"
            icon={<MaterialCommunityIcons name="car-outline" size={20} color="#ff4e57" />}
          />
          <StatCard
            label="Free"
            value={stats.free}
            accentColor="#ffd23d"
            icon={<MaterialIcons name="event-seat" size={20} color="#ffd23d" />}
          />
        </View>

        <OccupancyBar percent={stats.occupancy} />

        <Text style={styles.sectionTitle}>Parking Slots</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slotListContent}
        >
          {parkingSlots.map((slot, index) => (
            <SlotCard key={slot.id} slot={slot} index={index} />
          ))}
        </ScrollView>

        <View style={styles.legendWrap}>
          <LegendItem color="#2cd97f" label="Available" />
          <LegendItem color="#ff4e57" label="Occupied" />
        </View>
      </ScrollView>
    </View>
  );
}

type BluetoothMetaProps = {
  label: string;
  value: string;
};

function BluetoothMeta({ label, value }: BluetoothMetaProps) {
  return (
    <View style={styles.bluetoothMetaItem}>
      <Text style={styles.bluetoothMetaLabel}>{label}</Text>
      <Text style={styles.bluetoothMetaValue}>{value}</Text>
    </View>
  );
}

type LegendItemProps = {
  color: string;
  label: string;
};

function LegendItem({ color, label }: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070d16'
  },
  bgOrbTop: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(44, 217, 127, 0.12)'
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: 110,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(45, 97, 255, 0.08)'
  },
  scrollView: {
    flex: 1
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 62,
    paddingBottom: 28
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: {
    color: '#f5f8ff',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -0.6
  },
  subtitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6
  },
  subtitle: {
    color: '#8ea0bc',
    fontSize: 16,
    letterSpacing: 0.3
  },
  refreshBtn: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(130, 152, 188, 0.3)',
    backgroundColor: 'rgba(20, 30, 45, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  refreshBtnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9
  },
  refreshLabel: {
    color: '#d8e2f1',
    fontSize: 14,
    fontWeight: '600'
  },
  bluetoothCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(130, 152, 188, 0.22)',
    backgroundColor: 'rgba(18, 26, 40, 0.92)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  bluetoothHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  bluetoothHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  bluetoothDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }
  },
  bluetoothTitle: {
    color: '#f5f8ff',
    fontSize: 18,
    fontWeight: '700'
  },
  bluetoothSubtitle: {
    marginTop: 2,
    color: '#8ea0bc',
    fontSize: 13
  },
  bluetoothAction: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bluetoothActionConnect: {
    backgroundColor: '#2cd97f'
  },
  bluetoothActionDisconnect: {
    backgroundColor: 'rgba(255, 78, 87, 0.9)'
  },
  bluetoothActionDisabled: {
    opacity: 0.6
  },
  bluetoothActionPressed: {
    transform: [{ scale: 0.98 }]
  },
  bluetoothActionText: {
    color: '#04160d',
    fontSize: 14,
    fontWeight: '800'
  },
  bluetoothBody: {
    marginTop: 12,
    color: '#a8b6cf',
    fontSize: 13,
    lineHeight: 18
  },
  bluetoothMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10
  },
  bluetoothMetaItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(126, 142, 170, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(126, 142, 170, 0.18)'
  },
  bluetoothMetaLabel: {
    color: '#8ea0bc',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1
  },
  bluetoothMetaValue: {
    marginTop: 6,
    color: '#f5f8ff',
    fontSize: 16,
    fontWeight: '700'
  },
  bluetoothMessage: {
    marginTop: 10,
    color: '#d8e2f1',
    fontSize: 12,
    lineHeight: 17
  },
  statsGrid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  sectionTitle: {
    marginTop: 18,
    color: '#b6c4dc',
    fontSize: 13,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 12
  },
  slotListContent: {
    paddingRight: 6
  },
  legendWrap: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 6
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 2
  },
  legendText: {
    color: '#96a8c4',
    fontSize: 16
  }
});
