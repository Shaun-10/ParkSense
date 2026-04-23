export type SlotStatus = 'available' | 'occupied';

export type ParkingSlot = {
  id: string;
  status: SlotStatus;
};

export type SlotStatusMeta = {
  label: string;
  shortLabel: string;
  color: string;
  glow: string;
};
