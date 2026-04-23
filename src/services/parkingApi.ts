import { ParkingSlot } from '../types/parking';

export type ParkingApiClient = {
  fetchSlots: () => Promise<ParkingSlot[]>;
  reserveSlot: (slotId: string) => Promise<void>;
};

// Placeholder adapter to swap for real Arduino-connected API later.
export const parkingApi: ParkingApiClient = {
  async fetchSlots() {
    return [];
  },
  async reserveSlot() {
    return;
  }
};
