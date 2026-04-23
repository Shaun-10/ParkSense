import { ParkingSlot, SlotStatus, SlotStatusMeta } from '../types/parking';

export const initialParkingSlots: ParkingSlot[] = [
  { id: 'S1', status: 'available' },
  { id: 'S2', status: 'available' },
  { id: 'S3', status: 'available' },
  { id: 'S4', status: 'occupied' }
];

export const STATUS_META: Record<SlotStatus, SlotStatusMeta> = {
  available: {
    label: 'Available',
    shortLabel: 'AVL',
    color: '#2cd97f',
    glow: 'rgba(44, 217, 127, 0.45)'
  },
  occupied: {
    label: 'Occupied',
    shortLabel: 'OCC',
    color: '#ff4e57',
    glow: 'rgba(255, 78, 87, 0.45)'
  }
};
